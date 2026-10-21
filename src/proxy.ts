import { NextResponse, type NextRequest } from "next/server";

const COOKIE = "waylo_session";

// Pantallas que se ven sin sesión. El resto exige la cookie (las rutas /api y los datos vuelven a validar la sesión).
const PUBLIC = ["/login", "/registro", "/recuperar", "/sesion-vencida", "/sin-conexion", "/acerca-de", "/legal", "/design", "/catalogo"];
// Con sesión no tiene caso volver a estas.
const GUEST_ONLY = ["/", "/login", "/registro"];

const matches = (path: string, list: string[]) => list.some((p) => path === p || (p !== "/" && path.startsWith(`${p}/`)));

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(COOKIE)?.value);
  if (!hasSession && pathname !== "/" && !matches(pathname, PUBLIC)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (hasSession && matches(pathname, GUEST_ONLY)) {
    const url = req.nextUrl.clone();
    url.pathname = "/inicio";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|json|js|css|woff2?)$).*)"],
};
