import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { Env } from "../types";
import { callGateway } from "../lib/gateway";
import { SCENARIOS, getScenario } from "../lib/scenarios";

// ── Shared options schema (reused across tools) ──────────────────────────────

const OptionsSchema = {
  userAgent:         z.string().optional().describe("User-Agent header — simulates any SDK/client (visible in gateway logs)"),
  skipCache:         z.boolean().optional().describe("Skip the gateway cache (cf-aig-skip-cache)"),
  cacheTtl:          z.number().optional().describe("Cache TTL in seconds (cf-aig-cache-ttl)"),
  cacheKey:          z.string().optional().describe("Custom cache key (cf-aig-cache-key)"),
  collectLog:        z.boolean().optional().describe("Whether to collect logs (cf-aig-collect-log)"),
  collectLogPayload: z.boolean().optional().describe("false = metadata-only logging, prompt/response not stored (cf-aig-collect-log-payload, Mar 2026)"),
  requestTimeout:    z.number().optional().describe("Request timeout in ms (cf-aig-request-timeout)"),
  maxAttempts:       z.number().min(1).max(5).optional().describe("Max retry attempts 1–5 (cf-aig-max-attempts)"),
  retryDelay:        z.number().min(100).max(5000).optional().describe("Delay between retries in ms (cf-aig-retry-delay)"),
  backoff:           z.enum(["constant", "linear", "exponential"]).optional().describe("Retry backoff strategy (cf-aig-backoff)"),
  extraHeaders:      z.record(z.string()).optional().describe("Arbitrary extra headers forwarded to AI Gateway as-is"),
};

// ── Helper to format gateway info as Markdown ────────────────────────────────

function fmtGateway(g: { model: string; provider: string; cacheStatus: string; step?: string; logId: string; latencyMs: number; usage?: { promptTokens: number; completionTokens: number; totalTokens: number }; dlp?: unknown }): string {
  return [
    "---",
    "**Gateway**",
    `- Model: \`${g.model}\``,
    `- Provider: \`${g.provider}\``,
    `- Cache: \`${g.cacheStatus}\``,
    g.step   ? `- Step: \`${g.step}\`` : null,
    `- Log ID: \`${g.logId}\``,
    `- Latency: ${g.latencyMs} ms`,
    g.usage  ? `- Tokens: ${g.usage.promptTokens} → ${g.usage.completionTokens} (total ${g.usage.totalTokens})` : null,
    g.dlp    ? `- DLP: ${JSON.stringify(g.dlp)}` : null,
  ].filter(Boolean).join("\n");
}

// ── McpAgent ─────────────────────────────────────────────────────────────────

export class AigDemoMcp extends McpAgent<Env, Record<string, never>, Record<string, never>> {
  server = new McpServer({ name: "ai-gateway-demo", version: "1.0.0" });

