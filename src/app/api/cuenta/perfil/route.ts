import { body, requireUser, route } from "@/server/api";
import { guardarPerfil, perfilSchema } from "@/server/ajustes";

export const PATCH = route(async (req) => {
  const uid = await requireUser();
  await guardarPerfil(uid, await body(req, perfilSchema));
});
