// ── Static text content served by route handlers ─────────────────────────────

export const ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /api/
Allow: /api/scenarios

Sitemap: https://ai-gateway-demo.workers.dev/sitemap.xml

# AI crawlers — welcome, no restrictions
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: PerplexityBot
Allow: /
`;

export const AUTH_MD = `# Authentication

## REST API

This Worker requires **no authentication** to call \`/api/*\` endpoints.

The Worker authenticates to Cloudflare AI Gateway internally using a \`CF_API_TOKEN\`
Worker secret. You do not need to supply any credentials to use the demo.

## MCP Server

Connect to \`/mcp\` using any MCP-compatible client (Streamable HTTP transport).
No Authorization header is required.

### Claude Desktop

\`\`\`json
{
  "mcpServers": {
    "ai-gateway-demo": {
      "command": "npx",
      "args": ["mcp-remote", "https://your-worker.workers.dev/mcp"]
    }
  }
}
\`\`\`

### Claude Code

\`\`\`bash
claude mcp add --transport http ai-gateway-demo https://your-worker.workers.dev/mcp
\`\`\`
`;

export function buildLlmsTxt(base: string): string {
  return `# AI Gateway Demo

A Cloudflare Worker that demonstrates Cloudflare AI Gateway using **Workers AI models only**
(no external provider API keys required). Covers real-world scenarios: HIPAA-style log
privacy, per-employee spend limits, SaaS rate limiting, SOC 2 audit trails, FAQ caching,
zero-downtime model failover, dev/prod routing, and budget-aware model degradation.

## Models (all Workers AI — billed through Cloudflare)

- workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast  (large — best quality)
- workers-ai/@cf/meta/llama-3.1-8b-instruct            (medium — balanced)
- workers-ai/@cf/mistral/mistral-7b-instruct-v0.1      (small — cheapest)
- dynamic/<route-name>                                  (dynamic routing in gateway dashboard)

## Key Endpoints

- POST ${base}/api/chat              — Send a message to AI Gateway
- GET  ${base}/api/scenarios         — List preset demo scenarios
- POST ${base}/api/scenarios/:id/run — Run a scenario by ID
- GET  ${base}/api/log/:id           — Retrieve a log entry by ID
- POST ${base}/api/feedback          — Submit thumbs-up/down + score on a log
- GET  ${base}/mcp                   — MCP server (Streamable HTTP — 7 tools)
- GET  ${base}/openapi.json          — Full OpenAPI 3.1 spec

## MCP Tools

| Tool | Description |
|------|-------------|
| chat | Send a message with full gateway option control |
| list_scenarios | List all preset demo scenarios |
| run_scenario | Execute a scenario by ID |
| get_log | Retrieve a gateway log entry |
| submit_feedback | Thumbs-up/down + score on a log |
| compare | Same Workers AI prompt across 2–5 models simultaneously |
| batch_chat | Up to 20 requests with metadata variations |

## Request Options (all optional)

- model: "workers-ai/@cf/..." | "dynamic/<route-name>"
- metadata: {userId, department, env, plan, ...}  (up to 5 entries — drives routing + spend limits)
- options.userAgent: string             (sets User-Agent header, visible in gateway logs — Jun 2026)
- options.skipCache / cacheTtl / cacheKey
- options.collectLogPayload: false      (metadata-only logging, no prompt/response stored — Mar 2026)
- options.maxAttempts / retryDelay / backoff
- options.requestTimeout (ms)
- options.extraHeaders: Record<string,string>

## Authentication

None required on this Worker. Worker authenticates to AI Gateway via CF_API_TOKEN secret.
Workers AI is billed through your Cloudflare account — no external provider keys needed.

## Agent Readiness

- MCP server: ${base}/mcp
- OpenAPI spec: ${base}/openapi.json
- Agent Skills: ${base}/.well-known/ai-gateway-demo/SKILL.md
- API Catalog: ${base}/.well-known/api-catalog
`;
}

