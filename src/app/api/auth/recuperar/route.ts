import { z } from "zod";
import { body, clientIp, route } from "@/server/api";
import { emailSchema, limit, solicitarRecuperacion } from "@/server/cuenta";

const schema = z.object({ correo: emailSchema });

export const POST = route(async (req) => {
  const { correo } = await body(req, schema);
  limit(`recuperar-ip:${clientIp(req)}`, 10, 60 * 60_000);
  limit(`recuperar:${correo}`, 3, 60 * 60_000);
  await solicitarRecuperacion(correo);
  return { ok: true }; // misma respuesta exista o no el correo
});
