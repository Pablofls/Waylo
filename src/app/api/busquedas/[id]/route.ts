import { requireUser, route } from "@/server/api";
import { quitarBusqueda } from "@/server/lugares";
import { isUuid } from "@/server/geo";
import { notFound } from "@/server/api";

export const DELETE = route(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const uid = await requireUser();
  const { id } = await ctx.params;
  if (!isUuid(id)) throw notFound();
  await quitarBusqueda(uid, id);
});
