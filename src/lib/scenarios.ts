import type { Scenario } from "../types";

// ── Workers AI model strings ──────────────────────────────────────────────────
// No external provider keys required — billed through the Cloudflare account.
export const WA_SMALL  = "workers-ai/@cf/mistral/mistral-7b-instruct-v0.1";

// ── Dynamic route names (configured in AI Gateway dashboard) ─────────────────
const DR_PLAN = "dynamic/plan-router";

// ── Compat-path model (no workers-ai/ prefix → routes via fetch() compat
//    endpoint, ensuring the full gateway HTTP pipeline — including DLP — fires)
const COMPAT_LARGE = "@cf/meta/llama-3.1-70b-instruct";

export const SCENARIOS: Scenario[] = [

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
    description: "dynamic/plan-router · metadata.plan=paid → skips rate limit → Llama 3.1 70B",
    explanation: "Same `plan-router` route, same endpoint — only `metadata.plan` changes. Paid traffic skips the rate limit node and reaches Llama 3.1 70B directly. Compare the **Model** and **Step** fields with the Free variant: the route graph takes a completely different path.",
    request: {
      model: DR_PLAN,
      messages: [{ role: "user", content: "Summarise what Cloudflare AI Gateway does in one sentence." }],
      metadata: { tenantId: "acme-corp", plan: "paid", region: "eu-west" },
      options: { skipCache: true },
    },
  },

  // ── DLP: Source Code — BLOCK on request ──────────────────────────────────
  // Uses the compat endpoint (no workers-ai/ prefix) so the request goes
  // through the full gateway HTTP pipeline, where the DLP Source Code policy
  // intercepts and blocks it before it ever reaches the model.
  {
    id: "dlp-source-code-block",
    name: "DLP — Source Code (Block)",
    description: "Request contains source code → DLP blocks it before reaching the model",
    explanation: "The 'Source Code' DLP profile checks requests. The prompt below contains a JavaScript function with hardcoded API keys and credentials. The gateway intercepts and blocks the request before it ever reaches the model — you will see an error, not an AI response. The `cf-aig-dlp` header in the error response contains the BLOCK action and matched profile IDs.",
    request: {
      model: COMPAT_LARGE,
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
      options: { collectLog: true, collectLogPayload: true, skipCache: true },
    },
  },

];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
