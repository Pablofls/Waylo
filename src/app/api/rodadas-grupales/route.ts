import { body, requireUser, route } from "@/server/api";
import { limit } from "@/server/cuenta";
import { crearRodadaGrupal, rodadaGrupalInput } from "@/server/grupales";

export const POST = route(async (req) => {
  const uid = await requireUser();
  limit(`rodada-grupal:${uid}`, 10, 60 * 60_000);
  return { id: await crearRodadaGrupal(uid, await body(req, rodadaGrupalInput)) };
});
