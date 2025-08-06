import type { ObjectNode } from '../store';

export function buildNodePrompt(nodes: ObjectNode[], mode: 'edit' | 'sql'): string {
  const nodesDescription = nodes.map(node => {
    const fieldsText = node.data.fields.map(field => {
      let fieldDesc = `  - ${field.name}: ${field.type}`;
      if (field.required) fieldDesc += ' (required)';
      if (field.description) fieldDesc += ` - ${field.description}`;
      return fieldDesc;
    }).join('\n');

    return `**${node.data.name}**
${fieldsText || '  (no fields defined)'}`;
  }).join('\n\n');

  if (mode === 'edit') {
    return `You are a database schema expert. Please analyze the following schema nodes and provide detailed suggestions for improvements, optimizations, or corrections.

Consider the following aspects:
- Field types and naming conventions
- Missing important fields
- Relationships between tables
- Indexing recommendations
- Data validation rules
- Performance optimizations

## Schema Nodes:

${nodesDescription}

Please provide comprehensive suggestions in a clear, structured format with explanations for each recommendation.`;
  } else if (mode === 'sql') {
    return `You are a SQL expert. Please generate CREATE TABLE statements for the following schema nodes.

Requirements:
- Use standard SQL syntax compatible with PostgreSQL
- Include appropriate data types
- Add PRIMARY KEY constraints where appropriate
- Include NOT NULL constraints for required fields
- Add comments for table and column descriptions where available
- Use proper naming conventions (snake_case for SQL)

## Schema Nodes:

${nodesDescription}

Please generate clean, well-formatted SQL CREATE TABLE statements for each node.`;
  }

  return `Please analyze the following schema nodes:\n\n${nodesDescription}`;
}