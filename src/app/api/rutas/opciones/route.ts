import { ApiError, requireUser, route } from "@/server/api";
import { isUuid } from "@/server/geo";
import { opcionesHacia } from "@/server/rutas";

export const GET = route(async (req) => {
  const uid = await requireUser();
  const destino = new URL(req.url).searchParams.get("destino") ?? "";
  if (!isUuid(destino)) throw new ApiError(400, "Falta el destino.");
  return { opciones: await opcionesHacia(uid, destino) };
});
