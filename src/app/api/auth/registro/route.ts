import { body, clientIp, route } from "@/server/api";
import { limit, registrar, registroSchema } from "@/server/cuenta";
import { openSession } from "@/server/session";

export const POST = route(async (req) => {
  limit(`registro:${clientIp(req)}`, 10, 60 * 60_000);
  const data = await body(req, registroSchema);
  const id = await registrar(data);
  await openSession(id);
  return { ok: true };
});
