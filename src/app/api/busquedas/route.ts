import { z } from "zod";
import { body, requireUser, route } from "@/server/api";
import { agregarBusqueda, limpiarBusquedas } from "@/server/lugares";

export const POST = route(async (req) => {
  const uid = await requireUser();
  const { lugarId } = await body(req, z.object({ lugarId: z.string().uuid() }));
  await agregarBusqueda(uid, lugarId);
});

export const DELETE = route(async () => {
  await limpiarBusquedas(await requireUser());
});
