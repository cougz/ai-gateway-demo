// ── Shared types used across all surfaces (REST, MCP, UI) ────────────────────

export interface GatewayRequestOptions {
  /** User-Agent header — simulates any SDK or client (Jun 2026 feature: visible in gateway logs) */
  userAgent?: string;
  /** cf-aig-skip-cache */
  skipCache?: boolean;
  /** cf-aig-cache-ttl (seconds) */
  cacheTtl?: number;
  /** cf-aig-cache-key */
  cacheKey?: string;
  /** cf-aig-collect-log */
  collectLog?: boolean;
  /** cf-aig-collect-log-payload — false = metadata only, no prompt/response stored (Mar 2026) */
  collectLogPayload?: boolean;
  /** cf-aig-request-timeout (ms) */
  requestTimeout?: number;
  /** cf-aig-max-attempts (1–5) */
  maxAttempts?: number;
  /** cf-aig-retry-delay (ms, 100–5000) */
  retryDelay?: number;
  /** cf-aig-backoff */
  backoff?: "constant" | "linear" | "exponential";
  /** Arbitrary extra headers forwarded to AI Gateway as-is */
  extraHeaders?: Record<string, string>;
}

export interface GatewayRequest {
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  /** "openai/gpt-4o-mini" | "workers-ai/@cf/..." | "dynamic/<route-name>" */
  model: string;
  /** Up to 5 flat key-value pairs → cf-aig-metadata. Drives dynamic routing conditions. */
  metadata?: Record<string, string | number | boolean>;
  options?: GatewayRequestOptions;
}

export interface GatewayUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface GatewayInfo {
  /** cf-aig-log-id — use for feedback / getLog */
  logId: string;
  /** cf-aig-cache-status: HIT | MISS | BYPASS | EXPIRED */
  cacheStatus: string;
  /** cf-aig-model — actual model used (differs from requested when using dynamic routes) */
  model: string;
  /** cf-aig-provider */
  provider: string;
  /** cf-aig-step — which node in the dynamic route answered */
  step?: string;
  /** cf-aig-dlp — DLP action if a policy matched */
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
  CF_API_TOKEN: string;
  CF_ACCOUNT_ID: string;
  GATEWAY_ID: string;
}
