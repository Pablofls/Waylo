import { z } from "zod";
import { body, requireUser, route } from "@/server/api";
import { placeInput } from "@/server/lugares";
import { calcularRutas } from "@/server/motor-rutas";

export const POST = route(async (req) => {
  const uid = await requireUser();
  const { origen, destino } = await body(req, z.object({ origen: placeInput, destino: placeInput }));
  return calcularRutas(uid, origen, destino);
});
