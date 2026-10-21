import { body, requireUser, route } from "@/server/api";
import { contactoInput, guardarContacto } from "@/server/seguridad";

export const POST = route(async (req) => {
  const uid = await requireUser();
  return guardarContacto(uid, null, await body(req, contactoInput));
});
