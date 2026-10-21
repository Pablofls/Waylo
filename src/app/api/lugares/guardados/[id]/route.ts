import { requireUser, route } from "@/server/api";
import { quitarLugarGuardado } from "@/server/lugares";

export const DELETE = route(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const uid = await requireUser();
  await quitarLugarGuardado(uid, (await ctx.params).id);
});
