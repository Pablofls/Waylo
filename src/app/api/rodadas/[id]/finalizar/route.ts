import { requireUser, route } from "@/server/api";
import { finalizar } from "@/server/rodadas";

export const POST = route(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  await finalizar(await requireUser(), (await ctx.params).id);
});
