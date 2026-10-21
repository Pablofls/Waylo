import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { ApiError } from "./api";

export const MAX_FOTO_BYTES = 5 * 1024 * 1024;

const dir = () => path.resolve(/* turbopackIgnore: true */ process.env.UPLOADS_DIR ?? "uploads");

/** Detecta el tipo por los primeros bytes (no se confía en el tipo que declara el cliente). */
export function tipoDeImagen(b: Buffer): { ext: "jpg" | "png" | "webp"; mime: string } | null {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: "png", mime: "image/png" };
  if (b.length > 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP") return { ext: "webp", mime: "image/webp" };
  return null;
}

export async function guardarImagen(bytes: Buffer): Promise<string> {
  if (bytes.length === 0) throw new ApiError(400, "Elige una foto.");
  if (bytes.length > MAX_FOTO_BYTES) throw new ApiError(413, "La foto pesa más de 5 MB.");
  const tipo = tipoDeImagen(bytes);
  if (!tipo) throw new ApiError(415, "Solo se aceptan fotos JPG, PNG o WebP.");
  await mkdir(dir(), { recursive: true });
  const nombre = `${randomBytes(16).toString("hex")}.${tipo.ext}`;
  await writeFile(path.join(/* turbopackIgnore: true */ dir(), nombre), bytes, { mode: 0o640 });
  return nombre;
}

const NOMBRE_VALIDO = /^[0-9a-f]{32}\.(jpg|png|webp)$/;

export async function leerImagen(nombre: string): Promise<{ bytes: Buffer; mime: string } | null> {
  if (!NOMBRE_VALIDO.test(nombre)) return null;
  try {
    const bytes = await readFile(path.join(/* turbopackIgnore: true */ dir(), nombre));
    return { bytes, mime: tipoDeImagen(bytes)?.mime ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

export async function borrarImagen(nombre: string | null): Promise<void> {
  if (!nombre || !NOMBRE_VALIDO.test(nombre)) return;
  await unlink(path.join(/* turbopackIgnore: true */ dir(), nombre)).catch(() => {});
}
