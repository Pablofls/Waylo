import { cookies } from "next/headers";
import { hashToken, newToken } from "./crypto";
import { query, queryOne } from "./db";

export const SESSION_COOKIE = "waylo_session";
const SESSION_DAYS = 30;

/** Abre una sesión: guarda solo el hash en la base y entrega el token en una cookie httpOnly. */
export async function openSession(userId: string): Promise<void> {
  const token = newToken();
  await query(`INSERT INTO sesion (usuario_id, token_hash, expira_en) VALUES ($1, $2, now() + make_interval(days => $3))`, [userId, hashToken(token), SESSION_DAYS]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function currentUserId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await queryOne<{ usuario_id: string }>(`SELECT usuario_id FROM sesion WHERE token_hash = $1 AND revocada_en IS NULL AND expira_en > now()`, [hashToken(token)]);
  return row?.usuario_id ?? null;
}

export async function closeSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await query(`UPDATE sesion SET revocada_en = now() WHERE token_hash = $1 AND revocada_en IS NULL`, [hashToken(token)]);
  jar.delete(SESSION_COOKIE);
}

/** Revoca todas las sesiones de la persona, salvo la actual si se indica (cambio de contraseña). */
export async function revokeOtherSessions(userId: string, keepToken?: string): Promise<void> {
  await query(`UPDATE sesion SET revocada_en = now() WHERE usuario_id = $1 AND revocada_en IS NULL AND ($2::text IS NULL OR token_hash <> $2)`, [userId, keepToken ? hashToken(keepToken) : null]);
}
