import { z } from "zod";
import { body, requireUser, route } from "@/server/api";
import { confirmarReporte } from "@/server/reportes";

export const POST = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const uid = await requireUser();
  const { resultado } = await body(req, z.object({ resultado: z.enum(["sigue", "resuelto"]) }));
  await confirmarReporte(uid, (await ctx.params).id, resultado);
});
