import { notFound, requireUser, route } from "@/server/api";
import { isUuid } from "@/server/geo";
import { navegacion } from "@/server/rutas";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req, ctx: Ctx) => {
  const uid = await requireUser();
  const { id } = await ctx.params;
  if (!isUuid(id)) throw notFound();
  return navegacion(uid, id);
});
