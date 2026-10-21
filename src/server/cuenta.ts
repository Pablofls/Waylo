import { z } from "zod";
import { ApiError } from "./api";
import { checkPassword, hashPassword, hashToken, newCode, newToken, safeEqual } from "./crypto";
import { query, queryOne, tx } from "./db";
import { getMailer } from "./mail";
import { rateLimit } from "./rate-limit";
import type { MainUse, User, Vehicle } from "@/types";

export const passwordSchema = z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").max(128, "La contraseña es demasiado larga.");
export const emailSchema = z.string().trim().toLowerCase().max(254).email("Escribe un correo válido.");

export const registroSchema = z.object({
  nombre: z.string().trim().min(1, "Escribe tu nombre.").max(120),
  correo: emailSchema,
  contrasena: passwordSchema,
  vehiculo: z.enum(["bicicleta", "scooter", "ambos"]).default("bicicleta"),
  uso: z.enum(["transporte", "recreativo"]).default("transporte"),
  inclinacion: z.number().int().min(0).max(100).default(50),
  minutosExtra: z.number().int().min(0).max(60).default(10),
});

const CODE_MINUTES = 15;
const RESET_MINUTES = 15;

// Hash falso para igualar el tiempo de respuesta cuando el correo no existe.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= hashPassword("contraseña-que-nunca-coincide"));

function tooMany(retryAfterSec: number): never {
  throw new ApiError(429, "Demasiados intentos. Espera un momento e intenta de nuevo.", { "Retry-After": String(retryAfterSec) });
}

export function limit(key: string, max: number, windowMs: number) {
  const r = rateLimit(key, max, windowMs);
  if (!r.ok) tooMany(r.retryAfterSec);
}

export async function sendVerificationCode(userId: string): Promise<void> {
  const u = await queryOne<{ correo: string; nombre: string }>(`SELECT correo, nombre FROM usuario WHERE id = $1`, [userId]);
  if (!u) return;
  const code = newCode();
  await query(`INSERT INTO verificacion_correo (usuario_id, correo, codigo_hash, expira_en) VALUES ($1, $2, $3, now() + make_interval(mins => $4))`, [userId, u.correo, hashToken(`verif:${code}`), CODE_MINUTES]);
  await getMailer().send({
    to: u.correo,
    subject: "Tu código de verificación de Waylo",
    text: `Hola ${u.nombre}, tu código es ${code}. Vence en ${CODE_MINUTES} minutos. Si no creaste una cuenta, ignora este mensaje.`,
  });
}

export async function registrar(input: z.infer<typeof registroSchema>): Promise<string> {
  const hash = await hashPassword(input.contrasena);
  const vehiculos = input.vehiculo === "ambos" ? ["bicicleta", "scooter"] : [input.vehiculo];
  try {
    const id = await tx(async (c) => {
      const { rows } = await c.query<{ id: string }>(`INSERT INTO usuario (nombre, correo, uso_principal_clave) VALUES ($1, $2, $3) RETURNING id`, [input.nombre, input.correo, input.uso]);
      const uid = rows[0].id;
      await c.query(`INSERT INTO credencial (usuario_id, contrasena_hash) VALUES ($1, $2)`, [uid, hash]);
      await c.query(`INSERT INTO usuario_vehiculo (usuario_id, tipo_vehiculo_clave) SELECT $1::uuid, unnest($2::text[])`, [uid, vehiculos]);
      await c.query(`INSERT INTO preferencia_ruta (usuario_id, inclinacion_segura, minutos_extra_max) VALUES ($1, $2, $3)`, [uid, input.inclinacion, input.minutosExtra]);
      await c.query(`INSERT INTO privacidad_usuario (usuario_id) VALUES ($1)`, [uid]);
      return uid;
    });
    await sendVerificationCode(id);
    return id;
  } catch (e) {
    if ((e as { code?: string }).code === "23505") throw new ApiError(409, "Ya existe una cuenta con ese correo.");
    throw e;
  }
}

/** Devuelve el id si las credenciales son correctas; lanza 401 genérico si no. */
export async function autenticar(correo: string, contrasena: string): Promise<string> {
  const row = await queryOne<{ id: string; contrasena_hash: string }>(`SELECT u.id, c.contrasena_hash FROM usuario u JOIN credencial c ON c.usuario_id = u.id WHERE u.correo = $1`, [correo]);
  const ok = await checkPassword(row?.contrasena_hash ?? (await getDummyHash()), contrasena);
  if (!row || !ok) throw new ApiError(401, "Correo o contraseña incorrectos.");
  return row.id;
}

export async function correoVerificado(userId: string): Promise<boolean> {
  const row = await queryOne<{ verificado: boolean }>(`SELECT verificado FROM v_usuario_correo_verificado WHERE usuario_id = $1`, [userId]);
  return row?.verificado ?? false;
}

export async function confirmarCodigo(userId: string, code: string): Promise<void> {
  limit(`verif:${userId}`, 5, 15 * 60_000);
  const row = await queryOne<{ id: string; codigo_hash: string }>(
    `SELECT v.id, v.codigo_hash FROM verificacion_correo v JOIN usuario u ON u.id = v.usuario_id AND u.correo = v.correo
     WHERE v.usuario_id = $1 AND v.confirmada_en IS NULL AND v.expira_en > now() ORDER BY v.creado_en DESC LIMIT 1`,
    [userId],
  );
  if (!row || !safeEqual(row.codigo_hash, hashToken(`verif:${code}`))) throw new ApiError(400, "El código es incorrecto o ya venció.");
  await query(`UPDATE verificacion_correo SET confirmada_en = now() WHERE id = $1`, [row.id]);
}

