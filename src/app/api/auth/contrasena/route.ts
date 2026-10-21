import { z } from "zod";
import { body, requireUser, route } from "@/server/api";
import { cambiarContrasena, limit, passwordSchema } from "@/server/cuenta";

const schema = z.object({ actual: z.string().min(1).max(128), nueva: passwordSchema });

export const POST = route(async (req) => {
  const uid = await requireUser();
  limit(`cambiar-pass:${uid}`, 5, 15 * 60_000);
  const { actual, nueva } = await body(req, schema);
  await cambiarContrasena(uid, actual, nueva);
});
