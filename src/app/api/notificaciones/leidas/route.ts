import { requireUser, route } from "@/server/api";
import { marcarTodasLeidas } from "@/server/notificaciones";

export const POST = route(async () => {
  await marcarTodasLeidas(await requireUser());
});
