import type { Context } from "hono";
import type { Env } from "../types";

export async function handleFeedback(c: Context<{ Bindings: Env }>): Promise<Response> {
  let body: { logId: string; feedback: 1 | -1; score?: number };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "invalid_json" }, 400);
  }

  if (!body.logId) return c.json({ error: "missing logId" }, 400);
  if (body.feedback !== 1 && body.feedback !== -1) {
    return c.json({ error: "feedback must be 1 (thumbs up) or -1 (thumbs down)" }, 400);
  }

  try {
    const gateway = (c.env.AI as unknown as { gateway(id: string): {
      patchLog(id: string, opts: { feedback?: number; score?: number }): Promise<void>
    } }).gateway(c.env.GATEWAY_ID || "default");

    await gateway.patchLog(body.logId, {
      feedback: body.feedback,
      ...(body.score != null ? { score: body.score } : {}),
    });

    return c.json({ ok: true, logId: body.logId });
  } catch (e) {
    return c.json({ error: String(e) }, 500);
  }
}
