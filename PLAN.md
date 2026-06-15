# AI Gateway Demo Worker — Project Plan

## Overview

A Cloudflare Worker that serves a self-contained chat demo app showcasing every notable AI Gateway feature. The app is **fully agent-ready** per [isitagentready.com](https://isitagentready.com) and generates traffic through three surfaces:

- **UI** — interactive chat panel in the browser
- **REST API** — clean endpoints callable from `curl`, Postman, scripts
- **MCP server** — tools callable by any MCP-compatible AI assistant (Claude, Claude Code, etc.)

All three call the same `lib/gateway.ts` request builder, so every feature is reachable from every surface. **User-Agent is a first-class configurable field** — you can set it per-request to simulate traffic from different SDKs (`openai-python/1.62.0`, `curl/8.7.1`, a custom app name, etc.).

---

## Architecture

```
Browser
  └── GET /            → serves single-page HTML UI
  └── GET /llms.txt    → LLM-readable service description
  └── GET /openapi.json → full OpenAPI 3.1 spec
  └── GET /.well-known/* → agent-discovery endpoints
  └── POST /api/chat   → worker calls AIG compat endpoint, returns AI response + gateway headers
  └── POST /api/feedback → patchLog (thumbs up/down, score)
  └── GET  /api/log/:id  → getLog (full log detail)
  └── /mcp             → McpAgent (Streamable HTTP)

Cloudflare Worker (Hono router)
  ├── env.AI binding     (for getLog / patchLog via Workers binding)
  └── fetch() to gateway compat endpoint  (for chat — gives full response header access)
       └─ gateway.ai.cloudflare.com/v1/{accountId}/{gatewayId}/compat/chat/completions
```

**Why `fetch()` instead of `env.AI.run()` for chat?**
The Workers binding wraps headers internally, hiding `cf-aig-log-id`, `cf-aig-cache-status`, `cf-aig-model`, `cf-aig-provider`, `cf-aig-step`, and `cf-aig-dlp`. Using `fetch()` directly exposes every response header so the UI can visualise them. The binding is still used for `getLog()` and `patchLog()`.

---

## Directory Layout

```
ai-gateway-demo/
├── wrangler.jsonc
├── package.json                     # hono, agents, @modelcontextprotocol/sdk, zod
├── tsconfig.json
├── SKILL.md                         # Agent Skills — discoverable by coding agents
├── public/                          # Static agent-discovery files (served verbatim)
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── llms.txt                     # llmstxt.org format — explains service to LLMs
│   ├── auth.md                      # Authentication documentation
│   └── openapi.json                 # Full OpenAPI 3.1 spec
└── src/
    ├── index.ts                     # Hono router — mounts everything
    ├── lib/
    │   ├── gateway.ts               # Core: header builder, response parser
    │   └── scenarios.ts             # Preset demo scenario definitions
    ├── handlers/
    │   ├── chat.ts                  # POST /api/chat
    │   ├── feedback.ts              # POST /api/feedback
    │   └── log.ts                   # GET  /api/log/:id
    ├── mcp/
    │   └── server.ts                # McpAgent at /mcp (Streamable HTTP)
    ├── well-known/
    │   ├── mcp-card.ts              # GET /.well-known/mcp
    │   ├── api-catalog.ts           # GET /.well-known/api-catalog
    │   ├── oauth-protected.ts       # GET /.well-known/oauth-protected-resource
    │   ├── agent-card.ts            # GET /.well-known/agent.json  (A2A)
    │   └── agent-skills.ts          # GET /.well-known/ai-gateway-demo/SKILL.md
    ├── middleware/
    │   ├── content-negotiation.ts   # Accept: text/markdown → serve as Markdown
    │   └── agent-headers.ts         # Injects Content-Signal + Link headers on all responses
    ├── types.ts
    └── ui/
        └── index.html               # Full single-page UI (inlined at serve time)
```

---

## Core Types (`src/types.ts`)

All three surfaces share one canonical request shape:

```ts
interface GatewayRequest {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  model: string;   // "openai/gpt-4o-mini" | "dynamic/<route>" | "workers-ai/@cf/..."
  metadata?: Record<string, string | number | boolean>; // up to 5 → cf-aig-metadata

  options?: {
    // ── Identity ────────────────────────────────────────────────────────
    userAgent?: string;          // User-Agent header — simulate any SDK / client
                                 // Presets: "openai-python/1.62", "anthropic-sdk/0.34",
                                 //          "curl/8.7.1", "langchain/0.3", "claude-code/1.0"

    // ── Caching ──────────────────────────────────────────────────────────
    skipCache?: boolean;         // cf-aig-skip-cache
    cacheTtl?: number;           // cf-aig-cache-ttl (seconds)
    cacheKey?: string;           // cf-aig-cache-key

    // ── Logging ──────────────────────────────────────────────────────────
    collectLog?: boolean;        // cf-aig-collect-log
    collectLogPayload?: boolean; // cf-aig-collect-log-payload  (Mar 2026)

    // ── Reliability ──────────────────────────────────────────────────────
    requestTimeout?: number;     // cf-aig-request-timeout (ms)
    maxAttempts?: number;        // cf-aig-max-attempts  (1–5)
    retryDelay?: number;         // cf-aig-retry-delay   (ms, 100–5000)
    backoff?: "constant" | "linear" | "exponential"; // cf-aig-backoff

    // ── Escape hatch ──────────────────────────────────────────────────────
    extraHeaders?: Record<string, string>; // Forwarded to AIG as-is (future/unknown headers)
  };
}

interface GatewayResponse {
  message: string;
  gateway: {
    logId:       string;   // cf-aig-log-id
    cacheStatus: string;   // cf-aig-cache-status: HIT | MISS | BYPASS | EXPIRED
    model:       string;   // cf-aig-model   (actual model — key for dynamic routes)
    provider:    string;   // cf-aig-provider
    step?:       string;   // cf-aig-step    (dynamic route node that answered)
    dlp?:        object;   // cf-aig-dlp     (DLP action if triggered)
    latencyMs:   number;
    usage?: {
      promptTokens:     number;
      completionTokens: number;
      totalTokens:      number;
    };
  };
}
```

---

## `lib/gateway.ts` — Header Assembly

```ts
function buildHeaders(req: GatewayRequest, env: Env): Record<string, string> {
  const h: Record<string, string> = {
    "Content-Type":       "application/json",
    "Authorization":      `Bearer ${env.CF_API_TOKEN}`,
    "cf-aig-authorization": `Bearer ${env.CF_API_TOKEN}`,
    "User-Agent":         req.options?.userAgent ?? "ai-gateway-demo/1.0 (cloudflare-worker)",
  };

  if (req.metadata && Object.keys(req.metadata).length > 0)
    h["cf-aig-metadata"] = JSON.stringify(req.metadata);

  const o = req.options ?? {};
  if (o.skipCache)               h["cf-aig-skip-cache"]            = "true";
  if (o.cacheTtl != null)        h["cf-aig-cache-ttl"]             = String(o.cacheTtl);
  if (o.cacheKey)                h["cf-aig-cache-key"]             = o.cacheKey;
  if (o.collectLog != null)      h["cf-aig-collect-log"]           = String(o.collectLog);
  if (o.collectLogPayload != null) h["cf-aig-collect-log-payload"] = String(o.collectLogPayload);
  if (o.requestTimeout != null)  h["cf-aig-request-timeout"]       = String(o.requestTimeout);
  if (o.maxAttempts != null)     h["cf-aig-max-attempts"]          = String(o.maxAttempts);
  if (o.retryDelay != null)      h["cf-aig-retry-delay"]           = String(o.retryDelay);
  if (o.backoff)                 h["cf-aig-backoff"]               = o.backoff;

  // Escape hatch: arbitrary extra headers merged last (can override anything above)
  Object.assign(h, o.extraHeaders ?? {});

  return h;
}
```

Response header extraction:

```ts
const logId       = response.headers.get("cf-aig-log-id");
const cacheStatus = response.headers.get("cf-aig-cache-status");
const model       = response.headers.get("cf-aig-model");
const provider    = response.headers.get("cf-aig-provider");
const step        = response.headers.get("cf-aig-step");
const dlp         = response.headers.get("cf-aig-dlp");
```

---

## REST API (`/api/*`)

All endpoints return `application/json`. No authentication required by default — the Worker authenticates to the gateway internally.

### `POST /api/chat`

Full `GatewayRequest` body → `GatewayResponse`.

```bash
curl -X POST https://your-worker.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "dynamic/tier-router",
    "messages": [{"role": "user", "content": "Explain caching"}],
    "metadata": {"tier": "pro", "userId": "user-42"},
    "options": {
      "userAgent": "openai-python/1.62.0",
      "cacheTtl": 300,
      "collectLogPayload": false,
      "maxAttempts": 3,
      "backoff": "exponential"
    }
  }'
```

### `GET /api/scenarios`

Returns the static list of demo scenarios (name, description, preset `GatewayRequest` body).

### `POST /api/scenarios/:name/run`

Runs a named scenario with optional overrides merged in. Useful for scripted traffic generation.

```bash
curl -X POST https://your-worker.workers.dev/api/scenarios/tier-routing/run \
  -d '{"metadata": {"userId": "my-test-user"}}'
```

### `GET /api/log/:id`

Retrieves a log entry via `env.AI.gateway().getLog(id)`.

### `POST /api/feedback`

```bash
curl -X POST https://your-worker.workers.dev/api/feedback \
  -d '{"logId": "abc123", "feedback": 1, "score": 85}'
```

---

## MCP Server (`/mcp`)

Uses `McpAgent` from `agents/mcp`. Streamable HTTP transport — works with Claude Desktop, Claude Code, and any standard MCP client.

### Wrangler DO binding

```jsonc
// wrangler.jsonc additions
"durable_objects": {
  "bindings": [{ "name": "AIG_DEMO_MCP", "class_name": "AigDemoMcp" }]
},
"migrations": [{ "tag": "v1", "new_sqlite_classes": ["AigDemoMcp"] }]
```

### Tools

#### `chat`
Send a message to AI Gateway. Full `GatewayRequest` options available.

| Parameter | Type | Description |
|---|---|---|
| `prompt` | string | User message |
| `model` | string? | Default: `workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast` |
| `metadata` | object? | `{userId, tier, team, ...}` |
| `userAgent` | string? | Simulate a specific client SDK |
| `skipCache` | boolean? | |
| `collectLog` | boolean? | |
| `collectLogPayload` | boolean? | |
| `maxAttempts` | number? | |
| `retryDelay` | number? | |
| `backoff` | string? | |
| `requestTimeout` | number? | |

Returns: `message`, `logId`, `model`, `provider`, `cacheStatus`, `step?`, `latencyMs`

#### `run_scenario`
Run a named preset scenario with optional field overrides.

#### `list_scenarios`
Returns scenario names and descriptions — no inputs.

#### `get_log`
Retrieve full log detail by ID via `env.AI.gateway().getLog()`.

#### `submit_feedback`
Patch a log entry with feedback and score via `env.AI.gateway().patchLog()`.

#### `compare`
Run the same prompt against multiple models simultaneously. Returns one result per model — generates varied traffic in a single tool call.

| Parameter | Description |
|---|---|
| `prompt` | Message to send |
| `models` | Array of model strings |
| `metadata` | Applied to all requests |
| `userAgent` | Applied to all requests |

#### `batch_chat`
Send N requests with metadata variations — ideal for simulating a real user population or populating the gateway dashboard during a live demo.

| Parameter | Description |
|---|---|
| `prompt` | Message to send |
| `model` | Model to use |
| `variations` | Array of `{metadata, options?}` — each becomes one request |

### Add to Claude Desktop

```json
{
  "mcpServers": {
    "ai-gateway-demo": {
      "command": "npx",
      "args": ["mcp-remote", "https://your-worker.workers.dev/mcp"]
    }
  }
}
```

---

## Demo Scenarios (`lib/scenarios.ts`)

Pre-built presets that auto-fill model + metadata. Each ships with an explanation card shown in the UI.

### Scenario 1 — Tier-Based Dynamic Routing

Requires a Dynamic Route named `tier-router` configured in the gateway:
```
Start → Conditional: tier == "enterprise" → GPT-4.1 (no limit)
                    : tier == "pro"        → Rate Limit 100/hr → GPT-4o-mini
                    : else (free)          → Llama 3.3 (Workers AI, free)
```

| Preset | `model` | `metadata` |
|---|---|---|
| Free user | `dynamic/tier-router` | `{tier:"free", userId:"demo-free"}` |
| Pro user | `dynamic/tier-router` | `{tier:"pro", userId:"demo-pro"}` |
| Enterprise | `dynamic/tier-router` | `{tier:"enterprise", userId:"demo-ent"}` |

**What it shows:** `cf-aig-model` and `cf-aig-step` change across the three variants — visible proof that routing decisions are being made based on metadata.

### Scenario 2 — Cache Hit / Miss

| Run | `options` | Expected `cacheStatus` |
|---|---|---|
| First | `skipCache: false, cacheTtl: 300` | `MISS` |
| Same text again | `skipCache: false, cacheTtl: 300` | `HIT` |
| Force refresh | `skipCache: true` | `BYPASS` |

### Scenario 3 — Log Privacy (Mar 2026)

Shows `cf-aig-collect-log-payload` header. Tokens/cost/model still tracked; prompt + response body not stored.

| Mode | `options` |
|---|---|
| Full logging (default) | `collectLogPayload: true` |
| Metadata only | `collectLogPayload: false` |

### Scenario 4 — Retries & Timeouts (Feb–Apr 2026)

Pre-fills:
```json
{ "maxAttempts": 3, "retryDelay": 500, "backoff": "exponential", "requestTimeout": 5000 }
```

UI shows the raw headers being sent and explains what happens on a provider failure.

### Scenario 5 — Spend Limits (Jun 2026)

Pre-fills metadata that would trigger a per-user spend limit rule:
```json
{ "userId": "demo-user", "team": "engineering" }
```

Explanation card: "With a spend limit rule scoped to `metadata.userId` (split by value), each user gets their own `$X/day` budget. This request would be blocked with 429 if the budget is exhausted — AI Gateway can also route to a cheaper fallback model instead."

### Scenario 6 — Multi-Provider Fallback

Requires a route named `multi-provider-fallback`:
```
Start → GPT-4.1
        On error → Claude Sonnet
        On error → Llama 3.3 (Workers AI)
```

`cf-aig-step` in the Gateway Info panel shows which node answered — visual proof of fallback.

### Scenario 7 — User Agent Visibility (Jun 2026)

Cycles through different `userAgent` presets with the same prompt. Each request appears in gateway logs with a different user-agent string — filterable in the dashboard.

---

## UI

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Gateway Demo              [Scenario ▾]  [Settings ⚙]       │
├────────────────┬───────────────────────────────┬────────────────┤
│                │                               │                │
│  Metadata      │        Chat                   │  Gateway Info  │
│  Editor        │                               │                │
│                │  [msg bubble]                 │  Model: …      │
│  userId: u1    │  [msg bubble]                 │  Provider: …   │
│  tier: free    │                               │  Cache: MISS ● │
│  team: eng     │  ___________________________  │  Step: node-2  │
│                │  [Type a message…] [Send]     │  Log ID: …  ⧉  │
│  [+ Add field] │                               │  Latency: 1.2s │
│                │                               │  Tokens: 847   │
│                │                               │  DLP: —        │
│                │                               │                │
│                │                               │  👍  👎  [85]  │
│                │                               │  [Submit]      │
└────────────────┴───────────────────────────────┴────────────────┘
```

### Settings Panel (slide-out)

- **User-Agent** — free-text input + quick-select dropdown
  - Default: `ai-gateway-demo/1.0 (cloudflare-worker)`
  - Presets: `openai-python/1.62.0`, `anthropic-sdk-js/0.34.0`, `langchain/0.3.0`, `curl/8.7.1`, `claude-code/1.0`
- **Model** — dropdown + free text
- **Cache** — toggle skip, set TTL, set custom key
- **Logging** — toggle collect-log, toggle collect-log-payload
- **Retries** — max-attempts (1–5), retry-delay (ms), backoff selector
- **Timeout** — request-timeout (ms)
- **Extra Headers** — key-value table for arbitrary `cf-aig-*` headers (advanced, collapsed by default)

### Gateway Info Panel

| Field | Source | Notes |
|---|---|---|
| Model | `cf-aig-model` | Actual model used — changes with dynamic routes |
| Provider | `cf-aig-provider` | |
| Cache Status | `cf-aig-cache-status` | Colour-coded: green=HIT, grey=MISS, amber=BYPASS |
| Dynamic Route Step | `cf-aig-step` | Only shown for `dynamic/*` models |
| Log ID | `cf-aig-log-id` | Click to copy |
| DLP | `cf-aig-dlp` | Shows action + policy if triggered |
| Latency | Worker wall-clock | |
| Tokens in/out/total | Response body `usage` | |
| Feedback | 👍/👎 + score 1–100 | Calls `POST /api/feedback` |

### Traffic Generator (sidebar tab)

Loop control for populating the gateway dashboard during a live demo:
- Select scenario
- Set count (1–50) and delay between requests (0–5 s)
- Click **Generate** — fires requests sequentially, streams each result into the panel

---

## Agent-Readiness Implementation

All five categories from [isitagentready.com](https://isitagentready.com):

### Category 1: Discoverability

**`GET /robots.txt`**
```
User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://your-worker.workers.dev/sitemap.xml

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /
```

**`GET /sitemap.xml`** — lists UI, API endpoints, MCP endpoint, and all discovery files.

**Link response header** — added to all responses by `middleware/agent-headers.ts`:
```
Link: </llms.txt>; rel="describedby", </openapi.json>; rel="service-desc"
```

**DNS for AI Discovery (DNS-AID)** — documented in README as a manual DNS TXT record step (cannot be set from the Worker).

### Category 2: Content Accessibility

**`GET /llms.txt`** — `llmstxt.org` format Markdown file explaining the service, all endpoints, MCP tools, and key request fields.

**Markdown content negotiation** — `middleware/content-negotiation.ts` checks `Accept: text/markdown` on every route. For `GET /`, serves `llms.txt` content. For API routes, returns a structured Markdown description of the endpoint.

### Category 3: Bot Access Control

**Content-Signal header** — added to all responses:
```
Content-Signal: ai-train=no, search=yes, ai-input=yes
```

**Web Bot Auth** — zone-level feature, documented in README as a manual step.

### Category 4: Protocol Discovery

**`GET /.well-known/mcp`** — MCP Server Card:
```json
{
  "name": "ai-gateway-demo",
  "description": "Generate and inspect Cloudflare AI Gateway traffic...",
  "url": "https://your-worker.workers.dev/mcp",
  "transport": "streamable-http",
  "version": "1.0.0",
  "tools": ["chat", "run_scenario", "list_scenarios", "get_log", "submit_feedback", "compare", "batch_chat"],
  "documentation": "https://your-worker.workers.dev/llms.txt"
}
```

**`GET /.well-known/api-catalog`** — API Catalog:
```json
{
  "apis": [{
    "title": "AI Gateway Demo REST API",
    "url": "https://your-worker.workers.dev/openapi.json",
    "type": "openapi"
  }]
}
```

**`GET /openapi.json`** — Full OpenAPI 3.1 spec documenting every endpoint, all `options.*` fields (including `userAgent`), and all gateway response headers captured.

**`GET /.well-known/oauth-protected-resource`** — RFC 9728 metadata (signals to agents that no OAuth flow is required):
```json
{
  "resource": "https://your-worker.workers.dev",
  "resource_name": "AI Gateway Demo",
  "resource_documentation": "https://your-worker.workers.dev/auth.md",
  "bearer_methods_supported": [],
  "scopes_supported": []
}
```

**`GET /auth.md`** — plain-English authentication documentation:
```markdown
# Authentication

This Worker requires no authentication to call its REST API or MCP server.
The Worker authenticates to Cloudflare AI Gateway internally using a
CF_API_TOKEN Worker secret. You do not need to supply any credentials.
```

**`GET /.well-known/agent.json`** — A2A Agent Card (Google A2A protocol) describing capabilities and skills.

**`GET /.well-known/ai-gateway-demo/SKILL.md`** — Agent Skills file, also present as `SKILL.md` in the repo root for coding agents (OpenCode, Claude Code, Cursor, etc.) to discover automatically.

### Category 5: Commerce

Not applicable for this demo (x402, MPP, UCP, ACP). Noted in README.

---

## `SKILL.md` (repo root)

```markdown
---
name: ai-gateway-demo
description: Generate and inspect Cloudflare AI Gateway traffic. Use when asked to demo, test, or benchmark AI Gateway features: dynamic routing (model varies by metadata tier/user), caching (show HIT/MISS), spend limits, custom metadata, request retries, log privacy, or multi-provider fallback. Exposes REST API at /api/* and MCP at /mcp.
license: Apache-2.0
compatibility: Requires network access to a deployed Cloudflare Worker.
---

# AI Gateway Demo Skill

## When to use this skill

Load this skill when the user wants to:
- Demonstrate Cloudflare AI Gateway features
- Generate varied gateway traffic (different models, metadata, user-agents)
- Inspect gateway logs, cache status, dynamic routing decisions
- Submit feedback or scores on logged responses

## Quick start

Send a chat via REST:

    curl -X POST https://your-worker.workers.dev/api/chat \
      -H "Content-Type: application/json" \
      -d '{"model":"workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
           "messages":[{"role":"user","content":"Hello"}]}'

Connect via MCP: add `https://your-worker.workers.dev/mcp` as a Streamable HTTP server.

## Key tools (MCP) / endpoints (REST)

See /llms.txt for the full reference.
```

---

## Secrets

Set via `wrangler secret put`:

| Secret | Description |
|---|---|
| `CF_API_TOKEN` | Cloudflare API token with AI Gateway Read/Edit + Workers AI Read permissions |
| `CF_ACCOUNT_ID` | Cloudflare account ID |
| `GATEWAY_ID` | AI Gateway name (or `"default"`) |

No provider keys needed when using **Unified Billing**. For BYOK, add provider keys to the gateway via the dashboard.

---

## Wrangler Configuration

```jsonc
{
  "name": "ai-gateway-demo",
  "main": "src/index.ts",
  "compatibility_date": "2025-06-01",
  "compatibility_flags": ["nodejs_compat"],

  "ai": {
    "binding": "AI"
  },

  "durable_objects": {
    "bindings": [{ "name": "AIG_DEMO_MCP", "class_name": "AigDemoMcp" }]
  },

  "migrations": [
    { "tag": "v1", "new_sqlite_classes": ["AigDemoMcp"] }
  ],

  "assets": {
    "directory": "./public"
  }
}
```

---

## Implementation Phases

| # | Scope | Est. Time |
|---|---|---|
| 1 | Scaffold: wrangler.jsonc, package.json, tsconfig.json, `src/types.ts`, Hono skeleton | 20 min |
| 2 | `lib/gateway.ts` — full header builder (incl. User-Agent + extraHeaders), response header parser | 30 min |
| 3 | REST handlers: `chat.ts`, `feedback.ts`, `log.ts`, `scenarios.ts` (GET + run) | 30 min |
| 4 | MCP server: `AigDemoMcp` with all 7 tools, all accepting `userAgent` param | 45 min |
| 5 | Agent-readiness: `robots.txt`, `sitemap.xml`, `llms.txt`, `auth.md`, `openapi.json`, all `.well-known/*` handlers | 45 min |
| 6 | Middleware: `content-negotiation.ts` (text/markdown), `agent-headers.ts` (Content-Signal + Link) | 20 min |
| 7 | UI: chat panel, metadata editor, User-Agent field in settings, gateway info panel with all headers | 90 min |
| 8 | UI: scenario preset cards with explanation text, traffic generator panel | 45 min |
| 9 | `SKILL.md` in repo root + README (setup, gateway config, dynamic route JSON examples, MCP client config) | 20 min |

**Total: ~6.5 hours**

---

## Key Technical Notes

1. **Dynamic routes require gateway authentication and BYOK keys.** The README must walk through this setup — the demo is not functional without a pre-configured gateway.

2. **`cf-aig-collect-log-payload: false`** skips payload storage but all other metadata (tokens, cost, model, duration) still logs. This is an important distinction to highlight in the UI explanation card.

3. **User-Agent (Jun 2026)** — set a descriptive `User-Agent` header on all gateway calls from the Worker. This appears in gateway logs and is filterable in the dashboard — a direct visualisation of the Jun 2026 feature.

4. **Spend limits (Jun 2026)** — can only be demonstrated by explaining the concept and showing the metadata being sent. Triggering a 429 requires an actual limit to be configured on the account's gateway.

5. **`cf-aig-step`** only appears in dynamic route responses, not plain model calls. The UI renders it conditionally.

6. **Streaming** — initial version uses non-streaming responses so all headers are available before the body is consumed. A streaming mode can be added as a follow-up (requires SSE on the frontend; note that caching does not work with streaming).

7. **`extraHeaders`** in the request body allows demoing future or undocumented `cf-aig-*` headers without code changes — useful as the AI Gateway product adds new headers over time.

8. **MCP tools `compare` and `batch_chat`** generate diverse traffic in a single call — ideal for populating the gateway analytics dashboard during a live demo.
