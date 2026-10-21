import { z } from "zod";
import { body, requireUser, route } from "@/server/api";
import { bloquear } from "@/server/social";

export const POST = route(async (req) => {
  const uid = await requireUser();
  const { usuarioId } = await body(req, z.object({ usuarioId: z.string().uuid() }));
  await bloquear(uid, usuarioId);
});
