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
// DLP scenarios MUST use the compat fetch path (dynamic/ prefix) so requests
// pass through the gateway HTTP pipeline where DLP middleware runs.
// The AI binding (workers-ai/ prefix) bypasses the DLP layer entirely.
const DR_DLP  = "dynamic/dlp";

export const SCENARIOS: Scenario[] = [

  // ── plan-router: free tier ───────────────────────────────────────────────
  {
    id: "plan-router-free",
    name: "Plan Router — Free Tier",
    description: "dynamic/plan-router · metadata.plan=free → rate limit (3/min) → Llama 3.1 8B",
    explanation: "The `plan-router` route evaluates `metadata.plan`. Free traffic passes through a **Rate Limit node** (3 req/min per `tenantId`) before reaching Llama 3.1 8B via OpenRouter. **To trigger the limit:** run this scenario 4 times quickly — the 4th request is blocked by the gateway before it reaches the model. Switch to the Paid variant to see the rate limit disappear and the model change.",
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
    description: "dynamic/plan-router · metadata.plan=paid → Llama 3.3 70B (OpenRouter)",
    explanation: "Same `plan-router` route, same endpoint — only `metadata.plan` changes. The gateway routes paid traffic to Llama 3.3 70B via OpenRouter. Compare the **Model** field with the Free variant: the gateway selected a completely different model based solely on the metadata value.",
    request: {
      model: DR_PLAN,
      messages: [{ role: "user", content: "Summarise what Cloudflare AI Gateway does in one sentence." }],
      metadata: { tenantId: "acme-corp", plan: "paid", region: "eu-west" },
      options: { skipCache: true },
    },
  },

  // ── DLP: PII Record — BLOCK on request and response ─────────────────────
  {
    id: "dlp-pii-block",
    name: "DLP — PII Record (Block)",
    description: "Request contains PII (3+ fields) → DLP blocks it before reaching the model",
    explanation: "The 'Personally Identifiable Information (PII) Record' profile triggers when **3 or more** unique PII fields appear in close proximity. This request contains Full Name, Email, US Phone, SSN, and Mailing Address — well above the threshold. The gateway blocks on both **Request** and **Response**, so the prompt never reaches the model. The `cf-aig-dlp` header in the error response confirms the BLOCK action.",
    request: {
      model: DR_DLP,
      messages: [{
        role: "user",
        content: `Please review and summarise this customer record for our CRM:

Name: Sarah Johnson
Email: sarah.johnson@acme-corp.com
Phone: +1 (415) 555-0192
SSN: 578-34-9201
Address: 847 Pacific Avenue, San Francisco, CA 94133

Is there anything unusual about this account?`,
      }],
      metadata: { scenario: "dlp-test", dataClass: "pii", team: "security" },
      options: { collectLog: true, collectLogPayload: true, skipCache: true },
    },
  },

];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
