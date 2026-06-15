import type { Env, GatewayRequest, GatewayResponse, GatewayErrorResult } from "../types";

// ── Header assembly ──────────────────────────────────────────────────────────

function buildHeaders(req: GatewayRequest, env: Env): Record<string, string> {
  const o = req.options ?? {};
  const h: Record<string, string> = {
    "Content-Type": "application/json",
    // Both headers needed: cf-aig-authorization authenticates to the gateway,
    // Authorization is forwarded to the provider (Workers AI / Unified Billing uses the same token)
    "Authorization": `Bearer ${env.CF_API_TOKEN}`,
    "cf-aig-authorization": `Bearer ${env.CF_API_TOKEN}`,
    // User-Agent is captured in gateway logs (Jun 2026 feature — filterable in dashboard)
    "User-Agent": o.userAgent ?? "ai-gateway-demo/1.0 (cloudflare-worker)",
  };

  // Custom metadata → drives dynamic routing conditions + appears in logs
  if (req.metadata && Object.keys(req.metadata).length > 0) {
    h["cf-aig-metadata"] = JSON.stringify(req.metadata);
  }

  if (o.skipCache)                    h["cf-aig-skip-cache"]           = "true";
  if (o.cacheTtl != null)             h["cf-aig-cache-ttl"]            = String(o.cacheTtl);
  if (o.cacheKey)                     h["cf-aig-cache-key"]            = o.cacheKey;
  if (o.collectLog != null)           h["cf-aig-collect-log"]          = String(o.collectLog);
  if (o.collectLogPayload != null)    h["cf-aig-collect-log-payload"]  = String(o.collectLogPayload);
  if (o.requestTimeout != null)       h["cf-aig-request-timeout"]      = String(o.requestTimeout);
  if (o.maxAttempts != null)          h["cf-aig-max-attempts"]         = String(o.maxAttempts);
  if (o.retryDelay != null)           h["cf-aig-retry-delay"]          = String(o.retryDelay);
  if (o.backoff)                      h["cf-aig-backoff"]              = o.backoff;

  // Escape hatch: arbitrary extra headers, merged last so they can override anything above
  Object.assign(h, o.extraHeaders ?? {});

  return h;
}

// ── Core gateway call ────────────────────────────────────────────────────────

export type GatewayResult =
  | { ok: true; data: GatewayResponse }
  | { ok: false; error: GatewayErrorResult };

export async function callGateway(req: GatewayRequest, env: Env): Promise<GatewayResult> {
  const gatewayId = env.GATEWAY_ID || "default";
  // Compat endpoint — supports:
  //   dynamic/<route-name>          (dynamic routing)
  //   workers-ai/@cf/...            (Workers AI via gateway)
  //   openai/gpt-4o-mini            (provider/model — Unified Billing or BYOK)
  const url = `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCOUNT_ID}/${gatewayId}/compat/chat/completions`;

  const start = Date.now();
  let raw: Response;

  try {
    raw = await fetch(url, {
      method: "POST",
      headers: buildHeaders(req, env),
      body: JSON.stringify({ model: req.model, messages: req.messages, stream: false }),
    });
  } catch (e) {
    return { ok: false, error: { error: "network_error", status: 0, message: String(e) } };
  }

  const latencyMs = Date.now() - start;

  if (!raw.ok) {
    const text = await raw.text().catch(() => "");
    return { ok: false, error: { error: "gateway_error", status: raw.status, message: text } };
  }

  const json = (await raw.json()) as Record<string, unknown>;

  const choices = json.choices as Array<{ message: { content: string } }> | undefined;
  const message = choices?.[0]?.message?.content ?? "";

  const usageRaw = json.usage as
    | { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
    | undefined;
  const usage = usageRaw
    ? {
        promptTokens:     usageRaw.prompt_tokens     ?? 0,
        completionTokens: usageRaw.completion_tokens ?? 0,
        totalTokens:      usageRaw.total_tokens      ?? 0,
      }
    : undefined;

  // ── Extract all AI Gateway response headers ──────────────────────────
  const logId       = raw.headers.get("cf-aig-log-id")       ?? "";
  const cacheStatus = raw.headers.get("cf-aig-cache-status") ?? "UNKNOWN";
  const model       = raw.headers.get("cf-aig-model")        ?? req.model;
  const provider    = raw.headers.get("cf-aig-provider")     ?? "";
  const step        = raw.headers.get("cf-aig-step")         ?? undefined;
  const dlpHeader   = raw.headers.get("cf-aig-dlp");
  const dlp         = dlpHeader ? (() => { try { return JSON.parse(dlpHeader); } catch { return dlpHeader; } })() : undefined;

  return {
    ok: true,
    data: {
      message,
      gateway: { logId, cacheStatus, model, provider, step, dlp, latencyMs, usage },
    },
  };
}
