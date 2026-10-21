import { body, requireUser, route } from "@/server/api";
import { cancelarRodadaGrupal, editarRodadaGrupal, rodadaGrupalInput } from "@/server/grupales";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = route(async (req, ctx: Ctx) => {
  const uid = await requireUser();
  await editarRodadaGrupal(uid, (await ctx.params).id, await body(req, rodadaGrupalInput));
});

export const DELETE = route(async (_req, ctx: Ctx) => {
  await cancelarRodadaGrupal(await requireUser(), (await ctx.params).id);
});
