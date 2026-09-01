import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { wpRequest } from "./wp-client.js";
import { buildProjectGraph } from "./knowledge-graph.js";
import { createMemoryStore } from "./memory-store.js";
import { createElementorService } from "./elementor.js";
import { registerModule, call as platformCall } from "./platform-api.js";
import {
  elementorTools,
  handleElementorInspect,
  handleElementorPatch,
} from "./elementor-tools.js";
import {
  advisorTools,
  handleAdvisorList,
  handleAdvisorRun,
  handleAdvisorRunMany,
} from "./advisor-tools.js";
import {
  agentTools,
  handleAgentList,
  handleAgentRun,
  handleAgentCheckCompatibility,
} from "./agent-tools.js";
import {
  workflowTools,
  handleWorkflowList,
  handleWorkflowRun,
  handleWorkflowCheckCompatibility,
} from "./workflow-tools.js";
import {
  generatorTools,
  handleGeneratorList,
  handleGeneratorGet,
  handleGeneratorGetVariableManifest,
  handleGeneratorRun,
  handleGeneratorSupportsMode,
  handleGeneratorIsAvailable,
  handleGeneratorGetFrameworkCompatibility,
} from "./generator-tools.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const memory = createMemoryStore(path.join(__dirname, "..", "memory"));

// Elementor Document Service — governed read + minimal-diff mutation of an
// existing page's `_elementor_data` via the standard WP REST meta field
// (see elementor.js and ADR AI-SDOM-ADR-0001). Shares the same wpRequest
// and memory store as every other module; no separate auth or transport.
const elementor = createElementorService({ wpRequest, memory });

// Register the three real modules with the minimal Platform API dispatcher.
// Three consumers now exist (Knowledge Graph, Memory, Elementor) — see
// platform-api.js for why this stays intentionally thin.
registerModule("knowledgeGraph", {
  build: () => buildProjectGraph(wpRequest),
});
registerModule("memory", {
  save: memory.saveSnapshot,
  list: memory.listSnapshots,
  get: memory.getSnapshot,
  diff: memory.diffSnapshots,
});
registerModule("elementor", {
  inspect: (p) => elementor.inspect(p),
  patch: (p) => elementor.patch(p),
});

