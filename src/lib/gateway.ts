import type { Env, GatewayRequest, GatewayResponse, GatewayErrorResult } from "../types";

// ── Strategy ─────────────────────────────────────────────────────────────────
//
// Workers AI models  ("workers-ai/@cf/…"):
//   → env.AI.run(model, inputs, { gateway: …, returnRawResponse: true })
//   The AI binding authenticates automatically; returnRawResponse exposes
//   all cf-aig-* headers (log-id, cache-status, model, provider, step, dlp).
//
// Dynamic routes / compat ("dynamic/…"):
//   → env.AI.gateway(id).run({ provider:"compat", endpoint:"chat/completions" })
//   Routes through the gateway compat endpoint.  Gateway authentication must
//   be OFF (authentication: false) so the binding can call without a token.

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildGatewayOptions(req: GatewayRequest, env: Env) {
  const o = req.options ?? {};
  const gatewayId = env.GATEWAY_ID || "ai-gateway01";

  const opts: {
    id: string;
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
  } = { id: gatewayId };

  if (o.skipCache)              opts.skipCache        = true;
  if (o.cacheTtl  != null)      opts.cacheTtl         = o.cacheTtl;
  if (o.cacheKey)               opts.cacheKey         = o.cacheKey;
  if (o.collectLog != null)     opts.collectLog        = o.collectLog;
  if (o.requestTimeout != null) opts.requestTimeoutMs = o.requestTimeout;
  if (req.metadata && Object.keys(req.metadata).length)
    opts.metadata = req.metadata as Record<string, string | number | boolean>;
  if (o.maxAttempts != null || o.retryDelay != null || o.backoff) {
    opts.retries = {
      ...(o.maxAttempts != null ? { maxAttempts: o.maxAttempts as 1 | 2 | 3 | 4 | 5 } : {}),
      ...(o.retryDelay  != null ? { retryDelayMs: o.retryDelay } : {}),
      ...(o.backoff               ? { backoff: o.backoff }        : {}),
    };
  }
  return opts;
}

function buildExtraHeaders(req: GatewayRequest): Record<string, string> {
  const o = req.options ?? {};
  const h: Record<string, string> = {};
  if (o.userAgent) h["User-Agent"] = o.userAgent;
  if (o.collectLogPayload != null) h["cf-aig-collect-log-payload"] = String(o.collectLogPayload);
  Object.assign(h, o.extraHeaders ?? {});
  return h;
}

function extractHeaders(raw: Response, fallbackModel: string): GatewayResponse["gateway"] & { latencyMs: number } {
  const logId       = raw.headers.get("cf-aig-log-id")       ?? "";
  const cacheStatus = raw.headers.get("cf-aig-cache-status") ?? "UNKNOWN";
  const model       = raw.headers.get("cf-aig-model")        ?? fallbackModel;
  const providerH   = raw.headers.get("cf-aig-provider")     ?? "";
  const step        = raw.headers.get("cf-aig-step")         ?? undefined;
  const dlpRaw      = raw.headers.get("cf-aig-dlp");
  const dlp = dlpRaw ? (() => { try { return JSON.parse(dlpRaw); } catch { return dlpRaw; } })() : undefined;
  return { logId, cacheStatus, model, provider: providerH, step, dlp, latencyMs: 0 };
}

function parseBody(json: Record<string, unknown>, req: GatewayRequest) {
  // compat format: { choices: [{ message: { content } }] }
  const choices = json.choices as Array<{ message: { content: string } }> | undefined;
  const message = choices
    ? (choices[0]?.message?.content ?? "")
    : ((json.response as string) ?? JSON.stringify(json));

  const usageRaw = json.usage as
    | { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
    | undefined;
  const usage = usageRaw
    ? { promptTokens: usageRaw.prompt_tokens ?? 0, completionTokens: usageRaw.completion_tokens ?? 0, totalTokens: usageRaw.total_tokens ?? 0 }
    : undefined;

  return { message, usage };
}

// ── Core ──────────────────────────────────────────────────────────────────────

export type GatewayResult =
  | { ok: true; data: GatewayResponse }
  | { ok: false; error: GatewayErrorResult };

export async function callGateway(req: GatewayRequest, env: Env): Promise<GatewayResult> {
  const gatewayId    = env.GATEWAY_ID || "ai-gateway01";
  const isWorkersAI  = req.model.startsWith("workers-ai/");
  const extraHeaders = buildExtraHeaders(req);

  console.log("[gateway] model:", req.model, "| strategy:", isWorkersAI ? "AI.run+returnRaw" : "gateway.run+compat");

  const start = Date.now();
  let raw: Response;

  try {
    if (isWorkersAI) {
      // ── Workers AI: use AI binding with returnRawResponse ─────────────
      // The binding handles all authentication automatically; returnRawResponse
      // exposes every cf-aig-* response header we need for the demo.
      const modelName = req.model.slice("workers-ai/".length); // "@cf/meta/llama-…"
      const gatewayOpts = buildGatewayOptions(req, env);

      raw = await (env.AI.run as Function)(
        modelName,
        { messages: req.messages },
        {
          gateway: gatewayOpts,
          returnRawResponse: true,
          ...(Object.keys(extraHeaders).length ? { extraHeaders } : {}),
        }
      ) as Response;

    } else {
      // ── Dynamic routes / compat: use gateway().run() ──────────────────
      // Requires gateway authentication = OFF on ai-gateway01.
      const compatHeaders: Record<string, string | number | boolean> = {};
      if (req.options?.collectLogPayload != null)
        compatHeaders["cf-aig-collect-log-payload"] = String(req.options.collectLogPayload);

      const gatewayOpts = buildGatewayOptions(req, env);

      raw = await env.AI.gateway(gatewayId).run(
        {
          provider: "compat",
          endpoint: "chat/completions",
          headers: compatHeaders,
          query: { model: req.model, messages: req.messages, stream: false },
        },
        {
          gateway: gatewayOpts,
          ...(Object.keys(extraHeaders).length ? { extraHeaders } : {}),
        }
      );
    }
  } catch (e) {
    console.error("[gateway] threw:", String(e));
    return { ok: false, error: { error: "network_error", status: 0, message: String(e) } };
  }

  const latencyMs = Date.now() - start;
  console.log("[gateway] status:", raw.status, latencyMs + "ms | cache:", raw.headers.get("cf-aig-cache-status"), "| log:", raw.headers.get("cf-aig-log-id")?.slice(0,12));

  if (!raw.ok) {
    const text = await raw.text().catch(() => "");
    return { ok: false, error: { error: "gateway_error", status: raw.status, message: text } };
  }

  const json    = (await raw.json()) as Record<string, unknown>;
  const headers = extractHeaders(raw, req.model);
  const { message, usage } = parseBody(json, req);

  return {
    ok: true,
    data: {
      message,
      gateway: { ...headers, latencyMs, usage },
    },
  };
}
