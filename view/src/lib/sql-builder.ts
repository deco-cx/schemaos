import type { Field, FieldType, RelationStorage } from './schema-types';
import type { ObjectNodeData } from '../store';

// SQL type mapping for different field types
const SQL_TYPE_MAP: Record<FieldType, string> = {
  string: 'VARCHAR(255)',
  number: 'DECIMAL(10,2)',
  boolean: 'BOOLEAN',
  date: 'DATE',
  datetime: 'TIMESTAMP',
  uuid: 'UUID',
  json: 'JSONB',
  array: 'JSONB',
  object: 'JSONB',
  email: 'VARCHAR(255)',
  url: 'TEXT'
};

// Generate SQL column definition for a field
export function generateColumnDefinition(field: Field): string {
  let sqlType: string;
  let fieldName = field.name;
  
  // Handle relation fields
  if (field.relation) {
    if (field.relation.storage === 'foreign-key') {
      // Foreign key fields are typically UUIDs
      sqlType = 'UUID';
      // Ensure field name ends with Id for foreign keys
      if (!fieldName.endsWith('Id')) {
        fieldName = `${fieldName}Id`;
      }
    } else if (field.relation.storage === 'embedded' || field.relation.storage === 'join-table') {
      // Embedded relations and join-table relations don't create columns
      // They're handled differently (JSON or separate table)
      return ''; // Return empty string, will be filtered out
    } else {
      sqlType = 'UUID'; // Default to UUID for unknown storage types
    }
  } else {
    // Regular field
    sqlType = SQL_TYPE_MAP[field.type as keyof typeof SQL_TYPE_MAP] || 'VARCHAR(255)';
  }
  
  let definition = `${fieldName} ${sqlType}`;
  
  if (field.isPrimary) {
    definition += ' PRIMARY KEY';
  }
  
  if (field.required && !field.isPrimary) {
    definition += ' NOT NULL';
  }
  
  if (field.relation && field.relation.isNullable === false) {
    definition += ' NOT NULL';
  }
  
  if (field.description) {
    definition += ` -- ${field.description}`;
  }
  
  return definition;
}

// Generate foreign key constraint based on relation
export function generateForeignKeyConstraint(field: Field, tableName: string): string | null {
  if (!field.relation || field.relation.storage !== 'foreign-key') {
    return null;
  }
  
  // For entity relations, assume the FK references the primary key (id)
  const targetTable = field.relation.targetEntity.toLowerCase().replace(/\s+/g, '_');
  const constraintName = `fk_${tableName}_${field.name}`;
  
  // The field name should end with Id for foreign keys
  const fkFieldName = field.name.endsWith('Id') ? field.name : `${field.name}Id`;
  
  return `CONSTRAINT ${constraintName} FOREIGN KEY (${fkFieldName}) REFERENCES ${targetTable}(id)`;
}

// Generate CREATE TABLE statement for a single node
export function generateCreateTableSQL(nodeData: ObjectNodeData): string {
  const tableName = nodeData.name.toLowerCase().replace(/\s+/g, '_');
  const columns: string[] = [];
  const constraints: string[] = [];
  
  // Process each field
  nodeData.fields.forEach(field => {
    // Add column definition
    const columnDef = generateColumnDefinition(field);
    if (columnDef) { // Only add non-empty definitions
      columns.push(`  ${columnDef}`);
    }
    
    // Add foreign key constraint if applicable
    const fkConstraint = generateForeignKeyConstraint(field, tableName);
    if (fkConstraint) {
      constraints.push(`  ${fkConstraint}`);
    }
  });
  
  // Combine columns and constraints
  const allDefinitions = [...columns, ...constraints];
  
  let sql = `CREATE TABLE ${tableName} (\n${allDefinitions.join(',\n')}\n);`;
  
  // Add comments for embedded and join-table relations
  const relationComments: string[] = [];
  nodeData.fields.forEach(field => {
    if (field.relation) {
      if (field.relation.storage === 'embedded') {
        const arrayNotation = field.relation.isArray ? '[]' : '';
        const nullableNotation = field.relation.isNullable ? '?' : '';
        relationComments.push(`-- ${field.name}: Embedded relation to ${field.relation.targetEntity}${arrayNotation}${nullableNotation} (stored as JSON)`);
      } else if (field.relation.storage === 'join-table') {
        const targetTable = field.relation.targetEntity.toLowerCase().replace(/\s+/g, '_');
        const joinTableName = `${tableName}_${targetTable}`;
        relationComments.push(`-- ${field.name}: Many-to-many relation to ${field.relation.targetEntity} via join table ${joinTableName}`);
      }
    }
  });
  
  if (relationComments.length > 0) {
    sql += '\n\n' + relationComments.join('\n');
  }
  
  return sql;
}

