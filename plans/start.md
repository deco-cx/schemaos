Initial Prompt:

I wanna help to think on an app idea. It's an AI-powered data schema editor. Its goal is to

1) help users prototype a new system of records with data relations and tables 
2) help see the data from databases, APIs from tools that were installed in the current workspace
3) it relies on "bindings", common signatures that different apps may implement like Pagination, with a specific way (odata-like) of returning the data, with the pagination, filtering, sortering and everything. It should support to express the needs of SQL, but also CRM APIs, any type of modular data

I'm not sure whether to include here, but it should be a little thing more to allow to, in the same interface, setup workflows for integrations that:
- Have bult-in webhooks for that type of change required from the data
- Also support data that doesn't have webhooks to it automatically duplicates the data using some kind of strategy, be that bulk, cron jobs, indexing
- Have a standard way to model relations, data augmenting...
- Another app will be used to edit workflows

This app should be radically simple and radically diferente because it leverages AI just-in-time code generation. Take that into consideration. Glue code for different schemas, etc. 

I want to leverage reactflow for this app. 

help me think. Be ambitious. Think like Johny Ive + Charlie Munger.


/*───────────────────────────────────────────────────────────────────────────┐
  SchemaOS — FE‑only Prototype (Mock Data, Zero Backend)
 └───────────────────────────────────────────────────────────────────────────*/

/** 0. Objective
 * Build an interactive ReactFlow canvas where users design a *living schema*
 * by dragging “Objects” (tables / entities) and drawing relationships.
 *
 * ‣ No auth, no real integrations—just JSON mocks and localStorage persistence.
 * ‣ Emulate AI suggestions with deterministic stubs (e.g. setTimeout + sample).
 * ‣ Optimise for UX polish, animation, and clear component boundaries.
 */

/*───────────────────────────────────────────────────────────────────────────┐
  1. Tech Stack (locked for prototype)
 └───────────────────────────────────────────────────────────────────────────*/
export const TECH = {
  framework   : "React 18 + Vite",
  styling     : "Tailwind CSS (JIT)",
  graph       : "ReactFlow v11",
  state       : "Zustand  | useSchemaStore()",
  persistence : "localStorage (versioned JSON)",
  ui_lib      : "shadcn/ui  +   lucide‑react icons",
  testing     : "Vitest + @testing-library/react (optional)",
  build       : "Vite preview, no deployment script",
}

/*───────────────────────────────────────────────────────────────────────────┐
  2. Domain Model (trimmed)
 └───────────────────────────────────────────────────────────────────────────*/
type MockCapability =
  | "PaginatedList"
  | "WebhookSource"
  | "BulkExport";

interface MockBinding {
  id: string;                   // "airtable.customers"
  provider: string;             // "Airtable"
  capabilities: MockCapability[];
  schema: JsonSchema7;
}

interface Field { name: string; type: string }

interface ObjectNode /* ReactFlow node.data */ {
  id: string;
  name: string;
  fields: Field[];
  binding?: MockBinding;        // Optional for “blank” tables
}

interface RelationEdge /* ReactFlow edge.data */ {
  from: string;                 // source node id
  to: string;                   // target node id
  label: "1‑1" | "1‑N" | "N‑N";
}

type SchemaGraph = { nodes: ObjectNode[]; edges: RelationEdge[] };

/*───────────────────────────────────────────────────────────────────────────┐
  3. Mocks
 └───────────────────────────────────────────────────────────────────────────*/
export const MOCK_BINDINGS: MockBinding[] = [
  {
    id: "airtable.customers",
    provider: "Airtable",
    capabilities: ["PaginatedList", "WebhookSource"],
    schema: {/* …simplified schema snippet… */} as JsonSchema7,
  },
  {
    id: "shopify.orders",
    provider: "Shopify",
    capabilities: ["PaginatedList", "BulkExport"],
    schema: {/* … */} as JsonSchema7,
  },
  // Add 3‑5 more to make palette interesting
];

/*───────────────────────────────────────────────────────────────────────────┐
  4. Project File Layout (frontend only)
 └───────────────────────────────────────────────────────────────────────────*/
.
├── src/
│   ├── App.tsx               // <Canvas /> + <SidePanel />
│   ├── canvas/
│   │   ├── Canvas.tsx        // ReactFlow wrapper
│   │   ├── nodes/            // CustomNode.tsx (rounded, status badge)
│   │   └── edges/            // RelationEdge.tsx
│   ├── sidebar/
│   │   ├── PropertyPanel.tsx // tabs: Fields | Binding | AI (mock)
│   │   └── Palette.tsx       // drag sources populated from MOCK_BINDINGS
│   ├── store.ts              // Zustand store for SchemaGraph
│   ├── aiMock.ts             // fakeAI(prompt) → Promise<suggestions>
│   └── index.tsx             // mount + Tailwind
├── public/                   // favicon, manifest
├── tailwind.config.ts
├── vite.config.ts
└── README.md

/*───────────────────────────────────────────────────────────────────────────┐
  5. Key UX Behaviours to Implement
 └───────────────────────────────────────────────────────────────────────────*/
UX = {
  dragObject      : "Drag item from Palette → Canvas; auto‑opens side panel",
  connectEdges    : "Click‑drag edge handles; choose relationship label",
  inlineEditName  : "Double‑click node title → rename",
  fieldEditor     : "Side panel → add/edit/delete fields (text inputs)",
  AIStubButton    : "In 'AI' tab, button “Suggest Fields” calls fakeAI() & merges",
  autosave        : "Debounced (1 s) localStorage.setItem('schema_v1', JSON)",
  resetButton     : "Toolbar top‑right → clears store & localStorage",
  keyboard        : "⌫ deletes selected, ⌘Z undo via Zustand middleware",
  minimap         : "ReactFlow MiniMap bottom‑right",
  emptyState      : "Friendly hero illustration when graph empty",
};
