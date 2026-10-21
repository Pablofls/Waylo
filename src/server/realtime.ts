import { SignJWT } from "jose";
import { secret } from "./crypto";
import { query } from "./db";

const TTL_SECONDS = 300;

/** Personas cuya posición puede ver `uid` ahora (quienes comparten con él). */
export async function permitidosParaVer(uid: string): Promise<string[]> {
  const rows = await query<{ usuario_id: string }>(`SELECT DISTINCT usuario_id FROM v_comparticion_activa WHERE destinatario_id = $1`, [uid]);
  return rows.map((r) => r.usuario_id);
}

/** JWT corto (5 min, HS256) del contrato con el servicio en tiempo real (docs/arquitectura.md). */
export async function emitirTokenWs(uid: string, role: "gps" | "map"): Promise<{ token: string; expiresAt: number }> {
  const claims: Record<string, unknown> = { role };
  if (role === "map") claims.allow = await permitidosParaVer(uid);
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const token = await new SignJWT(claims).setProtectedHeader({ alg: "HS256" }).setSubject(uid).setIssuedAt().setExpirationTime(exp).sign(new TextEncoder().encode(secret("WS_JWT_SECRET")));
  return { token, expiresAt: exp * 1000 };
}
