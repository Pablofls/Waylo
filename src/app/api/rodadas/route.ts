import { body, requireUser, route } from "@/server/api";
import { crearRodada, crearRodadaInput } from "@/server/rodadas";

export const POST = route(async (req) => {
  const uid = await requireUser();
  return crearRodada(uid, await body(req, crearRodadaInput));
});
