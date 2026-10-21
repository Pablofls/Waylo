import { z } from "zod";
import { body, requireUser, route } from "@/server/api";
import { limit } from "@/server/cuenta";
import { cancelarSuscripcion, reactivarSuscripcion, suscribir } from "@/server/premium";

// El pago es simulado: no se recibe ni se guarda el número de tarjeta, solo los últimos 4 dígitos para el recibo.
export const POST = route(async (req) => {
  const uid = await requireUser();
  limit(`pago:${uid}`, 5, 60 * 60_000);
  const { ultimos4 } = await body(req, z.object({ ultimos4: z.string().regex(/^\d{4}$/) }));
  return suscribir(uid, ultimos4);
});

export const DELETE = route(async () => {
  await cancelarSuscripcion(await requireUser());
});

export const PATCH = route(async () => {
  await reactivarSuscripcion(await requireUser());
});
