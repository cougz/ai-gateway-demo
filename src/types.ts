// ── Shared types used across all surfaces (REST, MCP, UI) ────────────────────

export interface GatewayRequestOptions {
  /** User-Agent header — simulates any SDK or client (Jun 2026: visible in gateway logs) */
  userAgent?: string;
  skipCache?: boolean;
  cacheTtl?: number;
  cacheKey?: string;
  collectLog?: boolean;
  /** false = metadata-only logging, no prompt/response stored (Mar 2026) */
  collectLogPayload?: boolean;
  requestTimeout?: number;
  maxAttempts?: number;
  retryDelay?: number;
  backoff?: "constant" | "linear" | "exponential";
  /** Arbitrary extra headers forwarded to the gateway as-is */
  extraHeaders?: Record<string, string>;
  /** BYOK alias for non-default provider keys (e.g. "private") — adds cf-aig-byok-alias header */
  byokAlias?: string;
}

export interface GatewayRequest {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  /**
   * Workers AI:   "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast"
   * Dynamic route: "dynamic/<route-name>"
   */
  model: string;
  /** Up to 5 flat key-value pairs — drives dynamic routing conditions and spend limits */
  metadata?: Record<string, string | number | boolean>;
  options?: GatewayRequestOptions;
}

export interface GatewayUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface GatewayInfo {
  logId: string;
  cacheStatus: string;
  model: string;
  provider: string;
  step?: string;
  dlp?: unknown;
  latencyMs: number;
  usage?: GatewayUsage;
}

export interface GatewayResponse {
  message: string;
  gateway: GatewayInfo;
}

export interface GatewayErrorResult {
  error: string;
  status: number;
  message: string;
  dlp?: unknown;    // cf-aig-dlp from blocked/flagged responses
  logId?: string;   // log ID even for error responses
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  explanation: string;
  request: Partial<GatewayRequest>;
}

export interface Env {
  AI: Ai;
  AIG_DEMO_MCP: DurableObjectNamespace;
  /** Set as var in wrangler.jsonc — not a secret */
  CF_ACCOUNT_ID: string;
  /** Set as var in wrangler.jsonc — not a secret */
  GATEWAY_ID: string;
  /** Gateway auth token — set via `wrangler secret put CF_AIG_TOKEN` */
  CF_AIG_TOKEN: string;
}
