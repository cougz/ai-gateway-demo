import type { Scenario } from "../types";

// ── Workers AI model strings (AI binding path — supports full catalog) ───────
export const WA_LARGE = "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast";
export const WA_SMALL = "workers-ai/@cf/mistral/mistral-7b-instruct-v0.1";

// ── Dynamic route names ───────────────────────────────────────────────────────
// NOTE: gateway dynamic route model nodes use the legacy Workers AI /run/ REST
// endpoint which only resolves original-launch models (Mistral 7B etc.).
// Newer @cf/ models (llama-3.3-70b-fp8-fast, etc.) only work via the AI
// binding (workers-ai/ prefix). The plan-router route therefore handles only
// the free-tier path (rate limit → Mistral 7B). The paid tier routes directly
// via the AI binding to WA_LARGE, bypassing the rate-limited gateway route.
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
  // Uses the AI binding (WA_LARGE) rather than the dynamic route because
  // the gateway route model node only resolves legacy Workers AI models.
  // The paid tier bypasses the rate-limited gateway route entirely.
  {
    id: "plan-router-paid",
    name: "Plan Router — Paid Tier",
    description: "workers-ai · metadata.plan=paid → bypasses gateway route → Llama 3.3 70B",
    explanation: "Paid traffic bypasses the `plan-router` gateway route entirely and is served directly by Llama 3.3 70B via the Workers AI binding — no rate limit node, no routing overhead. Compare the **Model** field with the Free variant: Mistral 7B (via gateway) vs Llama 3.3 70B (direct binding).",
    request: {
      model: WA_LARGE,
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
