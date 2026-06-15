import type { Context } from "hono";
import type { Env, GatewayRequest } from "../types";
import { callGateway } from "../lib/gateway";

export async function handleChat(c: Context<{ Bindings: Env }>): Promise<Response> {
  let body: GatewayRequest;
  try {
    body = await c.req.json<GatewayRequest>();
  } catch {
    return c.json({ error: "invalid_json", status: 400, message: "Request body must be valid JSON" }, 400);
  }

  if (!body.model) {
    return c.json({ error: "missing_model", status: 400, message: "'model' is required" }, 400);
  }
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return c.json({ error: "missing_messages", status: 400, message: "'messages' must be a non-empty array" }, 400);
  }

  const result = await callGateway(body, c.env);

  if (!result.ok) {
    const status = result.error.status >= 100 ? result.error.status : 502;
    return c.json(result.error, status as 400 | 429 | 500 | 502);
  }

  return c.json(result.data);
}
