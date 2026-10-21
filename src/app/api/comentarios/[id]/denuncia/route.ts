import { z } from "zod";
import { body, requireUser, route } from "@/server/api";
import { limit } from "@/server/cuenta";
import { denunciarComentario } from "@/server/social";

export const POST = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const uid = await requireUser();
  limit(`denuncia:${uid}`, 20, 60 * 60_000);
  const { motivo } = await body(req, z.object({ motivo: z.string().min(1).max(40) }));
  await denunciarComentario(uid, (await ctx.params).id, motivo);
});
