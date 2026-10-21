import { body, requireUser, route } from "@/server/api";
import { guardarNotificaciones, notificacionesSchema } from "@/server/ajustes";

export const PUT = route(async (req) => {
  const uid = await requireUser();
  await guardarNotificaciones(uid, await body(req, notificacionesSchema));
});
