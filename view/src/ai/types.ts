export interface FieldSpec {
  name: string;                // "customerId"
  type: "string" | "number" | "boolean" | "datetime" | "text" | "email" | "enum";
  isPrimary?: boolean;
  isNullable?: boolean;
}

export interface NodeSpec {
  id: string;                  // slug-kebab
  name: string;                // "Customers"
  fields: FieldSpec[];
}

export type Cardinality = "1-1" | "1-N" | "N-N";

export interface EdgeSpec {
  from: string;                // node id
  to: string;                  // node id
  label: Cardinality;
}

export interface SchemaSpec {
  nodes: NodeSpec[];
  edges: EdgeSpec[];
}

export interface ValidationError {
  type: 'error' | 'warning';
  nodeId?: string;
  fieldName?: string;
  message: string;
}

export interface ParseResult {
  success: boolean;
  schema?: SchemaSpec;
  errors?: ValidationError[];
}