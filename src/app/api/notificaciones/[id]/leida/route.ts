import { requireUser, route } from "@/server/api";
import { marcarLeida } from "@/server/notificaciones";

export const POST = route(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  await marcarLeida(await requireUser(), (await ctx.params).id);
});
