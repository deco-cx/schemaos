import { SchemaSpec, ValidationError, FieldSpec } from '../ai/types';

const RESERVED_KEYWORDS = [
  'abstract', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
  'continue', 'default', 'do', 'double', 'else', 'extends', 'false', 'final',
  'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof',
  'int', 'interface', 'long', 'native', 'new', 'null', 'package', 'private',
  'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super',
  'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'true',
  'try', 'void', 'volatile', 'while', 'select', 'from', 'where', 'order', 'group'
];

export function validateSchema(spec: SchemaSpec): ValidationError[] {
  const errors: ValidationError[] = [];
  const nodeIds = new Set<string>();

  // Validate nodes
  for (const node of spec.nodes) {
    // Check for duplicate node IDs
    if (nodeIds.has(node.id)) {
      errors.push({
        type: 'error',
        nodeId: node.id,
        message: `Duplicate node ID: ${node.id}`
      });
    }
    nodeIds.add(node.id);

    // Check node has at least one field
    if (node.fields.length === 0) {
      errors.push({
        type: 'error',
        nodeId: node.id,
        message: `Node "${node.name}" must have at least one field`
      });
    }

    // Check for primary key
    const primaryFields = node.fields.filter(f => f.isPrimary);
    if (primaryFields.length === 0) {
      errors.push({
        type: 'error',
        nodeId: node.id,
        message: `Node "${node.name}" must have exactly one primary key field`
      });
    } else if (primaryFields.length > 1) {
      errors.push({
        type: 'error',
        nodeId: node.id,
        message: `Node "${node.name}" has multiple primary key fields, only one is allowed`
      });
    }

    // Validate fields
    const fieldNames = new Set<string>();
    for (const field of node.fields) {
      // Check for duplicate field names
      if (fieldNames.has(field.name)) {
        errors.push({
          type: 'error',
          nodeId: node.id,
          fieldName: field.name,
          message: `Duplicate field name: ${field.name}`
        });
      }
      fieldNames.add(field.name);

      // Check for reserved keywords
      if (RESERVED_KEYWORDS.includes(field.name.toLowerCase())) {
        errors.push({
          type: 'warning',
          nodeId: node.id,
          fieldName: field.name,
          message: `Field name "${field.name}" is a reserved keyword`
        });
      }

      // Validate field name format (basic check)
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(field.name)) {
        errors.push({
          type: 'error',
          nodeId: node.id,
          fieldName: field.name,
          message: `Field name "${field.name}" must start with a letter and contain only letters, numbers, and underscores`
        });
      }
    }

    // Check for reserved node names
    if (RESERVED_KEYWORDS.includes(node.name.toLowerCase())) {
      errors.push({
        type: 'warning',
        nodeId: node.id,
        message: `Node name "${node.name}" is a reserved keyword`
      });
    }
  }

  // Validate edges
  for (const edge of spec.edges) {
    // Check that referenced nodes exist
    if (!nodeIds.has(edge.from)) {
      errors.push({
        type: 'error',
        message: `Edge references non-existent source node: ${edge.from}`
      });
    }
    if (!nodeIds.has(edge.to)) {
      errors.push({
        type: 'error',
        message: `Edge references non-existent target node: ${edge.to}`
      });
    }

    // For 1-1 and 1-N relationships, check if foreign key exists
    if ((edge.label === '1-1' || edge.label === '1-N') && nodeIds.has(edge.to)) {
      const targetNode = spec.nodes.find(n => n.id === edge.to);
      const sourceNode = spec.nodes.find(n => n.id === edge.from);
      
      if (targetNode && sourceNode) {
        const expectedFkName = `${edge.from}Id`;
        const hasForeignKey = targetNode.fields.some(f => 
          f.name === expectedFkName || f.name === `${edge.from}_id`
        );
        
        if (!hasForeignKey) {
          errors.push({
            type: 'warning',
            nodeId: edge.to,
            message: `Consider adding foreign key field "${expectedFkName}" for relationship with ${sourceNode.name}`
          });
        }
      }
    }
  }

  return errors;
}

export function autoFixSchema(spec: SchemaSpec): SchemaSpec {
  const fixedSpec: SchemaSpec = {
    nodes: spec.nodes.map(node => {
      const fields = [...node.fields];
      
      // Auto-add primary key if missing
      const hasPrimaryKey = fields.some(f => f.isPrimary);
      if (!hasPrimaryKey) {
        fields.unshift({
          name: 'id',
          type: 'string',
          isPrimary: true,
          isNullable: false
        });
      }

      return { ...node, fields };
    }),
    edges: spec.edges
  };

  // Auto-add foreign keys for 1-1 and 1-N relationships
  for (const edge of spec.edges) {
    if (edge.label === '1-1' || edge.label === '1-N') {
      const targetNode = fixedSpec.nodes.find(n => n.id === edge.to);
      const sourceNode = fixedSpec.nodes.find(n => n.id === edge.from);
      
      if (targetNode && sourceNode) {
        const expectedFkName = `${edge.from}Id`;
        const hasForeignKey = targetNode.fields.some(f => 
          f.name === expectedFkName || f.name === `${edge.from}_id`
        );
        
        if (!hasForeignKey) {
          targetNode.fields.push({
            name: expectedFkName,
            type: 'string',
            isNullable: edge.label === '1-1' ? false : true
          });
        }
      }
    }
  }

  return fixedSpec;
}