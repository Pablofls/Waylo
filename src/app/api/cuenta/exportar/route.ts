import { requireUser, route } from "@/server/api";
import { limit } from "@/server/cuenta";
import { exportarDatos } from "@/server/ajustes";

export const GET = route(async () => {
  const uid = await requireUser();
  limit(`exportar:${uid}`, 3, 60 * 60_000);
  const datos = await exportarDatos(uid);
  return new Response(JSON.stringify(datos, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="mis-datos-waylo.json"', "Cache-Control": "no-store" } });
});
