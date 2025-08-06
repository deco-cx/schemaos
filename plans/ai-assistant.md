/*───────────────────────────────────────────────────────────────────────────┐
  ✦ AI Schema Assistant – Generate & Validate Entity Graphs
 └───────────────────────────────────────────────────────────────────────────*/

/** 1. Goal
 * Ship a first-class **AI Assistant** that converts natural-language prompts
 * into a fully-wired SchemaGraph (tables + relations) with **strict scrutiny**
 * over field types, primary keys, and relationship cardinality.
 *
 * Scope: FE-only, deterministic mock for demo; zero backend calls.
 */

/*───────────────────────────────────────────────────────────────────────────┐
  2. Why Now
 └───────────────────────────────────────────────────────────────────────────*/
// – Reduces friction when prototyping; users describe the domain instead of
//   dragging dozens of nodes/edges.
// – Showcases SchemaOS core value → "from idea ➜ working schema in seconds".
// – Complements AI features in Explorer (filters) & Workflows (triggers).

/*───────────────────────────────────────────────────────────────────────────┐n  3. Domain Types & DSL (draft)                                             n └───────────────────────────────────────────────────────────────────────────*/
export interface FieldSpec {
  name: string;                // "customerId"
  type: "string" | "number" | "boolean" | "datetime" | "text";
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

/* Scrutiny Rules (evaluate before committing to store)
 ---------------------------------------------------------------------------*/
// 1. Every NodeSpec MUST have ≥1 FieldSpec.
// 2. Exactly one FieldSpec.isPrimary === true per NodeSpec.
// 3. EdgeSpec.from / to MUST reference existing NodeSpec ids.
// 4. For 1-1 & 1-N, foreign-key fields must exist or be auto-added.
// 5. No duplicate node ids or field names (per node).
// 6. Reserved Java/Kotlin keywords forbidden as names.

/*───────────────────────────────────────────────────────────────────────────┐n  4. UX Flow                                                             n └───────────────────────────────────────────────────────────────────────────*/
UX = {
  entryPoint  : "Top toolbar ➜ ‘✨ AI Schema’ button",
  modal       : [
    "Step 1 – Prompt  : textarea (‘Describe your domain…’)  + example chips",
    "Step 2 – Summary : list of tables & relations  (read-only)",
    "⟳ Iterate        : edit prompt ▶︎ re-generate (loops back to Step 2)",
    "Step 3 – Apply   : ‘Add to Canvas’ button"
  ],
  inlineAid   : "While typing prompt, mini-preview of detected entities",
  animation   : "Nodes drop onto canvas one by one after apply",
  errorHandle : "Validation issues listed inline; disabled Apply until fixed"
};

/*───────────────────────────────────────────────────────────────────────────┐
  5. File Layout Additions                                                  
 └───────────────────────────────────────────────────────────────────────────*/
.
├── view/src/
│   ├── ai/
│   │   ├── SchemaAssistantModal.tsx     // 3-step wizard UI
│   │   ├── useSchemaAI.ts              // Zustand store & helpers
│   │   └── parsePrompt.ts              // NL ➜ SchemaSpec (mocked)
│   └── hooks/useSchemaStore.ts         // already exists – extend with addMany()
└── tests/ai/
    └── schemaAssistant.test.ts         // vitest happy path + validation errors

/*───────────────────────────────────────────────────────────────────────────┐
  6. Implementation Notes                                                  
 └───────────────────────────────────────────────────────────────────────────*/
// a) parsePrompt.ts is a deterministic stub – use regex + heuristics instead
//    of real LLM call; returns SchemaSpec | ValidationError[]
// b) Validation util lives in view/src/lib/validateSchema.ts  (reusable)
// c) SchemaStore.addMany(spec) inserts nodes & edges atomically (undoable)
// d) Store action emits toast  ‘5 tables & 6 relations added’.

/*───────────────────────────────────────────────────────────────────────────┐
  7. TODO Markers for Cursor                                               
 └───────────────────────────────────────────────────────────────────────────*/
// TODO[ui-modal]         SchemaAssistantModal: Stepper + designs
// TODO[ai-parse]         parsePrompt.nlToSchema(prompt: string): SchemaSpec
// TODO[validation]       implement validateSchema(spec): string[]
// TODO[store-extend]     useSchemaStore.addMany(nodes, edges)
// TODO[wire-button]      Add ‘✨ AI Schema’ button in Canvas toolbar
// NICE-TO-HAVE           ‘Improve Schema’ after creation (iterative edits)
// CUT-SCOPE              Real LLM calls, backend persistence, clustering MDL

/*───────────────────────────────────────────────────────────────────────────┐
  8. Quick Example                                                         
 └───────────────────────────────────────────────────────────────────────────*/
/** Prompt
  "I need Customers with orders. A customer has id, name, email. An order has
   id, createdAt, total. One customer can have many orders." */

// parsePrompt() →
const schema: SchemaSpec = {
  nodes: [
    {
      id: "customers",
      name: "Customers",
      fields: [
        { name: "id",   type: "string",  isPrimary: true  },
        { name: "name", type: "string"                    },
        { name: "email",type: "string"                    },
      ],
    },
    {
      id: "orders",
      name: "Orders",
      fields: [
        { name: "id",        type: "string",  isPrimary: true },
        { name: "createdAt", type: "datetime"                },
        { name: "total",     type: "number"                  },
        { name: "customerId",type: "string"                  }, // FK auto
      ],
    },
  ],
  edges: [
    { from: "customers", to: "orders", label: "1-N" },
  ],
};

/* Validation ✅ → Commit → Nodes + edge appear.
 * If, for instance, Orders lacked primary key, modal Step 2 would show issue:
 *  – "orders: missing primary key" (red)   with an inline AI fix suggestion. */