const server = new Server(
  { name: "wp-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------
const tools = [
  {
    name: "wp_list_posts",
    description: "List posts (or any post type) with optional search/status filters.",
    inputSchema: {
      type: "object",
      properties: {
        post_type: { type: "string", default: "posts", description: "REST base, e.g. posts, pages, or a custom post type slug" },
        search: { type: "string" },
        status: { type: "string", default: "publish" },
        per_page: { type: "number", default: 10 },
      },
    },
  },
  {
    name: "wp_get_post",
    description: "Get a single post/page/CPT item by ID.",
    inputSchema: {
      type: "object",
      properties: {
        post_type: { type: "string", default: "posts" },
        id: { type: "number" },
      },
      required: ["id"],
    },
  },
  {
    name: "wp_create_post",
    description: "Create a post, page, or custom post type entry.",
    inputSchema: {
      type: "object",
      properties: {
        post_type: { type: "string", default: "posts" },
        title: { type: "string" },
        content: { type: "string" },
        status: { type: "string", default: "draft" },
        meta: { type: "object", description: "Custom fields / ACF fields keyed by meta key" },
      },
      required: ["title"],
    },
  },
  {
    name: "wp_update_post",
    description: "Update an existing post/page/CPT entry.",
    inputSchema: {
      type: "object",
      properties: {
        post_type: { type: "string", default: "posts" },
        id: { type: "number" },
        title: { type: "string" },
        content: { type: "string" },
        status: { type: "string" },
        meta: { type: "object" },
      },
      required: ["id"],
    },
  },
  {
    name: "wp_delete_post",
    description: "Delete (trash or force-delete) a post/page/CPT entry.",
    inputSchema: {
      type: "object",
      properties: {
        post_type: { type: "string", default: "posts" },
        id: { type: "number" },
        force: { type: "boolean", default: false },
      },
      required: ["id"],
    },
  },
  {
    name: "wp_list_taxonomy_terms",
    description: "List terms for a taxonomy (category, post_tag, or a custom taxonomy).",
    inputSchema: {
      type: "object",
      properties: {
        taxonomy: { type: "string", default: "categories", description: "REST base, e.g. categories, tags, or custom taxonomy slug" },
        search: { type: "string" },
      },
    },
  },
  {
    name: "wp_create_taxonomy_term",
    description: "Create a new term in a taxonomy.",
    inputSchema: {
      type: "object",
      properties: {
        taxonomy: { type: "string", default: "categories" },
        name: { type: "string" },
        parent: { type: "number" },
      },
      required: ["name"],
    },
  },
  {
    name: "wp_upload_media",
    description: "Upload media to the WordPress media library from a public URL or base64 data.",
    inputSchema: {
      type: "object",
      properties: {
        filename: { type: "string" },
        base64_data: { type: "string", description: "Base64-encoded file contents" },
        mime_type: { type: "string", default: "image/jpeg" },
      },
      required: ["filename", "base64_data"],
    },
  },
  {
    name: "wp_get_site_settings",
    description: "Get general site settings (title, tagline, timezone, permalink structure, etc).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "wp_get_project_graph",
    description:
      "Build the Project Knowledge Graph: one snapshot of the connected site's post types, " +
      "taxonomies, active plugins, active theme, REST namespaces, and derived flags " +
      "(ACF / Elementor / WooCommerce detected). Always call this before generating or " +
      "modifying anything on a project you haven't inspected yet in this session.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "wp_snapshot_project",
    description:
      "Build the current Project Knowledge Graph AND persist it to Memory in one step. " +
      "Use this (not wp_get_project_graph alone) when you want the snapshot kept for later " +
      "comparison — e.g. before making a batch of changes, so a diff can show what changed.",
    inputSchema: {
      type: "object",
      properties: {
        client_id: { type: "string", description: "Optional client identifier." },
        project_id: { type: "string", description: "Optional project identifier. At least one of client_id/project_id is required." },
      },
    },
  },
  {
    name: "memory_list_snapshots",
    description: "List stored snapshot metadata (no full data) for a given client/project scope, oldest first.",
    inputSchema: {
      type: "object",
      properties: {
        client_id: { type: "string" },
        project_id: { type: "string" },
      },
    },
  },
  {
    name: "memory_get_snapshot",
    description: "Retrieve one full stored snapshot (including its data) by ID within a scope.",
    inputSchema: {
      type: "object",
      properties: {
        client_id: { type: "string" },
        project_id: { type: "string" },
        id: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "memory_diff_snapshots",
    description: "Compare two stored snapshots within a scope and report which top-level sections changed.",
    inputSchema: {
      type: "object",
      properties: {
        client_id: { type: "string" },
        project_id: { type: "string" },
        from_id: { type: "string" },
        to_id: { type: "string" },
      },
      required: ["from_id", "to_id"],
    },
  },
  {
    name: "wp_rest_request",
    description: "Escalation hatch: make an arbitrary authenticated request to any WP REST API route (e.g. /wc/v3/products, /wp/v2/plugins, a custom plugin's REST namespace). Use the more specific tools first.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Path after /wp-json, e.g. /wc/v3/orders/42" },
        method: { type: "string", default: "GET", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
        body: { type: "object" },
        query: { type: "object" },
      },
      required: ["path"],
    },
  },
  ...advisorTools,
  ...agentTools,
  ...workflowTools,
  ...generatorTools,
  ...elementorTools,
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  console.error(`[MCP] tools/call received: ${name}`);
  console.error(`[MCP] arguments: ${JSON.stringify(args)}`);

  try {
    let result;

    switch (name) {
      case "wp_list_posts": {
        const base = args.post_type || "posts";
        result = await wpRequest(`/wp/v2/${base}`, {
          query: {
            search: args.search,
            status: args.status || "publish",
            per_page: args.per_page || 10,
          },
        });
        break;
      }
      case "wp_get_post": {
        const base = args.post_type || "posts";
        result = await wpRequest(`/wp/v2/${base}/${args.id}`);
        break;
      }
      case "wp_create_post": {
        const base = args.post_type || "posts";
        result = await wpRequest(`/wp/v2/${base}`, {
          method: "POST",
          body: {
            title: args.title,
            content: args.content || "",
            status: args.status || "draft",
            meta: args.meta || {},
          },
        });
        break;
      }
      case "wp_update_post": {
        const base = args.post_type || "posts";
        const { post_type, id, ...fields } = args;
        result = await wpRequest(`/wp/v2/${base}/${id}`, {
          method: "POST",
          body: fields,
        });
        break;
      }
      case "wp_delete_post": {
        const base = args.post_type || "posts";
        result = await wpRequest(`/wp/v2/${base}/${args.id}`, {
          method: "DELETE",
          query: { force: args.force ? "true" : "false" },
        });
        break;
      }
      case "wp_list_taxonomy_terms": {
        const base = args.taxonomy || "categories";
        result = await wpRequest(`/wp/v2/${base}`, {
          query: { search: args.search },
        });
        break;
      }
      case "wp_create_taxonomy_term": {
        const base = args.taxonomy || "categories";
        result = await wpRequest(`/wp/v2/${base}`, {
          method: "POST",
          body: { name: args.name, parent: args.parent },
        });
        break;
      }
      case "wp_upload_media": {
        result = await wpRequest(`/wp/v2/media`, {
          method: "POST",
          body: {
            title: args.filename,
            file: args.base64_data,
            mime_type: args.mime_type,
          },
        });
        break;
      }
      case "wp_get_site_settings": {
        result = await wpRequest(`/wp/v2/settings`);
        break;
      }
      case "wp_get_project_graph": {
        result = await platformCall("knowledgeGraph", "build");
        break;
      }
      case "wp_snapshot_project": {
        const scope = { client_id: args.client_id, project_id: args.project_id };
        const graph = await platformCall("knowledgeGraph", "build");
        result = await platformCall("memory", "save", {
          scope,
          data: graph,
          source: "knowledge-graph",
        });
        break;
      }
      case "memory_list_snapshots": {
        const scope = { client_id: args.client_id, project_id: args.project_id };
        result = await platformCall("memory", "list", { scope });
        break;
      }
      case "memory_get_snapshot": {
        const scope = { client_id: args.client_id, project_id: args.project_id };
        result = await platformCall("memory", "get", { scope, id: args.id });
        break;
      }
      case "memory_diff_snapshots": {
        const scope = { client_id: args.client_id, project_id: args.project_id };
        result = await platformCall("memory", "diff", {
          scope,
          from_id: args.from_id,
          to_id: args.to_id,
        });
        break;
      }
      case "wp_rest_request": {
        result = await wpRequest(args.path, {
          method: args.method || "GET",
          body: args.body,
          query: args.query,
        });
        break;
      }
      case "advisor_list": {
        result = await handleAdvisorList();
        break;
      }
      case "advisor_run": {
        result = await handleAdvisorRun(args);
        break;
      }
      case "advisor_runMany": {
        result = await handleAdvisorRunMany(args);
        break;
      }
      case "agent_list": {
        result = await handleAgentList();
        break;
      }
      case "agent_run": {
        result = await handleAgentRun(args);
        break;
      }
      case "agent_checkCompatibility": {
        result = await handleAgentCheckCompatibility(args);
        break;
      }
      case "workflow_list": {
        result = await handleWorkflowList();
        break;
      }
      case "workflow_run": {
        result = await handleWorkflowRun(args);
        break;
      }
      case "workflow_checkCompatibility": {
        result = await handleWorkflowCheckCompatibility(args);
        break;
      }
      case "generator_list": {
        result = await handleGeneratorList();
        break;
      }
      case "generator_get": {
        result = await handleGeneratorGet(args);
        break;
      }
      case "generator_getVariableManifest": {
        result = await handleGeneratorGetVariableManifest(args);
        break;
      }
      case "generator_run": {
        result = await handleGeneratorRun(args);
        break;
      }
      case "generator_supportsMode": {
        result = await handleGeneratorSupportsMode(args);
        break;
      }
      case "generator_isAvailable": {
        result = await handleGeneratorIsAvailable(args);
        break;
      }
      case "generator_getFrameworkCompatibility": {
        result = await handleGeneratorGetFrameworkCompatibility(args);
        break;
      }
      case "wp_elementor_inspect": {
        result = await handleElementorInspect({ service: elementor, args });
        break;
      }
      case "wp_elementor_patch": {
        result = await handleElementorPatch({ service: elementor, args });
        break;
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    console.error(`[MCP] tools/call completed: ${name}`);

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      isError:
        (["advisor_run", "advisor_runMany", "agent_run", "workflow_run", "generator_run"].includes(name) && result?.success === false) ||
        (["agent_checkCompatibility", "workflow_checkCompatibility"].includes(name) && Boolean(result?.error)),
    };
  } catch (err) {
    console.error(`[MCP] tools/call failed: ${name}: ${err.stack || err.message}`);
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("wp-mcp-server running on stdio");
