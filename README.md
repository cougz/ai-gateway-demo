# AI Gateway Demo

A Cloudflare Worker that serves a self-contained chat interface for demonstrating every notable [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) feature. Fully agent-ready — exposes REST API, MCP server, and all agent-discovery standards.

## Features Demonstrated

| Feature | How |
|---|---|
| Dynamic Routing | `model: "dynamic/<route-name>"` + metadata |
| Cache Hit/Miss | `options.cacheTtl`, `options.skipCache` — watch `cacheStatus` toggle |
| Log Privacy (Mar 2026) | `options.collectLogPayload: false` — metadata-only logs |
| Retries & Timeouts (Feb–Apr 2026) | `maxAttempts`, `retryDelay`, `backoff`, `requestTimeout` |
| Spend Limits (Jun 2026) | `metadata.userId` scoped budget rules |
| User-Agent Visibility (Jun 2026) | `options.userAgent` — any SDK string, filterable in dashboard |
| Multi-Provider Fallback | Dynamic route: GPT-4.1 → Claude → Llama |
| Custom Metadata | Up to 5 flat key-value pairs — drives routing + spend limits |
| Human Feedback | 👍/👎 + score via `patchLog()` |
| Log Retrieval | `getLog()` via Workers binding |

## Three Surfaces

- **UI** — chat interface at `/`
- **REST API** — `POST /api/chat`, `GET /api/scenarios`, `POST /api/scenarios/:id/run`, `POST /api/feedback`, `GET /api/log/:id`
- **MCP** — Streamable HTTP at `/mcp` with 7 tools: `chat`, `list_scenarios`, `run_scenario`, `get_log`, `submit_feedback`, `compare`, `batch_chat`

## Agent-Ready

Passes the [isitagentready.com](https://isitagentready.com) checks:

| Check | Endpoint |
|---|---|
| robots.txt | `/robots.txt` |
| Sitemap | `/sitemap.xml` |
| Link headers | All responses include `Link: </llms.txt>` |
| Content-Signal | All responses include `Content-Signal: ai-input=yes` |
| Markdown negotiation | `Accept: text/markdown` on `/` returns llms.txt |
| llms.txt | `/llms.txt` |
| MCP Server Card | `/.well-known/mcp` |
| API Catalog | `/.well-known/api-catalog` |
| OpenAPI spec | `/openapi.json` |
| OAuth Protected Resource (RFC 9728) | `/.well-known/oauth-protected-resource` |
| A2A Agent Card | `/.well-known/agent.json` |
| Agent Skills | `/.well-known/ai-gateway-demo/SKILL.md` |
| auth.md | `/auth.md` |

## Setup

### 1. Clone and install

```bash
git clone https://github.com/cougz/ai-gateway-demo
cd ai-gateway-demo
npm install
```

### 2. Set secrets

```bash
wrangler secret put CF_API_TOKEN    # Cloudflare API token (AI Gateway + Workers AI)
wrangler secret put CF_ACCOUNT_ID  # Your Cloudflare account ID
wrangler secret put GATEWAY_ID     # AI Gateway name (omit to use "default")
```

Your API token needs: **AI Gateway — Edit**, **Workers AI — Read**.

### 3. Local dev

```bash
npm run dev
```

### 4. Deploy

```bash
npm run deploy
```

## CI/CD via Workers Builds

Workers Builds automatically deploys on every push to `main`.

To connect:
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Workers & Pages → Create
2. Connect GitHub → select `cougz/ai-gateway-demo`
3. Build command: `npm run deploy` (or leave blank — Wrangler auto-detects)
4. Add the three secrets in the Workers Builds environment settings

## Dynamic Route Setup

Dynamic routes must be configured in the AI Gateway dashboard before the corresponding scenarios work.

### `tier-router` route

In the dashboard: **AI Gateway** → your gateway → **Dynamic Routes** → **Add Route** named `tier-router`.

Configure the flow:

```
Start
└─ Conditional: metadata.tier == "enterprise"
   ├─ Yes → Model: openai/gpt-4.1 (no rate limit)
   └─ No → Conditional: metadata.tier == "pro"
            ├─ Yes → Rate Limit: 100 req/hr → Model: openai/gpt-4o-mini
            └─ No (free) → Model: workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast
```

### `multi-provider-fallback` route

```
Start → Model: openai/gpt-4.1
        On error → Model: anthropic/claude-sonnet-4-5
        On error → Model: workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast
```

## MCP Client Setup

### Claude Desktop

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

### Claude Code

```bash
claude mcp add --transport http ai-gateway-demo https://your-worker.workers.dev/mcp
```

### OpenCode

```bash
opencode mcp add https://your-worker.workers.dev/mcp
```

## REST API

Full spec at `/openapi.json`. Quick reference:

```bash
# Chat
curl -X POST /api/chat -d '{
  "model": "dynamic/tier-router",
  "messages": [{"role":"user","content":"Hello!"}],
  "metadata": {"tier":"pro","userId":"u42"},
  "options": {
    "userAgent": "openai-python/1.62.0",
    "cacheTtl": 300,
    "collectLogPayload": false,
    "maxAttempts": 3,
    "backoff": "exponential"
  }
}'

# Run a preset scenario
curl -X POST /api/scenarios/cache-demo/run

# Get log
curl /api/log/<logId>

# Feedback
curl -X POST /api/feedback -d '{"logId":"<id>","feedback":1,"score":90}'
```

## Project Structure

```
src/
├── index.ts          # Hono router — all routes + MCP mount
├── types.ts          # Shared types (GatewayRequest, GatewayResponse, Env)
├── lib/
│   ├── gateway.ts    # Core gateway call — builds headers, parses response headers
│   └── scenarios.ts  # Preset demo scenario definitions
├── handlers/
│   ├── chat.ts       # POST /api/chat
│   ├── feedback.ts   # POST /api/feedback
│   └── log.ts        # GET /api/log/:id
├── mcp/
│   └── server.ts     # McpAgent with 7 tools
├── content.ts        # Static text (robots.txt, llms.txt, openapi, sitemap)
└── ui.ts             # Single-page HTML UI
```

## License

Apache 2.0
