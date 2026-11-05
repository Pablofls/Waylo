import { z } from "zod";
import { body, requireUser, route } from "@/server/api";
import { isUuid } from "@/server/geo";
import { recalcularRuta } from "@/server/motor-rutas";

const input = z.object({ opcionId: z.string().refine(isUuid), lng: z.number().min(-100.7).max(-100.0), lat: z.number().min(25.4).max(26.0) });

export const POST = route(async (req) => {
  const uid = await requireUser();
  const { opcionId, lng, lat } = await body(req, input);
  return recalcularRuta(uid, opcionId, [lng, lat]);
});