export function buildSitemap(base: string): string {
  const urls = [
    "/",
    "/llms.txt",
    "/auth.md",
    "/openapi.json",
    "/api/scenarios",
    "/.well-known/mcp",
    "/.well-known/api-catalog",
    "/.well-known/oauth-protected-resource",
    "/.well-known/agent.json",
    "/.well-known/ai-gateway-demo/SKILL.md",
  ];
  const items = urls.map(u => `  <url><loc>${base}${u}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>`;
}

export function buildOpenApi(base: string): unknown {
  return {
    openapi: "3.1.0",
    info: {
      title: "AI Gateway Demo",
      version: "1.0.0",
      description: "Generate and inspect Cloudflare AI Gateway traffic. Demonstrates Dynamic Routing, caching, spend limits, metadata, retries, and observability.",
    },
    servers: [{ url: base, description: "Cloudflare Worker" }],
    paths: {
      "/api/chat": {
        post: {
          operationId: "chat",
          summary: "Send a message through AI Gateway",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GatewayRequest" },
                examples: {
                  workers_ai_large: {
                    summary: "Workers AI — large model (best quality)",
                    value: { model: "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast", messages: [{ role: "user", content: "Explain the CAP theorem." }] },
                  },
                  workers_ai_medium: {
                    summary: "Workers AI — medium model (balanced)",
                    value: { model: "workers-ai/@cf/meta/llama-3.1-8b-instruct", messages: [{ role: "user", content: "Summarise this in one sentence: 'AI Gateway adds caching, rate limiting, and observability to AI API calls.'" }] },
                  },
                  dynamic_spend_limit: {
                    summary: "Dynamic route + per-user spend limit metadata",
                    value: { model: "dynamic/cost-aware", messages: [{ role: "user", content: "Hello!" }], metadata: { userId: "emp-1042", department: "engineering" } },
                  },
                  compliance_privacy: {
                    summary: "Compliance — metadata-only logging (no PHI stored)",
                    value: { model: "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast", messages: [{ role: "user", content: "Summarise contraindications for metformin." }], metadata: { department: "clinical", dataClass: "PHI" }, options: { collectLog: true, collectLogPayload: false } },
                  },
                  faq_cache: {
                    summary: "FAQ cache — 24h TTL, zero token cost on HIT",
                    value: { model: "workers-ai/@cf/meta/llama-3.1-8b-instruct", messages: [{ role: "user", content: "What are Cloudflare's EU data centre locations?" }], options: { cacheTtl: 86400, cacheKey: "faq-v2" } },
                  },
                  retry_policy: {
                    summary: "Retry policy — exponential backoff, 3 attempts",
                    value: { model: "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast", messages: [{ role: "user", content: "Hello!" }], options: { maxAttempts: 3, retryDelay: 500, backoff: "exponential", requestTimeout: 10000 } },
                  },
                  user_agent: {
                    summary: "User-Agent observability (Jun 2026 feature)",
                    value: { model: "workers-ai/@cf/meta/llama-3.1-8b-instruct", messages: [{ role: "user", content: "Hello!" }], metadata: { team: "finance" }, options: { userAgent: "internal-summariser/2.1 (finance-team)" } },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Success", content: { "application/json": { schema: { $ref: "#/components/schemas/GatewayResponse" } } } },
            "400": { description: "Bad request" },
            "429": { description: "Rate limited or spend limit exceeded" },
            "502": { description: "Gateway or provider error" },
            "503": { description: "Worker not configured (missing secrets)" },
          },
        },
      },
      "/api/scenarios": {
        get: {
          operationId: "listScenarios",
          summary: "List all demo scenarios",
          responses: { "200": { description: "Array of scenario objects" } },
        },
      },
      "/api/scenarios/{id}/run": {
        post: {
          operationId: "runScenario",
          summary: "Execute a named demo scenario",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/GatewayRequest", description: "Optional overrides merged into scenario defaults" } } } },
          responses: { "200": { description: "GatewayResponse" }, "404": { description: "Unknown scenario" } },
        },
      },
      "/api/log/{id}": {
        get: {
          operationId: "getLog",
          summary: "Retrieve an AI Gateway log entry",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "cf-aig-log-id from a previous chat response" }],
          responses: { "200": { description: "Log entry object" } },
        },
      },
      "/api/feedback": {
        post: {
          operationId: "submitFeedback",
          summary: "Submit feedback on a log entry",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["logId", "feedback"],
                  properties: {
                    logId:    { type: "string" },
                    feedback: { type: "integer", enum: [1, -1], description: "1=thumbs up, -1=thumbs down" },
                    score:    { type: "integer", minimum: 0, maximum: 100 },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "{ ok: true, logId }" } },
        },
      },
    },
    components: {
      schemas: {
        GatewayRequest: {
          type: "object",
          required: ["model", "messages"],
          properties: {
            model: {
                type: "string",
                description: "Workers AI model or dynamic route. Examples: 'workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast', 'workers-ai/@cf/meta/llama-3.1-8b-instruct', 'dynamic/<route-name>'",
                examples: [
                  "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
                  "workers-ai/@cf/meta/llama-3.1-8b-instruct",
                  "workers-ai/@cf/mistral/mistral-7b-instruct-v0.1",
                  "dynamic/plan-router",
                  "dynamic/ha-chain",
                  "dynamic/cost-aware",
                ],
              },
            messages: { type: "array", items: { type: "object", properties: { role: { type: "string", enum: ["user", "assistant", "system"] }, content: { type: "string" } } } },
            metadata: { type: "object", description: "Up to 5 flat key-value pairs. Values: string | number | boolean. Drives dynamic routing and spend limits." },
            options: {
              type: "object",
              properties: {
                userAgent:         { type: "string", description: "User-Agent header (visible in gateway logs — Jun 2026)" },
                skipCache:         { type: "boolean" },
                cacheTtl:          { type: "integer", description: "Cache TTL in seconds" },
                cacheKey:          { type: "string" },
                collectLog:        { type: "boolean" },
                collectLogPayload: { type: "boolean", description: "false = metadata-only logging, no prompt/response stored" },
                requestTimeout:    { type: "integer", description: "Timeout in ms" },
                maxAttempts:       { type: "integer", minimum: 1, maximum: 5 },
                retryDelay:        { type: "integer", minimum: 100, maximum: 5000, description: "Retry delay in ms" },
                backoff:           { type: "string", enum: ["constant", "linear", "exponential"] },
                extraHeaders:      { type: "object", additionalProperties: { type: "string" }, description: "Arbitrary extra cf-aig-* headers" },
              },
            },
          },
        },
        GatewayResponse: {
          type: "object",
          properties: {
            message: { type: "string", description: "AI response text" },
            gateway: {
              type: "object",
              properties: {
                logId:       { type: "string", description: "cf-aig-log-id" },
                cacheStatus: { type: "string", enum: ["HIT", "MISS", "BYPASS", "EXPIRED", "UNKNOWN"] },
                model:       { type: "string", description: "Actual model used (cf-aig-model)" },
                provider:    { type: "string", description: "cf-aig-provider" },
                step:        { type: "string", description: "Dynamic route node that answered (cf-aig-step)" },
                dlp:         { description: "DLP action if a policy matched (cf-aig-dlp)" },
                latencyMs:   { type: "integer" },
                usage: {
                  type: "object",
                  properties: {
                    promptTokens:     { type: "integer" },
                    completionTokens: { type: "integer" },
                    totalTokens:      { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}
