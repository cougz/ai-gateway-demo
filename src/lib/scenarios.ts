import type { Scenario } from "../types";

// ── Workers AI model strings ──────────────────────────────────────────────────
// No external provider keys required — billed through the Cloudflare account.
export const WA_LARGE  = "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast";
export const WA_MEDIUM = "workers-ai/@cf/meta/llama-3.1-8b-instruct";
export const WA_SMALL  = "workers-ai/@cf/mistral/mistral-7b-instruct-v0.1";

// ── Dynamic route names (configured in AI Gateway dashboard) ─────────────────
const DR_PLAN    = "dynamic/plan-router";
const DR_ENV     = "dynamic/env-router";
const DR_HA      = "dynamic/ha-chain";
const DR_COST    = "dynamic/cost-aware";

export const SCENARIOS: Scenario[] = [

  // ════════════════════════════════════════════════════════════════════════════
  // DYNAMIC ROUTING — each route has both branches so you can flip the metadata
  // and watch cf-aig-model + cf-aig-step change live in the Gateway Info panel.
  // ════════════════════════════════════════════════════════════════════════════

  // ── plan-router: free tier ───────────────────────────────────────────────
  {
    id: "plan-router-free",
    name: "Plan Router — Free Tier",
    description: "dynamic/plan-router · metadata.plan=free → rate-limited → Mistral 7B",
    explanation: "The `plan-router` route checks `metadata.plan`. Free tenants hit a Rate Limit node (10 req/hr per tenantId) before reaching the small model. Watch the **Model** and **Step** fields in the Gateway Info panel — then switch to the Paid variant to see both change.",
    request: {
      model: DR_PLAN,
      messages: [{ role: "user", content: "Summarise what Cloudflare AI Gateway does in one sentence." }],
      metadata: { tenantId: "acme-corp", plan: "free", region: "eu-west" },
      options: { skipCache: true },
    },
  },

  // ── plan-router: paid tier ───────────────────────────────────────────────
  {
    id: "plan-router-paid",
    name: "Plan Router — Paid Tier",
    description: "dynamic/plan-router · metadata.plan=paid → skips rate limit → Llama 70B",
    explanation: "Same `plan-router` route, same endpoint — only `metadata.plan` changes. Paid traffic skips the rate limit node and reaches the large model directly. Compare the **Model** and **Step** fields with the Free variant: the route graph takes a completely different path.",
    request: {
      model: DR_PLAN,
      messages: [{ role: "user", content: "Summarise what Cloudflare AI Gateway does in one sentence." }],
      metadata: { tenantId: "acme-corp", plan: "paid", region: "eu-west" },
      options: { skipCache: true },
    },
  },

  // ── env-router: staging ──────────────────────────────────────────────────
  {
    id: "env-router-staging",
    name: "Env Router — Staging",
    description: "dynamic/env-router · metadata.env=staging → Mistral 7B (cheap)",
    explanation: "The `env-router` route reads `metadata.env`. Staging traffic lands on the small model — 90% cheaper, no code changes needed. Switch to the Production variant and watch the **Model** field change instantly.",
    request: {
      model: DR_ENV,
      messages: [{ role: "user", content: "Write a one-line description for a function that validates email addresses." }],
      metadata: { env: "staging", team: "backend", feature: "email-validator" },
    },
  },

  // ── env-router: production ───────────────────────────────────────────────
  {
    id: "env-router-production",
    name: "Env Router — Production",
    description: "dynamic/env-router · metadata.env=production → Llama 70B (best quality)",
    explanation: "Same `env-router` route, same code. `metadata.env=production` routes to the large model. Compare the **Model** and **Step** fields with the Staging variant — one metadata value, completely different routing outcome.",
    request: {
      model: DR_ENV,
      messages: [{ role: "user", content: "Write a one-line description for a function that validates email addresses." }],
      metadata: { env: "production", team: "backend", feature: "email-validator" },
    },
  },

  // ── ha-chain: zero-downtime failover ─────────────────────────────────────
  {
    id: "model-failover",
    name: "HA Chain — Model Failover",
    description: "dynamic/ha-chain · Llama 70B → Llama 8B → Mistral 7B on error/timeout",
    explanation: "The `ha-chain` route sequences three Workers AI models with a 5s timeout per node. If the primary errors or times out, the gateway automatically tries the next. The **Step** field in Gateway Info shows which node answered. `requestTimeout: 2000` is deliberately short to make failover visible in a demo.",
    request: {
      model: DR_HA,
      messages: [{ role: "user", content: "Which model are you? Answer in one sentence." }],
      options: { requestTimeout: 2000 },
    },
  },

  // ── cost-aware: budget degradation ───────────────────────────────────────
  {
    id: "budget-degradation",
    name: "Cost-Aware — Budget Degradation",
    description: "dynamic/cost-aware · $0.50/day per userId — degrades to small model silently",
    explanation: "The `cost-aware` route enforces a $0.50/day spend limit per `metadata.userId`. Under budget: Llama 70B. Over budget: Mistral 7B — no 429, no error to the client. The **Model** field in Gateway Info reveals which model actually served the request.",
    request: {
      model: DR_COST,
      messages: [{ role: "user", content: "Explain the trade-offs between eventual consistency and strong consistency." }],
      metadata: { userId: "demo-user", team: "platform" },
    },
  },

  // ════════════════════════════════════════════════════════════════════════════
  // DATA LOSS PREVENTION (DLP)
  // Profile 1 — Financial Information: FLAG, responses checked
  // Profile 2 — Source Code:           BLOCK, requests checked
  // ════════════════════════════════════════════════════════════════════════════

  // ── DLP: Financial Information — FLAG on response ─────────────────────────
  {
    id: "dlp-financial-flag",
    name: "DLP — Financial Info (Flag)",
    description: "Response contains financial data → DLP flags it, request still succeeds",
    explanation: "The 'Financial Information' DLP profile checks responses. The model is asked to produce financial records containing account numbers, credit card data and transaction amounts. The request goes through and you get a response, but the gateway sets `cf-aig-dlp: {action:'FLAG'}` in the headers — visible in the Gateway Info panel. Check the AI Gateway logs to see the flagged entry.",
    request: {
      model: WA_LARGE,
      messages: [{
        role: "user",
        content: "Generate a fictional sample financial statement for 'Acme Corp Q3 2024'. Include: IBAN account numbers, a Visa credit card number, transaction amounts in USD, and quarterly revenue figures. Use realistic-looking but entirely fictional data.",
      }],
      metadata: { scenario: "dlp-test", dataClass: "financial", team: "security" },
      options: { collectLog: true, collectLogPayload: true },
    },
  },

  // ── DLP: Source Code — BLOCK on request ──────────────────────────────────
  {
    id: "dlp-source-code-block",
    name: "DLP — Source Code (Block)",
    description: "Request contains source code → DLP blocks it before reaching the model",
    explanation: "The 'Source Code' DLP profile checks requests. The prompt below contains a JavaScript function with hardcoded API keys and credentials. The gateway intercepts and blocks the request before it ever reaches the model — you will see an error, not an AI response. The `cf-aig-dlp` header in the error response contains the BLOCK action and matched profile IDs.",
    request: {
      model: WA_LARGE,
      messages: [{
        role: "user",
        content: `Please review this authentication function for security issues:

function authenticate(username, password) {
  const API_KEY = 'sk-prod-abc123xyz789secret';
  const DB_PASSWORD = 'P@ssw0rd!SuperSecret2024';
  return fetch('https://api.internal.example.com/auth', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + API_KEY,
      'X-DB-Key': DB_PASSWORD
    },
    body: JSON.stringify({ user: username, pass: password })
  });
}`,
      }],
      metadata: { scenario: "dlp-test", dataClass: "source-code", team: "security" },
      options: { collectLog: true, collectLogPayload: true },
    },
  },

  // ════════════════════════════════════════════════════════════════════════════
  // DIRECT WORKERS AI — gateway features demoed without dynamic routing
  // ════════════════════════════════════════════════════════════════════════════

  // ── HIPAA-style log privacy ───────────────────────────────────────────────
  {
    id: "healthcare-pii-safety",
    name: "Healthcare — Log Privacy",
    description: "collectLogPayload: false — tokens/cost logged, prompt/response not stored",
    explanation: "Healthcare AI must never persist patient data. `cf-aig-collect-log-payload: false` tells the gateway to log only metadata (tokens, cost, model, duration) without storing prompt or response content. Full audit trail without PHI exposure.",
    request: {
      model: WA_LARGE,
      messages: [{ role: "user", content: "Summarise the key contraindications for metformin in elderly patients with renal impairment." }],
      metadata: { department: "clinical", requestor: "dr-smith", dataClass: "PHI" },
      options: { collectLog: true, collectLogPayload: false },
    },
  },

  // ── SOC 2 audit trail ────────────────────────────────────────────────────
  {
    id: "compliance-audit-trail",
    name: "Compliance — Full Audit Trail",
    description: "Full logging with structured identity metadata for SOC 2 / ISO 27001",
    explanation: "SOC 2 requires a complete, attributable AI audit trail. Every request is logged with user identity, purpose, full prompt and response. Exportable via Logpush to a SIEM. The `requestId` field enables correlation with your own audit system.",
    request: {
      model: WA_LARGE,
      messages: [{ role: "user", content: "Review this clause for GDPR risks: 'Data may be shared with third parties for analytics purposes.'" }],
      metadata: { userId: "jane.doe@corp.com", purpose: "contract-review", requestId: "req-8f2a1b" },
      options: { collectLog: true, collectLogPayload: true },
    },
  },

  // ── FAQ cache ────────────────────────────────────────────────────────────
  {
    id: "faq-cache",
    name: "FAQ Cache — Hit / Miss",
    description: "Send twice — MISS then HIT, zero token cost on cached response",
    explanation: "24-hour TTL with a version-tagged cache key. Identical queries are served from cache in <10ms with zero token cost. Send this scenario twice and watch `cf-aig-cache-status` flip from MISS to HIT and latency drop dramatically.",
    request: {
      model: WA_MEDIUM,
      messages: [{ role: "user", content: "What are Cloudflare's data centre locations in Europe?" }],
      options: { cacheTtl: 86400, cacheKey: "faq-v2" },
    },
  },

  // ── Retry policy ─────────────────────────────────────────────────────────
  {
    id: "retry-policy",
    name: "Retry — Exponential Backoff",
    description: "3 attempts, 500ms initial delay, exponential backoff",
    explanation: "`cf-aig-max-attempts: 3`, `cf-aig-retry-delay: 500`, `cf-aig-backoff: exponential` — the gateway retries automatically on provider errors without any client-side logic. Transient failures are absorbed invisibly.",
    request: {
      model: WA_LARGE,
      messages: [{ role: "user", content: "Summarise the CAP theorem in two sentences." }],
      options: { maxAttempts: 3, retryDelay: 500, backoff: "exponential", requestTimeout: 10000 },
    },
  },

  // ── User-Agent observability ─────────────────────────────────────────────
  {
    id: "user-agent-observability",
    name: "User-Agent Observability",
    description: "Custom User-Agent visible in gateway logs — Jun 2026 feature",
    explanation: "AI Gateway now captures the User-Agent of every request. A descriptive value lets you filter logs in the dashboard by team or service — essential when multiple internal services share one gateway and you need to attribute costs per team.",
    request: {
      model: WA_MEDIUM,
      messages: [{ role: "user", content: "Summarise: Cloudflare AI Gateway adds caching, rate limiting, observability, and dynamic routing to AI provider calls." }],
      metadata: { team: "finance", service: "document-summariser" },
      options: { userAgent: "internal-summariser/2.1 (finance-team)" },
    },
  },

  // ── Per-employee spend limit ──────────────────────────────────────────────
  {
    id: "per-employee-budget",
    name: "Spend Limits — Per Employee",
    description: "metadata.userId drives independent per-user daily cost budgets",
    explanation: "With a spend limit rule scoped to `metadata.userId` (split by value), each employee gets an independent budget bucket. When the budget is exhausted, the gateway returns 429 — or you can configure a fallback model instead of an error.",
    request: {
      model: WA_MEDIUM,
      messages: [{ role: "user", content: "Draft a concise executive summary of our Q3 cloud infrastructure spend." }],
      metadata: { userId: "emp-1042", department: "engineering", costCenter: "CC-ENG-001" },
    },
  },

];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
