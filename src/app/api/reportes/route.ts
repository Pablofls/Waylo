import { body, requireUser, route } from "@/server/api";
import { limit } from "@/server/cuenta";
import { crearReporte, crearReporteInput, miReporte } from "@/server/reportes";

export const POST = route(async (req) => {
  const uid = await requireUser();
  limit(`reporte:${uid}`, 30, 60 * 60_000);
  const id = await crearReporte(uid, await body(req, crearReporteInput));
  return miReporte(uid, id);
});
