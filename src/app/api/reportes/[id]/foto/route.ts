import { ApiError, notFound, requireUser, route } from "@/server/api";
import { borrarImagen, guardarImagen, leerImagen, MAX_FOTO_BYTES } from "@/server/fotos";
import { fotoDe, guardarFotoUrl, miReporte, quitarFoto } from "@/server/reportes";

type Ctx = { params: Promise<{ id: string }> };

/** Foto de un reporte visible para la persona con sesión (los reportes de la comunidad son públicos para ella). */
export const GET = route(async (_req, ctx: Ctx) => {
  const uid = await requireUser();
  const nombre = await fotoDe(uid, (await ctx.params).id);
  const img = nombre ? await leerImagen(nombre) : null;
  if (!img) throw notFound("Este reporte no tiene foto.");
  return new Response(new Uint8Array(img.bytes), { headers: { "Content-Type": img.mime, "X-Content-Type-Options": "nosniff", "Cache-Control": "private, max-age=3600", "Content-Disposition": "inline" } });
});

export const PUT = route(async (req, ctx: Ctx) => {
  const uid = await requireUser();
  const { id } = await ctx.params;
  if (!(await miReporte(uid, id))) throw notFound();
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_FOTO_BYTES) throw new ApiError(413, "La foto pesa más de 5 MB.");
  const nombre = await guardarImagen(Buffer.from(await req.arrayBuffer()));
  const anterior = await fotoDe(uid, id);
  await guardarFotoUrl(uid, id, nombre);
  await borrarImagen(anterior);
});

export const DELETE = route(async (_req, ctx: Ctx) => {
  const uid = await requireUser();
  await borrarImagen(await quitarFoto(uid, (await ctx.params).id));
});
