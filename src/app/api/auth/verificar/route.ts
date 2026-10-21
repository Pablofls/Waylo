import { z } from "zod";
import { body, requireUser, route } from "@/server/api";
import { confirmarCodigo, correoVerificado } from "@/server/cuenta";

const schema = z.object({ codigo: z.string().trim().regex(/^\d{6}$/, "El código tiene 6 dígitos.") });

export const GET = route(async () => ({ verificado: await correoVerificado(await requireUser()) }));

export const POST = route(async (req) => {
  const uid = await requireUser();
  const { codigo } = await body(req, schema);
  await confirmarCodigo(uid, codigo);
});
