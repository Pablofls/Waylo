import { requireUser, route } from "@/server/api";
import { limit } from "@/server/cuenta";
import { buscarPersonas } from "@/server/social";

export const GET = route(async (req) => {
  const uid = await requireUser();
  limit(`buscar-personas:${uid}`, 40, 60_000);
  return { personas: await buscarPersonas(uid, new URL(req.url).searchParams.get("q") ?? "") };
});
