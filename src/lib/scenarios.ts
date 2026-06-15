import type { Scenario } from "../types";

export const SCENARIOS: Scenario[] = [
  {
    id: "tier-routing-free",
    name: "Tier Routing — Free",
    description: "Dynamic route sends free-tier users to Llama 3.3 (Workers AI)",
    explanation: "The gateway reads `metadata.tier` and branches to different model nodes. Free tier → Llama 3.3 (Workers AI, no cost). Watch `cf-aig-model` and `cf-aig-step` in the Gateway Info panel.",
    request: {
      model: "dynamic/tier-router",
      messages: [{ role: "user", content: "What is Cloudflare AI Gateway?" }],
      metadata: { tier: "free", userId: "demo-free" },
    },
  },
  {
    id: "tier-routing-pro",
    name: "Tier Routing — Pro",
    description: "Same dynamic route, pro tier routes to GPT-4o-mini",
    explanation: "Same dynamic route `tier-router`, but `tier: pro`. The gateway branches to a different model node. Compare `cf-aig-step` and `cf-aig-model` with the Free variant — they will differ.",
    request: {
      model: "dynamic/tier-router",
      messages: [{ role: "user", content: "What is Cloudflare AI Gateway?" }],
      metadata: { tier: "pro", userId: "demo-pro" },
    },
  },
  {
    id: "tier-routing-enterprise",
    name: "Tier Routing — Enterprise",
    description: "Enterprise tier routes to the highest-capability model",
    explanation: "Enterprise tier bypasses rate limits and reaches the most capable model configured in the route. All three tier variants use the same `model: dynamic/tier-router` — only the metadata changes.",
    request: {
      model: "dynamic/tier-router",
      messages: [{ role: "user", content: "What is Cloudflare AI Gateway?" }],
      metadata: { tier: "enterprise", userId: "demo-enterprise" },
    },
  },
  {
    id: "cache-demo",
    name: "Cache — Hit / Miss",
    description: "Send twice with the same text to see MISS → HIT",
    explanation: "First request: `cf-aig-cache-status: MISS`. Send the identical message again and it flips to `HIT` — the response is served from cache and latency drops significantly. Cache TTL is set to 300s.",
    request: {
      model: "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      messages: [{ role: "user", content: "What is Cloudflare, in exactly one sentence?" }],
      options: { cacheTtl: 300 },
    },
  },
  {
    id: "log-privacy",
    name: "Log Privacy",
    description: "Metadata-only logging — prompt and response body not stored",
    explanation: "Sets `cf-aig-collect-log-payload: false`. Token counts, cost, model, provider, and duration are still logged in the gateway dashboard — but the raw prompt and response content are not persisted. Ideal for sensitive data.",
    request: {
      model: "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      messages: [{ role: "user", content: "What is the capital of France?" }],
      options: { collectLogPayload: false },
    },
  },
  {
    id: "retries",
    name: "Retry Configuration",
    description: "Exponential backoff with up to 3 attempts on provider errors",
    explanation: "Sends `cf-aig-max-attempts: 3`, `cf-aig-retry-delay: 500ms`, `cf-aig-backoff: exponential`. On a provider failure the gateway retries automatically — no client-side changes needed. Useful when you don't control the caller.",
    request: {
      model: "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      messages: [{ role: "user", content: "Tell me a short joke." }],
      options: { maxAttempts: 3, retryDelay: 500, backoff: "exponential" },
    },
  },
  {
    id: "spend-limits",
    name: "Spend Limits (Jun 2026)",
    description: "Per-user cost budgets enforced via metadata",
    explanation: "Passes `metadata.userId` and `metadata.team`. With a spend limit rule scoped to `metadata.userId` (split by value), each user gets an independent `$X/day` budget tracked in real time. Requests are blocked with 429 when the budget is exhausted — or routed to a cheaper fallback model.",
    request: {
      model: "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      messages: [{ role: "user", content: "Summarise spend limits in AI Gateway in one sentence." }],
      metadata: { userId: "demo-user", team: "engineering" },
    },
  },
  {
    id: "user-agent",
    name: "User Agent (Jun 2026)",
    description: "Simulate an openai-python client — visible in gateway logs",
    explanation: "AI Gateway now captures the User-Agent of every request. This scenario sets `User-Agent: openai-python/1.62.0`. Open the AI Gateway dashboard → Logs and filter by user-agent to see traffic from specific SDKs. Useful for understanding which libraries generate your traffic.",
    request: {
      model: "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      messages: [{ role: "user", content: "Hello from a Python client!" }],
      options: { userAgent: "openai-python/1.62.0" },
    },
  },
  {
    id: "multi-provider",
    name: "Multi-Provider Fallback",
    description: "Dynamic route falls back across providers on error",
    explanation: "Uses a route: GPT-4.1 → Claude Sonnet → Llama 3.3. The `cf-aig-step` header shows which node answered. If the primary provider errors, the gateway retries the next node automatically — `cf-aig-model` and `cf-aig-provider` reveal which one ultimately responded.",
    request: {
      model: "dynamic/multi-provider-fallback",
      messages: [{ role: "user", content: "Which model are you? Be brief." }],
    },
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
