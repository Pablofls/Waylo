import { z } from "zod";
import { body, clientIp, route } from "@/server/api";
import { autenticar, emailSchema, limit } from "@/server/cuenta";
import { openSession } from "@/server/session";

const schema = z.object({ correo: emailSchema, contrasena: z.string().min(1, "Escribe tu contraseña.").max(128) });

export const POST = route(async (req) => {
  const { correo, contrasena } = await body(req, schema);
  limit(`login-ip:${clientIp(req)}`, 30, 15 * 60_000);
  limit(`login:${correo}`, 6, 15 * 60_000);
  const id = await autenticar(correo, contrasena);
  await openSession(id);
  return { ok: true };
});
