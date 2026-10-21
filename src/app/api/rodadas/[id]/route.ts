import { z } from "zod";
import { body, requireUser, route } from "@/server/api";
import { eliminar, renombrar } from "@/server/rodadas";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route(async (req, ctx: Ctx) => {
  const uid = await requireUser();
  const { titulo } = await body(req, z.object({ titulo: z.string().trim().min(1).max(120) }));
  await renombrar(uid, (await ctx.params).id, titulo);
});

export const DELETE = route(async (_req, ctx: Ctx) => {
  await eliminar(await requireUser(), (await ctx.params).id);
});
