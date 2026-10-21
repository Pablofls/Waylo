import { z } from "zod";
import { body, requireUser, route } from "@/server/api";
import { limit } from "@/server/cuenta";
import { denunciarReporte } from "@/server/reportes";

export const POST = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const uid = await requireUser();
  limit(`denuncia:${uid}`, 20, 60 * 60_000);
  const { motivo, detalle } = await body(req, z.object({ motivo: z.string().min(1).max(40), detalle: z.string().trim().max(500).optional() }));
  await denunciarReporte(uid, (await ctx.params).id, motivo, detalle);
});
