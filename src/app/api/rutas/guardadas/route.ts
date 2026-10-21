import { body, requireUser, route } from "@/server/api";
import { guardarRuta, guardarRutaInput } from "@/server/rutas";

export const POST = route(async (req) => {
  const uid = await requireUser();
  return guardarRuta(uid, await body(req, guardarRutaInput));
});
