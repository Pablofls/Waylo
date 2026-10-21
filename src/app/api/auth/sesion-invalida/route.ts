import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/server/session";

/** Destino de las páginas cuando la cookie ya no corresponde a una sesión válida: la borra y manda a iniciar sesión. */
export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/sesion-vencida", req.url));
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
