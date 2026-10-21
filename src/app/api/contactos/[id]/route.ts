import { body, notFound, requireUser, route } from "@/server/api";
import { isUuid } from "@/server/geo";
import { contactoInput, guardarContacto, quitarContacto } from "@/server/seguridad";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = route(async (req, ctx: Ctx) => {
  const uid = await requireUser();
  const { id } = await ctx.params;
  if (!isUuid(id)) throw notFound();
  return guardarContacto(uid, id, await body(req, contactoInput));
});

export const DELETE = route(async (_req, ctx: Ctx) => {
  await quitarContacto(await requireUser(), (await ctx.params).id);
});
