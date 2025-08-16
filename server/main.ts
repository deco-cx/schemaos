// deno-lint-ignore-file require-await
import { withRuntime } from "@deco/workers-runtime";
import {
  createStepFromTool,
  createTool,
  createWorkflow,
} from "@deco/workers-runtime/mastra";
import { z } from "zod";
import type { 
  Env as DecoEnv,
  DATABASES_RUN_SQLInput,
  DATABASES_RUN_SQLOutput
} from "./deco.gen.ts";

interface Env extends DecoEnv {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

const createMyTool = (_env: Env) =>
  createTool({
    id: "MY_TOOL",
    description: "Say hello",
    inputSchema: z.object({ name: z.string() }),
    outputSchema: z.object({ message: z.string() }),
    execute: async ({ context }) => ({
      message: `Hello, ${context.name}!`,
    }),
  });

const createAIGenerateObjectTool = (env: Env) =>
  createTool({
    id: "AI_GENERATE_OBJECT",
    description:
      "Generate structured objects using AI models with JSON schema validation",
    inputSchema: z.object({
      messages: z.array(z.object({
        id: z.string().optional(),
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
        createdAt: z.string().optional(),
        experimental_attachments: z.array(z.object({
          name: z.string().optional(),
          contentType: z.string().optional(),
          url: z.string(),
        })).optional(),
      })),
      schema: z.record(z.any()),
      model: z.string().optional(),
      maxTokens: z.number().optional(),
      temperature: z.number().optional(),
      tools: z.record(z.array(z.string())).optional(),
    }),
    outputSchema: z.object({
      object: z.record(z.any()).optional(),
      usage: z.object({
        promptTokens: z.number(),
        completionTokens: z.number(),
        totalTokens: z.number(),
        transactionId: z.string(),
      }),
      finishReason: z.string().optional(),
    }),
    execute: async ({ context }) => {
      // Proxy to the actual deco platform AI tool
      return await env.DECO_CHAT_WORKSPACE_API.AI_GENERATE_OBJECT({
        messages: context.messages,
        schema: context.schema,
        model: context.model,
        maxTokens: context.maxTokens,
        temperature: context.temperature,
        tools: context.tools,
      });
    },
  });

const createTeamsListTool = (env: Env) =>
  createTool({
    id: "TEAMS_LIST",
    description: "List teams for the current user",
    inputSchema: z.object({}),
    outputSchema: z.array(z.object({
      id: z.number(),
      name: z.string(),
      slug: z.string(),
      theme: z.object({
        picture: z.string().optional(),
        variables: z.record(z.string()).optional(),
      }).optional(),
      created_at: z.string(),
      avatar_url: z.string().optional(),
    })),
    execute: async () => {
      // Proxy to the actual deco platform TEAMS_LIST tool
      const response = await env.USER_MANAGEMENT.TEAMS_LIST({});

      // Parse the response if it's a string (as shown in the example)
      if (typeof response === "string") {
        try {
          return JSON.parse(response);
        } catch (e) {
          console.error("Failed to parse TEAMS_LIST response:", e);
          return [];
        }
      }

      return response || [];
    },
  });

const createRunSqlTool = (env: Env) =>
  createTool({
    id: "RUN_SQL",
    description: "Execute SQL against the workspace SQLite database",
    inputSchema: z.object({
      sql: z.string(),
      params: z.array(z.any()).optional(),
    }),
    outputSchema: z.object({
      result: z.array(z.object({
        meta: z.object({
          changed_db: z.boolean().optional(),
          changes: z.number().optional(),
          duration: z.number().optional(),
          last_row_id: z.number().optional(),
          rows_read: z.number().optional(),
          rows_written: z.number().optional(),
          served_by_primary: z.boolean().optional(),
          served_by_region: z.string().optional(),
        }).optional(),
        results: z.array(z.any()).optional(),
        success: z.boolean().optional(),
      })),
    }),
    execute: async ({ context }) => {
      return await env.DECO_CHAT_WORKSPACE_API.DATABASES_RUN_SQL({
        sql: context.sql,
        params: context.params,
      });
    },
  });

const createGetDatabaseSchemaTool = (env: Env) =>
  createTool({
    id: "GET_DATABASE_SCHEMA",
    description: "Get database schema from SQLite database with optional table filtering",
    inputSchema: z.object({
      tables: z.array(z.string()).optional(),
    }),
    outputSchema: z.object({
      nodes: z.array(z.object({
        id: z.string(),
        name: z.string(),
        fields: z.array(z.object({
          name: z.string(),
          type: z.enum(["string", "number", "boolean", "datetime", "text", "email", "enum"]),
          isPrimary: z.boolean().optional(),
          isNullable: z.boolean().optional(),
        })),
      })),
      edges: z.array(z.object({
        from: z.string(),
        to: z.string(),
        label: z.enum(["1-1", "1-N", "N-N"]),
      })),
    }),
    execute: async ({ context }) => {
      // Build introspection query
      let sql = `SELECT 
                  m.name AS table_name,
                  p.name AS column_name,
                  p.type AS data_type,
                  p.pk AS is_primary_key,
                  p."notnull" AS is_not_null
                FROM 
                  sqlite_master m
                JOIN 
                  pragma_table_info(m.name) p
                WHERE 
                  m.type = 'table'
                  AND m.name NOT LIKE 'sqlite_%'`;
      
      // Add table filter if provided
      if (context.tables && context.tables.length > 0) {
        const tableList = context.tables.map(t => `'${t}'`).join(', ');
        sql += ` AND m.name IN (${tableList})`;
      }
      
      sql += ` ORDER BY m.name, p.cid;`;

      // Execute introspection query
      const response = await env.DECO_CHAT_WORKSPACE_API.DATABASES_RUN_SQL({
        sql,
        params: [],
      });

      if (!response.result?.[0]?.success || !response.result[0].results) {
        throw new Error('Failed to fetch database schema');
      }

      const rows = response.result[0].results as Array<{
        table_name: string;
        column_name: string;
        data_type: string;
        is_primary_key: number;
        is_not_null: number;
      }>;

      // Group by table
      const tableMap = new Map<string, Array<typeof rows[0]>>();
      rows.forEach(row => {
        if (!tableMap.has(row.table_name)) {
          tableMap.set(row.table_name, []);
        }
        tableMap.get(row.table_name)!.push(row);
      });

      // Map SQLite types to schema types
      const mapSQLiteToSchemaType = (sqliteType: string): "string" | "number" | "boolean" | "datetime" | "text" | "email" | "enum" => {
        const type = sqliteType.toUpperCase();
        if (type.includes('INT')) return 'number';
        if (type.includes('TEXT') || type.includes('VARCHAR') || type.includes('CHAR')) return 'string';
        if (type.includes('REAL') || type.includes('FLOAT') || type.includes('DOUBLE')) return 'number';
        if (type.includes('BLOB')) return 'string';
        if (type.includes('BOOL')) return 'boolean';
        if (type.includes('DATE') || type.includes('TIME')) return 'datetime';
        return 'string'; // Default fallback
      };

      // Convert to schema format
      const nodes = Array.from(tableMap.entries()).map(([tableName, columns]) => ({
        id: `table_${tableName}`,
        name: tableName,
        fields: columns.map(col => ({
          name: col.column_name,
          type: mapSQLiteToSchemaType(col.data_type),
          isPrimary: col.is_primary_key === 1,
          isNullable: col.is_not_null === 0
        }))
      }));

      return {
        nodes,
        edges: [] // No relationship inference for now
      };
    },
  });

const createNodeAIAssistantTool = (env: Env) =>
  createTool({
    id: "NODE_AI_ASSISTANT",
    description:
      "AI assistant for schema node operations - editing suggestions and SQL generation",
    inputSchema: z.object({
      nodes: z.array(z.object({
        id: z.string(),
        name: z.string(),
        fields: z.array(z.object({
          id: z.string(),
          name: z.string(),
          type: z.string(),
          required: z.boolean().optional(),
          description: z.string().optional(),
        })),
      })),
      mode: z.enum(["edit", "sql"]),
      model: z.string().optional(),
      temperature: z.number().optional(),
    }),
    outputSchema: z.object({
      result: z.string(),
      usage: z.object({
        promptTokens: z.number(),
        completionTokens: z.number(),
        totalTokens: z.number(),
        transactionId: z.string(),
      }),
      finishReason: z.string().optional(),
    }),
    execute: async ({ context }) => {
      const { nodes, mode, model = "gpt-4o-mini", temperature = 0.3 } = context;

      // Build prompt based on mode
      const nodesDescription = nodes.map((node) => {
        const fieldsText = node.fields.map((field) => {
          let fieldDesc = `  - ${field.name}: ${field.type}`;
          if (field.required) fieldDesc += " (required)";
          if (field.description) fieldDesc += ` - ${field.description}`;
          return fieldDesc;
        }).join("\n");

        return `**${node.name}**\n${fieldsText || "  (no fields defined)"}`;
      }).join("\n\n");

      let prompt: string;
      let schema: Record<string, unknown>;

      if (mode === "edit") {
        prompt =
          `You are a database schema expert. Please analyze the following schema nodes and provide detailed suggestions for improvements, optimizations, or corrections.

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

        schema = {
          type: "object",
          properties: {
            suggestions: {
              type: "string",
              description:
                "Detailed suggestions for improving or editing the selected schema nodes",
            },
          },
          required: ["suggestions"],
        };
      } else {
        prompt =
          `You are a SQL expert. Please generate CREATE TABLE statements for the following schema nodes.

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

        schema = {
          type: "object",
          properties: {
            sql: {
              type: "string",
              description:
                "SQL CREATE TABLE statements for the selected schema nodes",
            },
          },
          required: ["sql"],
        };
      }

      const response = await env.DECO_CHAT_WORKSPACE_API.AI_GENERATE_OBJECT({
        messages: [{
          role: "user",
          content: prompt,
        }],
        schema,
        model,
        temperature,
        maxTokens: 2000,
      });

      if (response.object) {
        const result: string = mode === "edit"
          ? (response.object.suggestions as string) || "No suggestions generated"
          : (response.object.sql as string) || "No SQL generated";

        return {
          result,
          usage: response.usage,
          finishReason: response.finishReason,
        };
      } else {
        throw new Error("AI did not return a valid response");
      }
    },
  });

const createMyWorkflow = (env: Env) => {
  const step = createStepFromTool(createMyTool(env));

  return createWorkflow({
    id: "MY_WORKFLOW",
    inputSchema: z.object({ name: z.string() }),
    outputSchema: z.object({ message: z.string() }),
  })
    .then(step)
    .commit();
};

const fallbackToView = (viewPath: string = "/") => (req: Request, env: Env) => {
  const LOCAL_URL = "http://localhost:4000";
  const url = new URL(req.url);
  const useDevServer = (req.headers.get("origin") || req.headers.get("host"))
    ?.includes("localhost");

  const request = new Request(
    useDevServer
      ? new URL(`${url.pathname}${url.search}`, LOCAL_URL)
      : new URL(viewPath, req.url),
    req,
  );

  return useDevServer ? fetch(request) : env.ASSETS.fetch(request);
};

const { Workflow, ...runtime } = withRuntime<Env>({
  workflows: [createMyWorkflow],
  tools: [
    createMyTool,
    createAIGenerateObjectTool,
    createTeamsListTool,
    createRunSqlTool,
    createGetDatabaseSchemaTool,
    createNodeAIAssistantTool,
  ],
  fetch: fallbackToView("/"),
});

export { Workflow };

export default runtime;