export async function solicitarRecuperacion(correo: string): Promise<void> {
  const u = await queryOne<{ id: string; nombre: string }>(`SELECT id, nombre FROM usuario WHERE correo = $1`, [correo]);
  if (!u) return; // misma respuesta exista o no el correo
  const code = newCode();
  await query(`INSERT INTO recuperacion_contrasena (usuario_id, token_hash, expira_en) VALUES ($1, $2, now() + make_interval(mins => $3))`, [u.id, hashToken(`reset:${correo}:${code}`), RESET_MINUTES]);
  await getMailer().send({
    to: correo,
    subject: "Restablece tu contraseña de Waylo",
    text: `Hola ${u.nombre}, tu código para elegir una contraseña nueva es ${code}. Vence en ${RESET_MINUTES} minutos. Si no lo pediste, ignora este mensaje.`,
  });
}

export async function restablecer(correo: string, code: string, contrasena: string): Promise<void> {
  limit(`restablecer:${correo}`, 5, 15 * 60_000);
  const hash = await hashPassword(contrasena);
  await tx(async (c) => {
    const { rows } = await c.query<{ usuario_id: string }>(
      `UPDATE recuperacion_contrasena SET usada_en = now() WHERE token_hash = $1 AND usada_en IS NULL AND expira_en > now() RETURNING usuario_id`,
      [hashToken(`reset:${correo}:${code}`)],
    );
    if (!rows[0]) throw new ApiError(400, "El código es incorrecto o ya venció.");
    const uid = rows[0].usuario_id;
    await c.query(`UPDATE credencial SET contrasena_hash = $2, cambiada_en = now() WHERE usuario_id = $1`, [uid, hash]);
    await c.query(`UPDATE sesion SET revocada_en = now() WHERE usuario_id = $1 AND revocada_en IS NULL`, [uid]);
  });
}

export async function cambiarContrasena(userId: string, actual: string, nueva: string): Promise<void> {
  const row = await queryOne<{ contrasena_hash: string }>(`SELECT contrasena_hash FROM credencial WHERE usuario_id = $1`, [userId]);
  if (!row || !(await checkPassword(row.contrasena_hash, actual))) throw new ApiError(400, "La contraseña actual no es correcta.");
  await query(`UPDATE credencial SET contrasena_hash = $2, cambiada_en = now() WHERE usuario_id = $1`, [userId, await hashPassword(nueva)]);
}

export async function borrarCuenta(userId: string, contrasena: string): Promise<void> {
  const row = await queryOne<{ contrasena_hash: string }>(`SELECT contrasena_hash FROM credencial WHERE usuario_id = $1`, [userId]);
  if (!row || !(await checkPassword(row.contrasena_hash, contrasena))) throw new ApiError(400, "La contraseña no es correcta.");
  await query(`DELETE FROM usuario WHERE id = $1`, [userId]);
}

type UserRow = {
  id: string;
  nombre: string;
  correo: string;
  ocupacion: string | null;
  bio: string | null;
  creado_en: Date;
  uso: string;
  ciudad: string | null;
  vehiculos: string[];
  inclinacion: number | null;
  minutos_extra: number | null;
  apagadas: string[];
};

/** Perfil de la persona en el tipo `User` de la interfaz. */
export async function getUserById(userId: string): Promise<User | null> {
  const r = await queryOne<UserRow>(
    `SELECT u.id, u.nombre, u.correo, u.ocupacion, u.bio, u.creado_en, u.uso_principal_clave AS uso, m.nombre AS ciudad,
            COALESCE((SELECT array_agg(tipo_vehiculo_clave) FROM usuario_vehiculo WHERE usuario_id = u.id), '{}') AS vehiculos,
            pr.inclinacion_segura AS inclinacion, pr.minutos_extra_max AS minutos_extra,
            COALESCE((SELECT array_agg(tipo_clave) FROM preferencia_notificacion WHERE usuario_id = u.id AND NOT activa), '{}') AS apagadas
     FROM usuario u
     LEFT JOIN municipio m ON m.clave = u.municipio_clave
     LEFT JOIN preferencia_ruta pr ON pr.usuario_id = u.id
     WHERE u.id = $1`,
    [userId],
  );
  if (!r) return null;
  const vehicle: Vehicle = r.vehiculos.length > 1 ? "ambos" : r.vehiculos[0] === "scooter" ? "scooter" : "bicicleta";
  return {
    id: r.id,
    name: r.nombre,
    occupation: r.ocupacion ?? "",
    city: r.ciudad ?? "",
    email: r.correo,
    vehicle,
    mainUse: r.uso as MainUse,
    routePreference: r.inclinacion ?? 50,
    maxExtraMinutes: r.minutos_extra ?? 10,
    notifications: {
      alertas: !r.apagadas.includes("alerta_ruta"),
      municipio: !r.apagadas.includes("aviso_municipio"),
      rodadas: !r.apagadas.includes("recordatorio_rodada"),
    },
    memberSince: r.creado_en.toISOString().slice(0, 10),
    bio: r.bio ?? undefined,
  };
}
