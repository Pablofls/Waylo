import { requireUser, route } from "@/server/api";
import { salir, unirse } from "@/server/grupales";

type Ctx = { params: Promise<{ id: string }> };

export const POST = route(async (_req, ctx: Ctx) => {
  await unirse(await requireUser(), (await ctx.params).id);
});

export const DELETE = route(async (_req, ctx: Ctx) => {
  await salir(await requireUser(), (await ctx.params).id);
});
