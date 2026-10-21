import { z } from "zod";
import { query } from "./db";

export const comentarioSchema = z.object({
  tipo: z.enum(["idea", "no_funciona", "me_gusto", "otro"]),
  calificacion: z.number().int().min(1, "Elige una calificación.").max(5),
  mensaje: z.string().trim().min(10, "Cuéntanos un poco más (al menos 10 caracteres).").max(500),
});

export const soporteSchema = z.object({
  tema: z.enum(["cuenta", "rutas", "reportes", "pagos", "otro"]),
  mensaje: z.string().trim().min(15, "Cuéntanos un poco más (al menos 15 caracteres).").max(600),
});

export async function enviarComentario(uid: string, d: z.infer<typeof comentarioSchema>): Promise<void> {
  await query(`INSERT INTO comentario_app (usuario_id, tipo_clave, calificacion, mensaje) VALUES ($1, $2, $3, $4)`, [uid, d.tipo, d.calificacion, d.mensaje]);
}

export async function enviarSoporte(uid: string, d: z.infer<typeof soporteSchema>): Promise<void> {
  await query(`INSERT INTO mensaje_soporte (usuario_id, tema_clave, mensaje) VALUES ($1, $2, $3)`, [uid, d.tema, d.mensaje]);
}
