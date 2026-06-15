---
name: ai-gateway-demo
description: Generate and inspect Cloudflare AI Gateway traffic. Use when asked to demo, test, or benchmark AI Gateway features: dynamic routing (model varies by metadata tier/user), caching (show HIT/MISS), spend limits, custom metadata, request retries, log privacy, user-agent visibility (Jun 2026), or multi-provider fallback. Exposes REST API at /api/* and MCP at /mcp with 7 tools. No authentication required to call the demo Worker.
license: Apache-2.0
compatibility: Requires network access to a deployed Cloudflare Worker. Run 'wrangler dev' for local development.
---

# AI Gateway Demo Skill

## When to use

Load this skill when the user wants to:
- Demonstrate any Cloudflare AI Gateway feature in a live session
- Generate diverse gateway traffic (different models, metadata values, user-agents)
- Inspect gateway logs, cache status, dynamic routing decisions, spend limits
- Submit thumbs-up/down feedback on logged responses
- Populate the AI Gateway analytics dashboard during a demo
- Test multiple models or providers simultaneously

## REST API quick start

```bash
# Basic chat — Workers AI, no provider key needed
curl -X POST https://your-worker.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"model":"workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
       "messages":[{"role":"user","content":"Hello!"}]}'

# Dynamic route with tier metadata
curl -X POST https://your-worker.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"model":"dynamic/tier-router",
       "messages":[{"role":"user","content":"Hello!"}],
       "metadata":{"tier":"pro","userId":"u42"}}'

# Simulate an openai-python client (user-agent visible in gateway logs)
curl -X POST https://your-worker.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"model":"workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
       "messages":[{"role":"user","content":"Hello!"}],
       "options":{"userAgent":"openai-python/1.62.0","cacheTtl":300}}'

# Run a preset scenario
curl -X POST https://your-worker.workers.dev/api/scenarios/cache-demo/run

# List all scenarios
curl https://your-worker.workers.dev/api/scenarios
```

## MCP quick start

Add `https://your-worker.workers.dev/mcp` as a Streamable HTTP MCP server.

Available tools:
- `chat` — full gateway request with all options
- `list_scenarios` — list preset demo scenarios
- `run_scenario` — execute a scenario by ID
- `get_log` — retrieve a log entry by cf-aig-log-id
- `submit_feedback` — thumbs-up/down + score on a log
- `compare` — same prompt across 2–5 models simultaneously
- `batch_chat` — up to 20 requests with metadata variations

## Key options (all optional)

| Option | Header | Notes |
|---|---|---|
| `options.userAgent` | `User-Agent` | Visible in gateway logs (Jun 2026) |
| `options.skipCache` | `cf-aig-skip-cache` | |
| `options.cacheTtl` | `cf-aig-cache-ttl` | Seconds |
| `options.collectLogPayload` | `cf-aig-collect-log-payload` | `false` = metadata only |
| `options.maxAttempts` | `cf-aig-max-attempts` | 1–5 |
| `options.retryDelay` | `cf-aig-retry-delay` | ms |
| `options.backoff` | `cf-aig-backoff` | constant/linear/exponential |
| `options.requestTimeout` | `cf-aig-request-timeout` | ms |
| `options.extraHeaders` | forwarded as-is | escape hatch for future headers |

## Response gateway metadata

Every `/api/chat` response includes a `gateway` object:
- `logId` — cf-aig-log-id (use for feedback / getLog)
- `cacheStatus` — HIT | MISS | BYPASS | EXPIRED
- `model` — actual model used (differs from requested when using dynamic routes)
- `provider` — cf-aig-provider
- `step` — dynamic route node that answered (cf-aig-step)
- `dlp` — DLP action if a policy matched
- `latencyMs` — wall-clock time
- `usage` — promptTokens / completionTokens / totalTokens

## Full reference

- REST spec: /openapi.json
- LLM description: /llms.txt
- Auth info: /auth.md
