import { body, requireUser, route } from "@/server/api";
import { limit } from "@/server/cuenta";
import { abrirEmergencia, emergenciaInput } from "@/server/seguridad";

export const POST = route(async (req) => {
  const uid = await requireUser();
  limit(`emergencia:${uid}`, 20, 60 * 60_000);
  return abrirEmergencia(uid, await body(req, emergenciaInput));
});
