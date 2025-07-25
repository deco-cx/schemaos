/*───────────────────────────────────────────────────────────────────────────┐
  ★ Data-Workflows 1.0 – Automations on Top of Any Data Source (FE-only)
 └───────────────────────────────────────────────────────────────────────────*/

/** GOAL
 * Allow makers to attach **Workflows** (automations) to any data-backed entity
 * in the canvas. A workflow listens for data events (new row, field change)
 * and, when triggered, opens Ordenado (https://ordenado.deco.page) in a new tab
 * to let the user orchestrate the rest of the flow. For the demo we only need
 * UX mocks + client-side state (no backend persistence).
 *
 * Relationship with Explorer 2.0: the Workflow UI piggy-backs on the same
 * Entity + Filter DSL, so users can re-use visual/AI filters to scope events.
 */

/*───────────────────────────────────────────────────────────────────────────┐
  1. Extended Trigger-DSL (JSON-serialisable, re-uses Filter from explorer)
 └───────────────────────────────────────────────────────────────────────────*/
import type { Filter } from "../view/src/explorer/filterDsl";

export type Trigger =
  | {
      type: "row_created";      // fires when any new row matches filter
      entityId: string;         // e.g. "discord.messages"
      filter?: Filter[];        // optional extra conditions
    }
  | {
      type: "field_changed";    // fires when field transitions to `to`
      entityId: string;
      field: string;            // e.g. "status"
      to: any;                  // target value e.g. "delivered"
      filter?: Filter[];
    };

export interface WorkflowSpec {
  id: string;                  // uuid
  name: string;                // "Notify on VIP message"
  trigger: Trigger;
}

/* Example – "New message on #support Discord channel" */
{
  id: "wf-1",
  name: "New message on #support",
  trigger: {
    type: "row_created",
    entityId: "discord.messages",
    filter: [
      { field: "channelId", op: "eq", value: "123456" }
    ]
  }
}

/*───────────────────────────────────────────────────────────────────────────┐
  2. File Layout Additions
 └───────────────────────────────────────────────────────────────────────────*/
.
├── view/src/
│   ├── workflows/                    # NEW
│   │   ├── WorkflowModal.tsx         # 3-step wizard (Event ▸ Filters ▸ Review)
│   │   ├── useWorkflows.ts           # Zustand store {list, add, remove}
│   │   └── triggerDsl.ts             # types above + evaluateTrigger(row, prevRow)
│   ├── explorer/FilterBar.tsx        # export helper `currentFilterChips` (reuse)
│   ├── explorer/ExplorerDrawer.tsx   # + "Automations" button (opens modal)
│   ├── canvas/nodes/CustomNode.tsx   # green dot if hasData
│   └── sidebar/Palette.tsx           # badge/legend for “Data-ready” nodes

/*───────────────────────────────────────────────────────────────────────────┐
  3. UX Flow
 └───────────────────────────────────────────────────────────────────────────*/
UX = {
  indicator : "Nodes whose mockData.length > 0 show a small green ⚬ badge",
  openModal : "Explorer ▸ header button ‘⚙︎ Automations’ (visible if hasData)",
  wizard    : [
      "Step 1: Choose Event  (radio)   [• New Row  • Field Change]",
      "Step 2: Filter Rows  (FilterBar reuse + AI helper)",
      "Step 3: Review & Name (text input)  → Save",
  ],
  saveFlow  : "On Save → useWorkflows.add(spec) → toast + show ‘Start Workflow’ button",
  launch    : "Click ‘Start Workflow’ → window.open('https://ordenado.deco.page', '_blank')",
  emptyState: "No workflows yet – illustration + CTA to create first one",
  persist   : "sessionStorage key 'workflows_v1' (array of WorkflowSpec)",
};

/*───────────────────────────────────────────────────────────────────────────┐
  4. TODO Markers for Cursor
 └───────────────────────────────────────────────────────────────────────────*/
// TODO[store-workflows]   implement useWorkflows() with {list, add, remove}
// TODO[trigger-dsl]       triggerDsl.evaluate(row, prevRow, spec): boolean
// TODO[modal-ui]          WorkflowModal: 3-step wizard + validation
// TODO[explorer-btn]      ExplorerDrawer: show Automations button if hasData
// TODO[start-btn]         After save, replace wizard with ‘Start Workflow’ CTA
// TODO[node-indicator]    CustomNode: green badge if node.mockData?.length > 0
// TODO[palette-legend]    Palette: legend entry “Data-ready (⚬)”
// NICE-TO-HAVE            duplicate workflow, edit inline, drag reorder
// CUT-SCOPE               backend persistence, realtime triggers, auth

/*───────────────────────────────────────────────────────────────────────────┐
  5. Quick Test Snippet (Vitest example)
 └───────────────────────────────────────────────────────────────────────────*/
import { render, fireEvent, screen } from "@testing-library/react";
it("creates workflow and shows start button", async () => {
  render(<ExplorerDrawerMock entityId="discord.messages" hasData />);
  fireEvent.click(screen.getByText(/Automations/));
  fireEvent.click(screen.getByLabelText(/New Row/));
  fireEvent.change(screen.getByPlaceholderText(/Name your workflow/), {
    target: { value: "Notify support" },
  });
  fireEvent.click(screen.getByText(/Save/));
  await screen.findByText(/Start Workflow/);
  expect(screen.getByText(/Start Workflow/)).toBeVisible();
});
