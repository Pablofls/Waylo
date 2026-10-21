import { requireUser, route } from "@/server/api";
import { salirClub, unirseClub } from "@/server/clubes";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (_req, ctx: Ctx) => ({ resultado: await unirseClub(await requireUser(), (await ctx.params).id) }));

export const DELETE = route(async (_req, ctx: Ctx) => {
  await salirClub(await requireUser(), (await ctx.params).id);
});
