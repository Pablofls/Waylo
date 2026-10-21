import { requireUser, route } from "@/server/api";
import { reaccionar } from "@/server/social";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = route(async (_req, ctx: Ctx) => {
  await reaccionar(await requireUser(), (await ctx.params).id, true);
});

export const DELETE = route(async (_req, ctx: Ctx) => {
  await reaccionar(await requireUser(), (await ctx.params).id, false);
});
