import { body, requireUser, route } from "@/server/api";
import { limit } from "@/server/cuenta";
import { comentarioSchema, enviarComentario } from "@/server/ayuda";

export const POST = route(async (req) => {
  const uid = await requireUser();
  limit(`comentario-app:${uid}`, 5, 60 * 60_000);
  await enviarComentario(uid, await body(req, comentarioSchema));
});
