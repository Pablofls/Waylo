import { requireUser, route } from "@/server/api";
import { unirseReto } from "@/server/logros";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (_req, ctx: Ctx) => {
  await unirseReto(await requireUser(), (await ctx.params).id, true);
});

export const DELETE = route(async (_req, ctx: Ctx) => {
  await unirseReto(await requireUser(), (await ctx.params).id, false);
});
