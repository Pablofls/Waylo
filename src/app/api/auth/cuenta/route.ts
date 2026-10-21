import { z } from "zod";
import { body, requireUser, route } from "@/server/api";
import { borrarCuenta, limit } from "@/server/cuenta";
import { closeSession } from "@/server/session";

const schema = z.object({ contrasena: z.string().min(1).max(128) });

export const DELETE = route(async (req) => {
  const uid = await requireUser();
  limit(`borrar:${uid}`, 5, 15 * 60_000);
  const { contrasena } = await body(req, schema);
  await borrarCuenta(uid, contrasena);
  await closeSession();
});
