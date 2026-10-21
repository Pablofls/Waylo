import { body, requireUser, route } from "@/server/api";
import { cancelarReporte, completarInput, completarReporte } from "@/server/reportes";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = route(async (req, ctx: Ctx) => {
  const uid = await requireUser();
  await completarReporte(uid, (await ctx.params).id, await body(req, completarInput));
});

export const DELETE = route(async (_req, ctx: Ctx) => {
  await cancelarReporte(await requireUser(), (await ctx.params).id);
});
