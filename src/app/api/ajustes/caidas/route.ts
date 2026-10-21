import { z } from "zod";
import { body, requireUser, route } from "@/server/api";
import { guardarCaidas } from "@/server/seguridad";

export const PUT = route(async (req) => {
  const uid = await requireUser();
  const { activa } = await body(req, z.object({ activa: z.boolean() }));
  await guardarCaidas(uid, activa);
});
