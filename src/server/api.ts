import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { currentUserId } from "./session";

export class ApiError extends Error {
  constructor(public status: number, message: string, public headers?: Record<string, string>) {
    super(message);
  }
}

export const unauthorized = () => new ApiError(401, "Inicia sesión para continuar.");
export const notFound = (what = "No encontramos lo que buscas.") => new ApiError(404, what);
export const forbidden = (what = "No tienes permiso para hacer esto.") => new ApiError(403, what);

export async function requireUser(): Promise<string> {
  const id = await currentUserId();
  if (!id) throw unauthorized();
  return id;
}

/** Rechaza peticiones que modifican datos desde otro origen (defensa en profundidad además de SameSite). */
export function assertSameOrigin(req: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const origin = req.headers.get("origin");
  if (!origin) return;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host || new URL(origin).host !== host) throw new ApiError(403, "Origen no permitido.");
}

export async function body<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "El cuerpo de la petición no es JSON válido.");
  }
  return schema.parse(raw);
}

export function clientIp(req: Request): string {
  // Apache agrega la IP real AL FINAL de x-forwarded-for; lo que venga antes lo puede inventar el cliente.
  const forwarded = req.headers.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean).pop();
  return forwarded || req.headers.get("x-real-ip") || "desconocida";
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response | object | null | void>;

/** Envuelve un handler: valida el origen y traduce errores a JSON `{ error }`. */
export function route<C = unknown>(handler: Handler<C>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      assertSameOrigin(req);
      const out = await handler(req, ctx);
      if (out instanceof Response) return out;
      return NextResponse.json(out ?? { ok: true });
    } catch (e) {
      if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status, headers: e.headers });
      if (e instanceof ZodError) return NextResponse.json({ error: e.issues[0]?.message ?? "Datos inválidos.", campo: e.issues[0]?.path.join(".") }, { status: 400 });
      console.error("[api]", e);
      return NextResponse.json({ error: "Algo salió mal. Intenta de nuevo." }, { status: 500 });
    }
  };
}