// Generate join table SQL for many-to-many relations
export function generateJoinTableSQL(sourceTable: string, targetTable: string, sourceField: string): string {
  const sourceTableName = sourceTable.toLowerCase().replace(/\s+/g, '_');
  const targetTableName = targetTable.toLowerCase().replace(/\s+/g, '_');
  const joinTableName = `${sourceTableName}_${targetTableName}`;
  
  return `
-- Join table for many-to-many relationship
CREATE TABLE ${joinTableName} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ${sourceTableName}_id UUID NOT NULL,
  ${targetTableName}_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_${joinTableName}_${sourceTableName} FOREIGN KEY (${sourceTableName}_id) REFERENCES ${sourceTableName}(id),
  CONSTRAINT fk_${joinTableName}_${targetTableName} FOREIGN KEY (${targetTableName}_id) REFERENCES ${targetTableName}(id),
  CONSTRAINT uk_${joinTableName} UNIQUE (${sourceTableName}_id, ${targetTableName}_id)
);

-- Indexes for better performance
CREATE INDEX idx_${joinTableName}_${sourceTableName} ON ${joinTableName}(${sourceTableName}_id);
CREATE INDEX idx_${joinTableName}_${targetTableName} ON ${joinTableName}(${targetTableName}_id);`.trim();
}

// Generate complete SQL for multiple nodes with relations
export function generateSchemaSQL(nodes: ObjectNodeData[]): string {
  const tables: string[] = [];
  const joinTables: string[] = [];
  const processedJoinTables = new Set<string>();
  
  // Generate CREATE TABLE statements
  nodes.forEach(node => {
    tables.push(generateCreateTableSQL(node));
    
    // Collect join tables needed
    node.fields.forEach(field => {
      if (field.relation && field.relation.storage === 'join-table') {
        const targetTable = field.relation.targetEntity;
        const sourceTableName = node.name.toLowerCase().replace(/\s+/g, '_');
        const targetTableName = targetTable.toLowerCase().replace(/\s+/g, '_');
        const joinTableKey = [sourceTableName, targetTableName].sort().join('_');
        
        if (!processedJoinTables.has(joinTableKey)) {
          joinTables.push(generateJoinTableSQL(node.name, targetTable, field.name));
          processedJoinTables.add(joinTableKey);
        }
      }
    });
  });
  
  // Combine all SQL
  let sql = '-- Schema Migration SQL\n';
  sql += '-- Generated from SchemaOS\n\n';
  
  if (tables.length > 0) {
    sql += '-- Main Tables\n';
    sql += tables.join('\n\n') + '\n\n';
  }
  
  if (joinTables.length > 0) {
    sql += '-- Join Tables for Many-to-Many Relations\n';
    sql += joinTables.join('\n\n');
  }
  
  return sql;
}

// Generate migration SQL with proper ordering (dependencies first)
export function generateMigrationSQL(nodes: ObjectNodeData[]): string {
  // Simple dependency resolution: tables without foreign keys first
  const tablesWithoutFKs: ObjectNodeData[] = [];
  const tablesWithFKs: ObjectNodeData[] = [];
  
  nodes.forEach(node => {
    const hasForeignKeys = node.fields.some(field => 
      field.relation && field.relation.storage === 'foreign-key'
    );
    
    if (hasForeignKeys) {
      tablesWithFKs.push(node);
    } else {
      tablesWithoutFKs.push(node);
    }
  });
  
  // Generate SQL in dependency order
  const orderedNodes = [...tablesWithoutFKs, ...tablesWithFKs];
  return generateSchemaSQL(orderedNodes);
}

// Utility to validate field types for SQL generation
export function validateFieldForSQL(field: Field): string[] {
  const errors: string[] = [];
  
  // For relation fields, we don't check SQL_TYPE_MAP as the type is an entity name
  if (!field.relation && !SQL_TYPE_MAP[field.type as keyof typeof SQL_TYPE_MAP]) {
    errors.push(`Unsupported field type: ${field.type}`);
  }
  
  if (field.relation) {
    // Relations with foreign-key storage need to generate an ID field
    if (field.relation.storage === 'foreign-key') {
      // The actual SQL field will be generated as UUID or similar
      // No specific validation needed here
    }
    
    if (!field.relation.targetEntity) {
      errors.push(`Relation missing target entity`);
    }
  }
  
  return errors;
}