import type { Scenario } from "../types";

// ── Workers AI model strings ──────────────────────────────────────────────────
export const WA_LARGE = "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast";
export const WA_SMALL = "workers-ai/@cf/mistral/mistral-7b-instruct-v0.1";

// ── Dynamic route names (configured in AI Gateway dashboard) ─────────────────
const DR_PLAN = "dynamic/plan-router";

export const SCENARIOS: Scenario[] = [

  // ── plan-router: free tier ───────────────────────────────────────────────
  {
    id: "plan-router-free",
    name: "Plan Router — Free Tier",
    description: "dynamic/plan-router · metadata.plan=free → rate-limited → Mistral 7B",
    explanation: "The `plan-router` route checks `metadata.plan`. Free tenants hit a Rate Limit node (3 req/min per tenantId) before reaching Mistral 7B. **To trigger the rate limit:** run this scenario 4 times in quick succession — the 4th request hits the fallback path and returns an error instead of a model response. Note: **Step is always 0** for both tiers because the counter only increments when multiple *model nodes* are attempted in one request (failover), not for control-flow nodes like rate limits.",
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
    description: "dynamic/plan-router · metadata.plan=paid → skips rate limit → GLM 4.7 Flash",
    explanation: "Same `plan-router` route, same endpoint — only `metadata.plan` changes. Paid traffic skips the rate limit node and reaches GLM 4.7 Flash directly. Compare the **Model** field with the Free variant to confirm the route graph took a completely different path.",
    request: {
      model: DR_PLAN,
      messages: [{ role: "user", content: "Summarise what Cloudflare AI Gateway does in one sentence." }],
      metadata: { tenantId: "acme-corp", plan: "paid", region: "eu-west" },
      options: { skipCache: true },
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
      options: { collectLog: true, collectLogPayload: true, skipCache: true },
    },
  },

];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
