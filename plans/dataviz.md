Ok, now I want you to think on how to add data visualization from our system 

Some tools like List_Orders from Shopify, if it complies with a pagination bind, in the "table" node, we should have a way to "enter" in that node data, with a paginated rich table with all sorts of data things people usually need. But organized

Don't think about how it should work, just give me the prompt to showcase that scenario with mockdata. Prompt to Cursor

/*───────────────────────────────────────────────────────────────────────────┐
  ✦ Data Preview Add‑On – SchemaOS FE Mock
 └───────────────────────────────────────────────────────────────────────────*/

/** Scenario
 * When the user double‑clicks an ObjectNode whose binding advertises
 * capability "PaginatedList", open a Drawer that shows a rich, paginated
 * table of mock records for that binding (Shopify Orders example provided).
 * No backend calls – everything lives in memory.
 */

/*───────────────────────────────────────────────────────────────────────────┐
  1. Mock Dataset – Shopify Orders
 └───────────────────────────────────────────────────────────────────────────*/
export const MOCK_ORDERS = Array.from({ length: 123 }).map((_, i) => ({
  id: `#SHP‑${1000 + i}`,
  createdAt: new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10),
  customer: ["Alice", "Bob", "Carla", "Diego"][i % 4],
  status: ["paid", "fulfilled", "refunded"][i % 3],
  total: (Math.random() * 200 + 20).toFixed(2),
}));

/*───────────────────────────────────────────────────────────────────────────┐
  2. New React Components & Files
 └───────────────────────────────────────────────────────────────────────────*/
.
├── src/
│   ├── preview/
│   │   ├── DataDrawer.tsx        // shadcn/ui Drawer wrapper
│   │   ├── PaginatedTable.tsx    // uses TanStack Table v8
│   │   └── usePagination.ts      // local state + slice helpers
│   ├── hooks/
│   │   └── usePreview.ts         // Zustand: {open, node, data, openPreview()}
│   └── styles/
│       └── table.css             // sticky header, zebra rows
/* Add barrel exports to index.ts as needed */

/*───────────────────────────────────────────────────────────────────────────┐
  3. Wiring Instructions
 └───────────────────────────────────────────────────────────────────────────*/
// 1. In Canvas.tsx CustomNode.onDoubleClick → check node.binding.capabilities
//    if includes "PaginatedList":   usePreview.openPreview(nodeId)
// 2. DataDrawer pulls mock by node.binding.id:
//    switch (id) { case "shopify.orders": return MOCK_ORDERS; /*...*/ }
/* Feel free to stub 2‑3 additional datasets for variety. */

/*───────────────────────────────────────────────────────────────────────────┐
  4. PaginatedTable Behaviour (UX spec)
 └───────────────────────────────────────────────────────────────────────────*/
UI = {
  pageSizeOptions  : [10, 25, 50],
  defaultPageSize  : 25,
  columnsAutoInfer : "Introspect first record keys; humanise camelCase",
  sortable         : true (client‑side),
  filterable       : true (simple text contains),
  stickyHeader     : true,
  densityToggle    : compact / comfy buttons (store in localStorage),
  emptyState       : "Illustration + 'No records yet'",
};

/*───────────────────────────────────────────────────────────────────────────┐
  5. TODO Markers for Cursor
 └───────────────────────────────────────────────────────────────────────────*/
// TODO[store‑preview]   implement usePreview() with {open,node,data,page,...}
// TODO[drawer]          DataDrawer.tsx with <Sheet> from shadcn/ui
// TODO[table]           PaginatedTable.tsx using @tanstack/react‑table
// TODO[node‑dblclick]   hook into CustomNode to call openPreview()
// TODO[mock‑route]      map binding.id → dataset (extend switch as you add)
// NICE‑TO‑HAVE          CSV export of current page
// CUT‑SCOPE             Server‑side pagination, real API calls, auth

/*───────────────────────────────────────────────────────────────────────────┐
  6. Quick Test Snippet (Vitest)
 └───────────────────────────────────────────────────────────────────────────*/
import { render, fireEvent, screen } from "@testing-library/react";
it("opens drawer with 25 rows by default", () => {
  render(<CanvasMockWithShopifyNode />);
  fireEvent.doubleClick(screen.getByText("Orders"));
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getAllByRole("row")).toHaveLength(26); // header + 25
});

/*───────────────────────────────────────────────────────────────────────────*
  Commit, run `pnpm dev`, double‑click a Shopify Orders node and enjoy.
 *───────────────────────────────────────────────────────────────────────────*/