import { z } from "zod";
import { body, requireUser, route } from "@/server/api";
import { pausar } from "@/server/rodadas";

export const POST = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const uid = await requireUser();
  const { pausada } = await body(req, z.object({ pausada: z.boolean() }));
  await pausar(uid, (await ctx.params).id, pausada);
});
