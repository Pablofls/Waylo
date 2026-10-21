import { ApiError, requireUser, route } from "@/server/api";
import { marcarMapa } from "@/server/mapas";

type Ctx = { params: Promise<{ area: string }> };
const clave = async (ctx: Ctx) => {
  const { area } = await ctx.params;
  if (!/^[a-z_]{1,40}$/.test(area)) throw new ApiError(400, "Área no válida.");
  return area;
};

export const PUT = route(async (_req, ctx: Ctx) => {
  await marcarMapa(await requireUser(), await clave(ctx), true);
});

export const DELETE = route(async (_req, ctx: Ctx) => {
  await marcarMapa(await requireUser(), await clave(ctx), false);
});
