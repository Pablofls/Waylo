import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";

export function secret(name: "SESSION_SECRET" | "WS_JWT_SECRET"): string {
  const v = process.env[name];
  if (!v || v.length < 32) throw new Error(`Falta ${name} (32 caracteres o más).`);
  return v;
}

/** Token aleatorio para cookies y enlaces (se entrega al usuario; en la base solo vive su hash). */
export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Código numérico de 6 dígitos para verificar el correo. */
export function newCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** HMAC con SESSION_SECRET: un volcado de la base no sirve para suplantar sesiones. */
export function hashToken(token: string): string {
  return createHmac("sha256", secret("SESSION_SECRET")).update(token).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const hashPassword = (plain: string) => hash(plain);
export async function checkPassword(storedHash: string, plain: string): Promise<boolean> {
  try {
    return await verify(storedHash, plain);
  } catch {
    return false;
  }
}
