import { body, requireUser, route } from "@/server/api";
import { limit } from "@/server/cuenta";
import { enviarSoporte, soporteSchema } from "@/server/ayuda";

export const POST = route(async (req) => {
  const uid = await requireUser();
  limit(`soporte:${uid}`, 5, 60 * 60_000);
  await enviarSoporte(uid, await body(req, soporteSchema));
});
