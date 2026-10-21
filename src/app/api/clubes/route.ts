import { body, requireUser, route } from "@/server/api";
import { clubInput, crearClub } from "@/server/clubes";
import { limit } from "@/server/cuenta";

export const POST = route(async (req) => {
  const uid = await requireUser();
  limit(`club:${uid}`, 5, 60 * 60_000);
  return { id: await crearClub(uid, await body(req, clubInput)) };
});
