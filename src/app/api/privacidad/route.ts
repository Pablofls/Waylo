import { body, requireUser, route } from "@/server/api";
import { guardarPrivacidad, miPrivacidad, privacidadSchema } from "@/server/social";

export const GET = route(async () => miPrivacidad(await requireUser()));

export const PUT = route(async (req) => {
  const uid = await requireUser();
  await guardarPrivacidad(uid, await body(req, privacidadSchema));
});
