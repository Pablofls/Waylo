import { z } from "zod";
import { body, requireUser, route } from "@/server/api";
import { limit } from "@/server/cuenta";
import { comentar } from "@/server/social";

export const POST = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const uid = await requireUser();
  limit(`comentar:${uid}`, 30, 60 * 60_000);
  const { texto } = await body(req, z.object({ texto: z.string().trim().min(1, "Escribe un comentario.").max(200) }));
  await comentar(uid, (await ctx.params).id, texto);
});
