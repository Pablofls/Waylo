import { body, requireUser, route } from "@/server/api";
import { guardarRutas, rutasSchema } from "@/server/ajustes";

export const PUT = route(async (req) => {
  const uid = await requireUser();
  await guardarRutas(uid, await body(req, rutasSchema));
});
