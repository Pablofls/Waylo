import { z } from "zod";
import { body, requireUser, route } from "@/server/api";
import { cerrarEmergencia } from "@/server/seguridad";

export const POST = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const uid = await requireUser();
  const { resultado } = await body(req, z.object({ resultado: z.enum(["falsa_alarma", "contactos_avisados"]) }));
  await cerrarEmergencia(uid, (await ctx.params).id, resultado);
});
