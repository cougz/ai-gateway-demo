import type { Context } from "hono";
import type { Env } from "../types";

export async function handleGetLog(c: Context<{ Bindings: Env }>): Promise<Response> {
  const logId = c.req.param("id");
  if (!logId) return c.json({ error: "missing log id" }, 400);

  try {
    const gateway = (c.env.AI as unknown as { gateway(id: string): {
      getLog(id: string): Promise<unknown>
    } }).gateway(c.env.GATEWAY_ID || "default");

    const log = await gateway.getLog(logId);
    return c.json(log);
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
}