  async init(): Promise<void> {
    // ── chat ──────────────────────────────────────────────────────────────
    this.server.tool(
      "chat",
      "Send a message through Cloudflare AI Gateway with full control over model, metadata, caching, retries, and all gateway options. Returns the AI response plus all gateway metadata (log ID, cache status, model used, provider, dynamic route step, latency, token counts).",
      {
        prompt:   z.string().describe("User message to send"),
        model:    z.string().optional().describe("Model: 'workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast' | 'openai/gpt-4o-mini' | 'dynamic/<route-name>'"),
        metadata: z.record(z.union([z.string(), z.number(), z.boolean()])).optional().describe("Custom metadata (up to 5 entries). Drives dynamic routing conditions and spend limits."),
        ...OptionsSchema,
      },
      async ({ prompt, model, metadata, ...options }) => {
        const result = await callGateway(
          {
            model: model ?? "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
            messages: [{ role: "user", content: prompt }],
            metadata: metadata as Record<string, string | number | boolean> | undefined,
            options,
          },
          this.env
        );

        if (!result.ok) {
          return { content: [{ type: "text", text: `Error ${result.error.status}: ${result.error.message}` }], isError: true };
        }

        const { message, gateway } = result.data;
        return { content: [{ type: "text", text: `${message}\n\n${fmtGateway(gateway)}` }] };
      }
    );

    // ── list_scenarios ────────────────────────────────────────────────────
    this.server.tool(
      "list_scenarios",
      "List all available AI Gateway demo scenarios with their IDs, descriptions, and explanations. Use run_scenario to execute one.",
      {},
      async () => {
        const text = SCENARIOS.map(s =>
          `**${s.name}** (\`${s.id}\`)\n${s.description}\n> ${s.explanation}`
        ).join("\n\n");
        return { content: [{ type: "text", text }] };
      }
    );

    // ── run_scenario ──────────────────────────────────────────────────────
    this.server.tool(
      "run_scenario",
      "Execute a named preset demo scenario that showcases a specific AI Gateway feature. Use list_scenarios to see available IDs.",
      {
        name: z.string().describe("Scenario ID from list_scenarios"),
        overrides: z.object({
          model:    z.string().optional(),
          metadata: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
          ...OptionsSchema,
        }).optional().describe("Optional overrides merged into the scenario request"),
      },
      async ({ name, overrides }) => {
        const scenario = getScenario(name);
        if (!scenario) {
          return { content: [{ type: "text", text: `Unknown scenario: '${name}'. Call list_scenarios to see available IDs.` }], isError: true };
        }

        const result = await callGateway(
          {
            model:    overrides?.model ?? scenario.request.model ?? "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
            messages: scenario.request.messages ?? [{ role: "user", content: "Hello" }],
            metadata: { ...scenario.request.metadata, ...overrides?.metadata } as Record<string, string | number | boolean> | undefined,
            options:  { ...scenario.request.options, ...overrides },
          },
          this.env
        );

        if (!result.ok) {
          return { content: [{ type: "text", text: `Error ${result.error.status}: ${result.error.message}` }], isError: true };
        }

        const { message, gateway } = result.data;
        return {
          content: [{
            type: "text",
            text: `**Scenario: ${scenario.name}**\n> ${scenario.explanation}\n\n${message}\n\n${fmtGateway(gateway)}`,
          }],
        };
      }
    );

    // ── get_log ───────────────────────────────────────────────────────────
    this.server.tool(
      "get_log",
      "Retrieve the full details of an AI Gateway log entry by its log ID (from a previous chat response's gateway.logId).",
      {
        logId: z.string().describe("The cf-aig-log-id from a previous chat call"),
      },
      async ({ logId }) => {
        try {
          const gw = (this.env.AI as unknown as { gateway(id: string): { getLog(id: string): Promise<unknown> } }).gateway(this.env.GATEWAY_ID || "default");
          const log = await gw.getLog(logId);
          return { content: [{ type: "text", text: JSON.stringify(log, null, 2) }] };
        } catch (e) {
          return { content: [{ type: "text", text: `Error: ${String(e)}` }], isError: true };
        }
      }
    );

    // ── submit_feedback ───────────────────────────────────────────────────
    this.server.tool(
      "submit_feedback",
      "Submit thumbs-up (1) or thumbs-down (-1) feedback on an AI Gateway log entry, with an optional quality score 0–100.",
      {
        logId:    z.string().describe("Log ID to submit feedback on"),
        feedback: z.union([z.literal(1), z.literal(-1)]).describe("1 = thumbs up, -1 = thumbs down"),
        score:    z.number().min(0).max(100).optional().describe("Optional quality score 0–100"),
      },
      async ({ logId, feedback, score }) => {
        try {
          const gw = (this.env.AI as unknown as { gateway(id: string): { patchLog(id: string, opts: { feedback?: number; score?: number }): Promise<void> } }).gateway(this.env.GATEWAY_ID || "default");
          await gw.patchLog(logId, { feedback, ...(score != null ? { score } : {}) });
          return { content: [{ type: "text", text: `Feedback (${feedback > 0 ? "👍" : "👎"}${score != null ? `, score ${score}` : ""}) submitted for log \`${logId}\`` }] };
        } catch (e) {
          return { content: [{ type: "text", text: `Error: ${String(e)}` }], isError: true };
        }
      }
    );

    // ── compare ───────────────────────────────────────────────────────────
    this.server.tool(
      "compare",
      "Run the same prompt against 2–5 models simultaneously and compare their responses alongside gateway metadata (model, provider, cache status, latency, token counts). Ideal for live demos of multi-provider support.",
      {
        prompt:   z.string().describe("Prompt to send to all models"),
        models:   z.array(z.string()).min(2).max(5).describe("2–5 model strings"),
        metadata: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
        ...OptionsSchema,
      },
      async ({ prompt, models, metadata, ...options }) => {
        const results = await Promise.all(
          models.map((model) =>
            callGateway(
              { model, messages: [{ role: "user", content: prompt }], metadata: metadata as Record<string, string | number | boolean> | undefined, options },
              this.env
            )
          )
        );

        const lines: string[] = [`**Compare:** "${prompt}"`, ""];
        for (let i = 0; i < models.length; i++) {
          const r = results[i];
          lines.push(`### ${models[i]}`);
          if (!r.ok) {
            lines.push(`❌ Error ${r.error.status}: ${r.error.message}`);
          } else {
            const { message, gateway } = r.data;
            lines.push(message.slice(0, 500) + (message.length > 500 ? "…" : ""));
            lines.push(`_Cache: ${gateway.cacheStatus} | ${gateway.latencyMs} ms | ${gateway.usage?.totalTokens ?? "?"} tokens | Log: \`${gateway.logId}\`_`);
          }
          lines.push("");
        }
        return { content: [{ type: "text", text: lines.join("\n") }] };
      }
    );

    // ── batch_chat ────────────────────────────────────────────────────────
    this.server.tool(
      "batch_chat",
      "Send up to 20 requests with different metadata or option variations in one call. Use this to generate diverse gateway traffic, populate analytics dashboards, or test spend limits across multiple user IDs.",
      {
        prompt:     z.string().describe("Prompt to send for all variations"),
        model:      z.string().optional().describe("Model for all requests (default: Workers AI Llama 3.3)"),
        variations: z.array(z.object({
          metadata:  z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
          userAgent: z.string().optional(),
          skipCache: z.boolean().optional(),
        })).min(1).max(20).describe("1–20 variation objects — each becomes one gateway request"),
      },
      async ({ prompt, model, variations }) => {
        const results = await Promise.all(
          variations.map((v, idx) =>
            callGateway(
              {
                model: model ?? "workers-ai/@cf/meta/llama-3.3-70b-instruct-fp8-fast",
                messages: [{ role: "user", content: prompt }],
                metadata: v.metadata as Record<string, string | number | boolean> | undefined,
                options: { userAgent: v.userAgent, skipCache: v.skipCache },
              },
              this.env
            ).then((r) => ({ idx, v, r }))
          )
        );

        const summary = results.map(({ idx, v, r }) => {
          const meta = v.metadata ? JSON.stringify(v.metadata) : "{}";
          if (!r.ok) return `[${idx}] ❌ ${r.error.status} — metadata=${meta}`;
          const { gateway: g } = r.data;
          return `[${idx}] ✅ model=${g.model} | cache=${g.cacheStatus} | ${g.latencyMs}ms | log=\`${g.logId}\` | meta=${meta}`;
        });

        return {
          content: [{
            type: "text",
            text: `**Batch complete — ${results.length}/${variations.length} requests sent**\n\n${summary.join("\n")}`,
          }],
        };
      }
    );
  }
}
