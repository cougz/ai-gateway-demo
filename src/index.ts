import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types";
import { handleChat } from "./handlers/chat";
import { handleFeedback } from "./handlers/feedback";
import { handleGetLog } from "./handlers/log";
import { SCENARIOS, getScenario } from "./lib/scenarios";
import { callGateway } from "./lib/gateway";
import { buildLlmsTxt, buildSitemap, buildOpenApi, ROBOTS_TXT, AUTH_MD } from "./content";
import { UI_HTML } from "./ui";

// ── Export McpAgent class (required by Wrangler for Durable Object binding) ──
export { AigDemoMcp } from "./mcp/server";

// ── Hono app ──────────────────────────────────────────────────────────────────
const app = new Hono<{ Bindings: Env }>();

app.use("*", cors());

// Request/response logging — visible in Cloudflare dashboard and `wrangler tail`
app.use("*", async (c, next) => {
  const start = Date.now();
  const { method, url } = c.req.raw;
  console.log(`[req] ${method} ${new URL(url).pathname}`);
  await next();
  const ms = Date.now() - start;
  console.log(`[res] ${method} ${new URL(url).pathname} → ${c.res.status} (${ms}ms)`);
});

// Inject agent-readiness headers on every response
app.use("*", async (c, next) => {
  await next();
  c.res.headers.set("Content-Signal", "ai-train=no, search=yes, ai-input=yes");
  c.res.headers.set("Link", '</llms.txt>; rel="describedby", </openapi.json>; rel="service-desc"');
  c.res.headers.set("Vary", "Accept");
});

// ── Discoverability ───────────────────────────────────────────────────────────

