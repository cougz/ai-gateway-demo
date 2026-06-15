import type { Scenario } from "../types";

// All scenarios use Workers AI models exclusively — no external provider keys required.
// The Workers AI billing runs through your Cloudflare account via CF_API_TOKEN.
//
// Workers AI models used:
//   LARGE  @cf/meta/llama-3.3-70b-instruct-fp8-fast  — highest quality, fast
//   MEDIUM @cf/meta/llama-3.1-8b-instruct            — good balance, lower cost
//   SMALL  @cf/mistral/mistral-7b-instruct-v0.1      — cheapest, fastest

export const WA_LARGE  = "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast";
export const WA_MEDIUM = "workers-ai/@cf/meta/llama-3.1-8b-instruct";
export const WA_SMALL  = "workers-ai/@cf/mistral/mistral-7b-instruct-v0.1";

export const SCENARIOS: Scenario[] = [

  // ── 1. Healthcare — HIPAA-style PII/PHI safety ──────────────────────────
  {
    id: "healthcare-pii-safety",
    name: "Healthcare — PII Safety",
    description: "Disable prompt/response storage for HIPAA-style compliance",
    explanation: "Healthcare AI must never persist patient data. Setting `cf-aig-collect-log-payload: false` instructs the gateway to log only metadata — token counts, model, cost, duration — without storing the prompt or response body. Audit requirements are met without PHI exposure.",
    request: {
      model: WA_LARGE,
      messages: [{ role: "user", content: "Summarise the key contraindications for metformin in elderly patients with renal impairment." }],
      metadata: { department: "clinical", requestor: "dr-smith", dataClass: "PHI" },
      options: { collectLog: true, collectLogPayload: false },
    },
  },

  // ── 2. Per-Employee AI Budget ────────────────────────────────────────────
  {
    id: "per-employee-budget",
    name: "Per-Employee AI Budget",
    description: "Spend limits scoped to userId — each employee gets a daily cap",
    explanation: "A spend limit rule on the gateway is scoped to `metadata.userId` with 'split by value'. Each unique userId gets an independent budget bucket (e.g. $20/day). When the budget is exhausted the gateway returns 429 — no code changes on the client side required.",
    request: {
      model: WA_MEDIUM,
      messages: [{ role: "user", content: "Draft a concise executive summary of our Q3 cloud infrastructure spend, highlighting the three largest cost drivers." }],
      metadata: { userId: "emp-1042", department: "engineering", costCenter: "CC-ENG-001" },
    },
  },

  // ── 3. SaaS Multi-Tenant Rate Limiting ──────────────────────────────────
  {
    id: "saas-rate-limiting",
    name: "SaaS Multi-Tenant Rate Limiting",
    description: "Dynamic route: free plan → 10 req/hr on small model; paid → large model",
    explanation: "One `plan-router` dynamic route handles all tenants. Free: Rate Limit node (10 req/hr) → small model. Paid: large model, no cap. Switch `metadata.plan` between 'free' and 'paid' to see `cf-aig-model` and `cf-aig-step` change — all without touching application code.",
    request: {
      model: "dynamic/plan-router",
      messages: [{ role: "user", content: "Analyse the sentiment of this review: 'The product works well but onboarding was confusing.'" }],
      metadata: { tenantId: "acme-corp", plan: "free", region: "eu-west" },
    },
  },

  // ── 4. Compliance Audit Trail — SOC 2 ───────────────────────────────────
  {
    id: "compliance-audit-trail",
    name: "Compliance Audit Trail (SOC 2)",
    description: "Full request/response logging with structured identity metadata",
    explanation: "SOC 2 and ISO 27001 require a complete, attributable audit trail for AI usage. Every request is logged with the user identity, purpose, and full prompt/response. Logs are exportable via Logpush to a SIEM. The `requestId` field enables correlation with your own audit system.",
    request: {
      model: WA_LARGE,
      messages: [{ role: "user", content: "Review this contract clause for GDPR compliance risks: 'Data may be shared with third parties for analytics purposes.'" }],
      metadata: { userId: "jane.doe@corp.com", purpose: "contract-review", requestId: "req-8f2a1b" },
      options: { collectLog: true, collectLogPayload: true },
    },
  },

  // ── 5. High-Traffic FAQ Cache ────────────────────────────────────────────
  {
    id: "faq-cache",
    name: "High-Traffic FAQ Cache",
    description: "24-hour cache on repeated questions — zero token cost on HIT",
    explanation: "Frequently asked questions cost nothing after the first response. A 24-hour TTL with a version-tagged cache key (`faq-v2`) means identical queries are served in <10ms from cache. Watch `cf-aig-cache-status` flip from MISS to HIT on the second send — and notice the latency drop.",
    request: {
      model: WA_MEDIUM,
      messages: [{ role: "user", content: "What are Cloudflare's data centre locations in Europe?" }],
      options: { cacheTtl: 86400, cacheKey: "faq-v2" },
    },
  },

  // ── 6. Zero-Downtime Model Failover ─────────────────────────────────────
  {
    id: "model-failover",
    name: "Zero-Downtime Model Failover",
    description: "Dynamic route chains three Workers AI models — automatic fallback on error",
    explanation: "A `ha-chain` route sequences: large model → medium model → small model. If the primary errors or times out, the gateway retries the next node automatically. `cf-aig-step` shows which model actually answered. A 2-second timeout (`requestTimeout: 2000`) is set to trigger failover faster in the demo.",
    request: {
      model: "dynamic/ha-chain",
      messages: [{ role: "user", content: "What model answered this request? Identify yourself briefly." }],
      options: { requestTimeout: 2000 },
    },
  },

  // ── 7. Dev / Staging Cost Controls ──────────────────────────────────────
  {
    id: "dev-prod-routing",
    name: "Dev vs. Prod Model Routing",
    description: "env metadata routes staging traffic to the cheap model automatically",
    explanation: "A `env-router` dynamic route reads `metadata.env`: 'staging' or 'dev' → small model (90% cheaper); 'production' → large model. Developers call the same endpoint — no config changes between environments. CI/CD just sets the metadata field.",
    request: {
      model: "dynamic/env-router",
      messages: [{ role: "user", content: "Generate a one-line unit test description for a function that validates email addresses." }],
      metadata: { env: "staging", team: "backend", feature: "email-validator" },
    },
  },

  // ── 8. Budget-Aware Model Degradation ───────────────────────────────────
  {
    id: "budget-degradation",
    name: "Budget-Aware Model Degradation",
    description: "Spend limit on large model silently falls back to small — no 429",
    explanation: "A Budget Limit node on the `cost-aware` route sets a daily cap on the large model. When exceeded, instead of returning 429, the gateway routes to the small model as a fallback. Users get a degraded but functional experience. `cf-aig-model` in the response reveals which model handled the request.",
    request: {
      model: "dynamic/cost-aware",
      messages: [{ role: "user", content: "Explain the trade-offs between eventual consistency and strong consistency in distributed systems." }],
      metadata: { userId: "demo-user", team: "platform" },
    },
  },

  // ── 9. Retry on Flaky Provider ───────────────────────────────────────────
  {
    id: "retry-policy",
    name: "Retry Policy",
    description: "Exponential backoff — 3 attempts, 500ms initial delay",
    explanation: "Production AI calls fail. Setting `cf-aig-max-attempts: 3`, `cf-aig-retry-delay: 500`, `cf-aig-backoff: exponential` makes the gateway retry automatically on provider errors — without any client-side logic. The gateway absorbs transient failures invisibly.",
    request: {
      model: WA_LARGE,
      messages: [{ role: "user", content: "Summarise the CAP theorem in two sentences." }],
      options: { maxAttempts: 3, retryDelay: 500, backoff: "exponential", requestTimeout: 10000 },
    },
  },

  // ── 10. User-Agent Observability ────────────────────────────────────────
  {
    id: "user-agent-observability",
    name: "User-Agent Observability (Jun 2026)",
    description: "Identify which SDK or service is generating traffic in gateway logs",
    explanation: "AI Gateway now captures the User-Agent of every request (Jun 2026). Setting a descriptive value — `internal-summariser/2.1 (finance-team)` — lets you filter logs in the dashboard by team or service. Useful when multiple internal services share one gateway and you need to attribute costs.",
    request: {
      model: WA_MEDIUM,
      messages: [{ role: "user", content: "Summarise: Cloudflare AI Gateway is a proxy layer that adds caching, rate limiting, observability, and dynamic routing to AI provider calls." }],
      metadata: { team: "finance", service: "document-summariser" },
      options: { userAgent: "internal-summariser/2.1 (finance-team)" },
    },
  },

];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
