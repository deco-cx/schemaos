# SQLite Integration Plan

This document outlines the work required to integrate each workspace’s built-in SQLite (Cloudflare D1) database with the SchemaOS data-modeler.

## 💡 Why do this?
1. **Single source of truth** – allow users to reflect existing DB schemas inside the canvas.
2. **One-click deployment** – push the model designed in SchemaOS directly to a real database.
3. **Rich AI assistance** – reuse the existing AI pipelines to translate between DB schemas and graph nodes.

## 0 – Current state snapshot
| Area | Status |
|------|--------|
| Database access | Cloudflare exposes `DATABASES_RUN_SQL` but it is _not_ proxied inside `server/main.ts` yet. |
| AI helpers      | `NODE_AI_ASSISTANT` already produces SQL (deterministic & AI based). |
| Schema import   | No direct import from external sources. |
| Schema export   | Generates SQL files only – no execution against a DB. |

---

## 1 – Server-side work
### 1.1 Proxy the DB tool
```ts
// server/main.ts (pseudo-code)
const createRunSqlTool = (env: Env) =>
  createTool({
    id: "RUN_SQL",              // keep short & friendly
    description: "Execute SQL against the workspace SQLite (Cloudflare D1)",
    inputSchema: z.object({
      sql: z.string(),
      params: z.array(z.any()).optional(),
    }),
    outputSchema: DATABASES_RUN_SQLOutputSchema /* imported from deco.gen */,
    execute: async ({ context }) =>
      await env.DECO_CHAT_WORKSPACE_API.DATABASES_RUN_SQL({
        sql: context.sql,
        params: context.params,
      }),
  });
```

* Register the new tool in `withRuntime` next to `AI_GENERATE_OBJECT`.
* **Naming**: surface it to the client as `client.RUN_SQL()` (consistent with AI tool pattern).

### 1.2 Types
Import the generated input/output types from `deco.gen.ts` to avoid `any`.

---

## 2 – Frontend work
### 2.1 RPC helper
`view/src/lib/rpc.ts` already exposes the generated client. After the proxy exists we can call:
```ts
const { result } = await client.RUN_SQL({ sql: "SELECT …" });
```

### 2.2 Import-schema flow
1. Add *Import from DB* button inside **SchemaAssistantModal** (or separate modal).
2. On click:
   1. Call `RUN_SQL` with the canonical introspection query:  
      ```sql
      SELECT m.name AS table_name, p.name AS column_name, p.type AS data_type,
             p.pk AS is_primary_key, p.notnull AS is_not_null
      FROM sqlite_master m
      JOIN pragma_table_info(m.name) p
      WHERE m.type = 'table'
      ORDER BY m.name, p.cid;
      ```
   2. Transform raw rows → intermediate JSON grouped by table.
   3. Feed that JSON + existing Node types to **NODE_AI_ASSISTANT** asking it to “create nodes that represent this schema”.
   4. Merge returned nodes into canvas & store.

### 2.3 Export-schema flow
1. In *Generate SQL* panel, add a toggle **“Execute on workspace DB”**.
2. When enabled:
   1. Skip the deterministic TypeScript `toSQL()` path.
   2. Send current graph structure to **NODE_AI_ASSISTANT**:  
      • prompt: *"Produce valid SQLite DDL for this schema."*
   3. Receive SQL string and immediately call `RUN_SQL` to execute it.
   4. Show success / error toast with rows affected.

---

## 3 – Guard-rails & UX
* **Transactions** – wrap multi-statement executes in a transaction.
* **Dry-run** – for export, preview SQL before execution.
* **Permissions** – ensure only editors can run mutations.
* **Error surfacing** – surface `success=false` or pragma errors to the user politely.

---

## 4 – Testing
* Mock `client.RUN_SQL` in unit tests.
* Integration test (e2e) that imports an example schema and round-trips export.

---

## 5 – Milestones
1. ✅ Proxy `RUN_SQL` tool & smoke test via RPC.
2. 🔄 Import flow UI & AI conversion.
3. 🔄 Export flow (SQL generation → execution).
4. 🔄 Polish UX (dry-run, error handling, docs).

---

## 6 – Risks & mitigations
| Risk | Mitigation |
|------|------------|
| Large schemas → token explosion when sent to AI | Chunk tables or prompt AI to summarise/stream. |
| Breaking existing deterministic SQL generation | Keep option but default to AI; keep fallback path. |
| Accidental destructive operations | Require confirmation + backup (export current schema first). |

---

> **Next action**: Implement *1.1 Proxy the DB tool*