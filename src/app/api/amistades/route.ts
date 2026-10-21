import { body, requireUser, route } from "@/server/api";
import { limit } from "@/server/cuenta";
import { amistadInput, cambiarAmistad } from "@/server/social";

export const POST = route(async (req) => {
  const uid = await requireUser();
  limit(`amistad:${uid}`, 60, 60 * 60_000);
  await cambiarAmistad(uid, await body(req, amistadInput));
});
