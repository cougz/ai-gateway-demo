import type { Context } from "hono";
import type { Env } from "../types";

export async function handleGetLog(c: Context<{ Bindings: Env }>): Promise<Response> {
  const logId = c.req.param("id");
  if (!logId) return c.json({ error: "missing log id" }, 400);

  try {
    const gateway = c.env.AI.gateway(c.env.GATEWAY_ID || "ai-gateway01");
    const log = await gateway.getLog(logId);
    return c.json(log);
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
}
