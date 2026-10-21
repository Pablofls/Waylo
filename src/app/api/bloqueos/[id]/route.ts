import { notFound, requireUser, route } from "@/server/api";
import { isUuid } from "@/server/geo";
import { desbloquear } from "@/server/social";

export const DELETE = route(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const uid = await requireUser();
  const { id } = await ctx.params;
  if (!isUuid(id)) throw notFound();
  await desbloquear(uid, id);
});
