import { z } from "zod";
import { body, clientIp, route } from "@/server/api";
import { emailSchema, limit, passwordSchema, restablecer } from "@/server/cuenta";

const schema = z.object({ correo: emailSchema, codigo: z.string().trim().regex(/^\d{6}$/, "El código tiene 6 dígitos."), contrasena: passwordSchema });

export const POST = route(async (req) => {
  limit(`restablecer-ip:${clientIp(req)}`, 20, 60 * 60_000);
  const { correo, codigo, contrasena } = await body(req, schema);
  await restablecer(correo, codigo, contrasena);
});
