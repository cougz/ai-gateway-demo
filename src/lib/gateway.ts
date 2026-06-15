import type { Env, GatewayRequest, GatewayResponse, GatewayErrorResult } from "../types";

// ── Model string parsing ──────────────────────────────────────────────────────
// The UI/API uses these model string formats:
//   "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast"  → Workers AI via binding
//   "dynamic/plan-router"                                   → Dynamic route via compat
//
// The binding call format is:
//   provider: "workers-ai", endpoint: "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
//   provider: "compat",     endpoint: "chat/completions", query.model: "dynamic/plan-router"

function parseModel(model: string): { provider: string; endpoint: string; isCompat: boolean } {
  if (model.startsWith("workers-ai/")) {
    return {
      provider: "workers-ai",
      endpoint: model.slice("workers-ai/".length), // e.g. "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
      isCompat: false,
    };
  }
  // dynamic/<route>, or any other unrecognised format → compat endpoint
  return { provider: "compat", endpoint: "chat/completions", isCompat: true };
}

// ── Core gateway call — uses AI binding, no API token needed ──────────────────

export type GatewayResult =
  | { ok: true; data: GatewayResponse }
  | { ok: false; error: GatewayErrorResult };

export async function callGateway(req: GatewayRequest, env: Env): Promise<GatewayResult> {
  const gatewayId = env.GATEWAY_ID || "ai-gateway01";
  const gateway   = env.AI.gateway(gatewayId);
  const o         = req.options ?? {};

  const { provider, endpoint, isCompat } = parseModel(req.model);

  // ── Request body ──────────────────────────────────────────────────────────
  // Workers AI provider: { messages } or { prompt }
  // Compat provider (dynamic routes): { model, messages, stream: false }
  const query = isCompat
    ? { model: req.model, messages: req.messages, stream: false }
    : { messages: req.messages };

  // ── Per-request cf-aig-* headers ─────────────────────────────────────────
  // GatewayOptions covers most headers natively; only newer ones go here.
  const reqHeaders: Record<string, string | number | boolean> = {};
  if (o.collectLogPayload != null) {
    // cf-aig-collect-log-payload (Mar 2026) — not yet in GatewayOptions type
    reqHeaders["cf-aig-collect-log-payload"] = String(o.collectLogPayload);
  }

  // ── UniversalGatewayOptions (structured binding options) ─────────────────
  const gatewayOpts: {
    cacheKey?: string;
    cacheTtl?: number;
    skipCache?: boolean;
    metadata?: Record<string, string | number | boolean>;
    collectLog?: boolean;
    requestTimeoutMs?: number;
    retries?: {
      maxAttempts?: 1 | 2 | 3 | 4 | 5;
      retryDelayMs?: number;
      backoff?: "constant" | "linear" | "exponential";
    };
  } = {};

  if (o.skipCache)              gatewayOpts.skipCache       = true;
  if (o.cacheTtl  != null)      gatewayOpts.cacheTtl        = o.cacheTtl;
  if (o.cacheKey)               gatewayOpts.cacheKey        = o.cacheKey;
  if (o.collectLog != null)     gatewayOpts.collectLog      = o.collectLog;
  if (o.requestTimeout != null) gatewayOpts.requestTimeoutMs = o.requestTimeout;
  if (req.metadata && Object.keys(req.metadata).length)
    gatewayOpts.metadata = req.metadata as Record<string, string | number | boolean>;
  if (o.maxAttempts != null || o.retryDelay != null || o.backoff) {
    gatewayOpts.retries = {
      ...(o.maxAttempts != null ? { maxAttempts: o.maxAttempts as 1 | 2 | 3 | 4 | 5 } : {}),
      ...(o.retryDelay  != null ? { retryDelayMs: o.retryDelay } : {}),
      ...(o.backoff               ? { backoff: o.backoff }        : {}),
    };
  }

  // ── Extra headers (User-Agent, escape-hatch cf-aig-* headers) ────────────
  const extraHeaders: Record<string, string> = {};
  if (o.userAgent) extraHeaders["User-Agent"] = o.userAgent;
  Object.assign(extraHeaders, o.extraHeaders ?? {});

  // ── Call via AI binding — no Authorization token needed ───────────────────
  const start = Date.now();
  let raw: Response;

  try {
    raw = await gateway.run(
      { provider, endpoint, headers: reqHeaders, query },
      {
        gateway: Object.keys(gatewayOpts).length ? gatewayOpts : undefined,
        extraHeaders: Object.keys(extraHeaders).length ? extraHeaders : undefined,
      }
    );
  } catch (e) {
    return { ok: false, error: { error: "network_error", status: 0, message: String(e) } };
  }

  const latencyMs = Date.now() - start;

  if (!raw.ok) {
    const text = await raw.text().catch(() => "");
    return { ok: false, error: { error: "gateway_error", status: raw.status, message: text } };
  }

  // ── Parse response body ───────────────────────────────────────────────────
  const json = (await raw.json()) as Record<string, unknown>;

  // Compat format: { choices: [{ message: { content: "…" } }] }
  // Workers AI format: { response: "…" }
  const choices = json.choices as Array<{ message: { content: string } }> | undefined;
  const message = choices
    ? (choices[0]?.message?.content ?? "")
    : ((json.response as string) ?? JSON.stringify(json));

  const usageRaw = json.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;
  const usage = usageRaw
    ? {
        promptTokens:     usageRaw.prompt_tokens     ?? 0,
        completionTokens: usageRaw.completion_tokens ?? 0,
        totalTokens:      usageRaw.total_tokens      ?? 0,
      }
    : undefined;

  // ── Extract all AI Gateway response headers ───────────────────────────────
  const logId       = raw.headers.get("cf-aig-log-id")       ?? env.AI.aiGatewayLogId ?? "";
  const cacheStatus = raw.headers.get("cf-aig-cache-status") ?? "UNKNOWN";
  const model       = raw.headers.get("cf-aig-model")        ?? req.model;
  const providerH   = raw.headers.get("cf-aig-provider")     ?? "";
  const step        = raw.headers.get("cf-aig-step")         ?? undefined;
  const dlpRaw      = raw.headers.get("cf-aig-dlp");
  const dlp = dlpRaw ? (() => { try { return JSON.parse(dlpRaw); } catch { return dlpRaw; } })() : undefined;

  return {
    ok: true,
    data: {
      message,
      gateway: { logId, cacheStatus, model, provider: providerH, step, dlp, latencyMs, usage },
    },
  };
}