app.get("/robots.txt", (c) =>
  new Response(ROBOTS_TXT, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
);

app.get("/sitemap.xml", (c) => {
  const base = new URL(c.req.url).origin;
  return new Response(buildSitemap(base), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
});

// ── Content accessibility ─────────────────────────────────────────────────────

app.get("/llms.txt", (c) => {
  const base = new URL(c.req.url).origin;
  return new Response(buildLlmsTxt(base), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
});

app.get("/auth.md", (c) =>
  new Response(AUTH_MD, { headers: { "Content-Type": "text/markdown; charset=utf-8" } })
);

app.get("/openapi.json", (c) => {
  const base = new URL(c.req.url).origin;
  return c.json(buildOpenApi(base));
});

// ── Protocol discovery (.well-known) ─────────────────────────────────────────

app.get("/.well-known/mcp", (c) => {
  const base = new URL(c.req.url).origin;
  return c.json({
    name: "ai-gateway-demo",
    description:
      "Generate and inspect Cloudflare AI Gateway traffic. " +
      "Demonstrates Dynamic Routing, caching, spend limits, custom metadata, retries, " +
      "log privacy, and observability. All options configurable per request.",
    url: `${base}/mcp`,
    transport: "streamable-http",
    version: "1.0.0",
    tools: ["chat", "list_scenarios", "run_scenario", "get_log", "submit_feedback", "compare", "batch_chat"],
    documentation: `${base}/llms.txt`,
    api_spec: `${base}/openapi.json`,
  });
});

app.get("/.well-known/api-catalog", (c) => {
  const base = new URL(c.req.url).origin;
  return c.json({
    apis: [
      {
        title: "AI Gateway Demo REST API",
        description: "Generate and inspect Cloudflare AI Gateway traffic via REST",
        url: `${base}/openapi.json`,
        type: "openapi",
      },
    ],
  });
});

app.get("/.well-known/oauth-protected-resource", (c) => {
  const base = new URL(c.req.url).origin;
  // No auth required — signals to agents that no OAuth flow is needed
  return c.json({
    resource: base,
    resource_name: "AI Gateway Demo",
    resource_documentation: `${base}/auth.md`,
    bearer_methods_supported: [],
    scopes_supported: [],
  });
});

app.get("/.well-known/agent.json", (c) => {
  // Google A2A Agent Card
  const base = new URL(c.req.url).origin;
  return c.json({
    name: "ai-gateway-demo",
    description: "AI Gateway traffic generator and inspector for Cloudflare AI Gateway demos.",
    url: base,
    version: "1.0.0",
    capabilities: { streaming: false, pushNotifications: false },
    skills: [
      { id: "chat",         name: "Chat via AI Gateway",    description: "Send a message through AI Gateway with full option control." },
      { id: "run_scenario", name: "Run a Demo Scenario",    description: "Execute a preset scenario showcasing a specific AI Gateway feature." },
      { id: "compare",      name: "Compare Models",         description: "Run the same prompt across multiple models simultaneously." },
      { id: "batch_chat",   name: "Batch Traffic",          description: "Send multiple requests with metadata variations to populate analytics." },
    ],
    defaultInputModes:  ["text/plain", "application/json"],
    defaultOutputModes: ["application/json", "text/plain"],
  });
});

app.get("/.well-known/ai-gateway-demo/SKILL.md", async (c) => {
  const base = new URL(c.req.url).origin;
  const content = buildSkillMd(base);
  return new Response(content, { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
});

function buildSkillMd(base: string): string {
  return `---
name: ai-gateway-demo
description: Generate and inspect Cloudflare AI Gateway traffic. Use when asked to demo, test, or benchmark AI Gateway features: dynamic routing (model varies by metadata tier/user), caching (show HIT/MISS), spend limits, custom metadata, request retries, log privacy, user-agent visibility, or multi-provider fallback. Exposes REST API at /api/* and MCP at /mcp with 7 tools.
license: Apache-2.0
compatibility: Requires network access to a deployed Cloudflare Worker.
---

# AI Gateway Demo Skill

## When to use this skill

- Demonstrate or explain Cloudflare AI Gateway features
- Generate diverse gateway traffic (different models, metadata, user-agents)
- Inspect gateway logs, cache status, dynamic routing decisions
- Submit feedback or scores on logged responses
- Populate the AI Gateway analytics dashboard for a live demo

## Quick start — REST

\`\`\`bash
# Basic chat (Workers AI, no provider key needed)
curl -X POST ${base}/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{"model":"workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast","messages":[{"role":"user","content":"Hello!"}]}'

# With metadata (drives dynamic routing)
curl -X POST ${base}/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{"model":"dynamic/tier-router","messages":[{"role":"user","content":"Hello!"}],"metadata":{"tier":"pro","userId":"u42"}}'

# Run a preset scenario
curl -X POST ${base}/api/scenarios/cache-demo/run
\`\`\`

## Quick start — MCP

Add \`${base}/mcp\` as a Streamable HTTP MCP server.
Then call tools: chat, list_scenarios, run_scenario, get_log, submit_feedback, compare, batch_chat.

## Full reference

See ${base}/llms.txt or ${base}/openapi.json
`;
}

// ── REST API ──────────────────────────────────────────────────────────────────

app.post("/api/chat", handleChat);
app.post("/api/feedback", handleFeedback);
app.get("/api/log/:id", handleGetLog);

app.get("/api/scenarios", (c) =>
  c.json(
    SCENARIOS.map((s) => ({
      id:          s.id,
      name:        s.name,
      description: s.description,
      explanation: s.explanation,
      request:     s.request,
    }))
  )
);

app.post("/api/scenarios/:name/run", async (c) => {
  const scenario = getScenario(c.req.param("name"));
  if (!scenario) return c.json({ error: "not_found", message: `Unknown scenario: ${c.req.param("name")}` }, 404);

  let overrides: Record<string, unknown> = {};
  try { overrides = await c.req.json(); } catch { /* no body — that's fine */ }

  const result = await callGateway(
    {
      model:    (overrides.model as string) ?? scenario.request.model ?? "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      messages: scenario.request.messages ?? [{ role: "user", content: "Hello" }],
      metadata: { ...scenario.request.metadata, ...(overrides.metadata as Record<string, string | number | boolean> | undefined) },
      options:  { ...scenario.request.options, ...(overrides.options as Record<string, unknown> | undefined) },
    },
    c.env
  );

  if (!result.ok) {
    const status = result.error.status >= 100 ? result.error.status : 502;
    return c.json(result.error, status as 400 | 429 | 500 | 502);
  }
  return c.json(result.data);
});

// Health check
app.get("/api/health", (c) =>
  c.json({
    ok: true,
    configured: !!(c.env.GATEWAY_ID),
    gatewayId: c.env.GATEWAY_ID || "default",
  })
);

// ── UI — supports markdown content negotiation ────────────────────────────────
app.get("/", (c) => {
  const accept = c.req.header("Accept") ?? "";
  if (accept.includes("text/markdown")) {
    const base = new URL(c.req.url).origin;
    return new Response(buildLlmsTxt(base), {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }
  return c.html(UI_HTML);
});

// ── Main Worker export ────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Route MCP requests to McpAgent (Durable Object backed, Streamable HTTP transport)
    if (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/")) {
      const { AigDemoMcp } = await import("./mcp/server");
      return AigDemoMcp.serve("/mcp", { binding: "AIG_DEMO_MCP" }).fetch(request, env, ctx);
    }

    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
