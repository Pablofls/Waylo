import { body, requireUser, route } from "@/server/api";
import { guardarLugar, guardarLugarInput } from "@/server/lugares";

export const POST = route(async (req) => {
  const uid = await requireUser();
  return guardarLugar(uid, await body(req, guardarLugarInput));
});
