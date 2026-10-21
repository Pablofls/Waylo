import { requireUser, route } from "@/server/api";
import { quitarRutaGuardada } from "@/server/rutas";

export const DELETE = route(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const uid = await requireUser();
  await quitarRutaGuardada(uid, (await ctx.params).id);
});
