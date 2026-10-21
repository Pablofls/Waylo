import { jwtVerify } from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/session", () => ({
  SESSION_COOKIE: "waylo_session",
  currentUserId: vi.fn(),
  openSession: vi.fn(),
  closeSession: vi.fn(),
  revokeOtherSessions: vi.fn(),
}));
vi.mock("@/server/db", () => ({ query: vi.fn(), queryOne: vi.fn(), tx: vi.fn() }));

import { query, queryOne, tx } from "@/server/db";
import { currentUserId } from "@/server/session";
import { resetRateLimits } from "@/server/rate-limit";
import { hashPassword } from "@/server/crypto";

const ME = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const RIDE = "33333333-3333-4333-8333-333333333333";
const REPORT = "44444444-4444-4444-8444-444444444444";

const as = (id: string | null) => vi.mocked(currentUserId).mockResolvedValue(id);
const req = (method: string, body?: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost:3100/api/x", { method, headers: { "Content-Type": "application/json", host: "localhost:3100", ...headers }, body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body) });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const json = async (r: Response) => (await r.json()) as Record<string, unknown>;

beforeEach(() => {
  vi.resetAllMocks();
  resetRateLimits();
  vi.mocked(query).mockResolvedValue([]);
  vi.mocked(queryOne).mockResolvedValue(null);
});

describe("autenticación: sin sesión nada se puede usar", () => {
  it.each([
    ["POST /api/reportes", async () => (await import("@/app/api/reportes/route")).POST(req("POST", {}), undefined)],
    ["POST /api/rodadas", async () => (await import("@/app/api/rodadas/route")).POST(req("POST", {}), undefined)],
    ["POST /api/ws-token", async () => (await import("@/app/api/ws-token/route")).POST(req("POST", { role: "gps" }), undefined)],
    ["PUT /api/privacidad", async () => (await import("@/app/api/privacidad/route")).PUT(req("PUT", {}), undefined)],
    ["POST /api/amistades", async () => (await import("@/app/api/amistades/route")).POST(req("POST", {}), undefined)],
    ["GET /api/personas", async () => (await import("@/app/api/personas/route")).GET(req("GET"), undefined)],
    ["DELETE /api/cuenta", async () => (await import("@/app/api/auth/cuenta/route")).DELETE(req("DELETE", { contrasena: "x" }), undefined)],
  ])("%s responde 401", async (_n, call) => {
    as(null);
    const res = await call();
    expect(res.status).toBe(401);
    expect((await json(res)).error).toMatch(/Inicia sesión/);
    expect(query).not.toHaveBeenCalled();
  });
});

describe("origen y formato", () => {
  it("rechaza peticiones que modifican datos desde otro origen", async () => {
    as(ME);
    const { POST } = await import("@/app/api/reportes/route");
    const res = await POST(req("POST", { categoria: "bache", lng: -100.4, lat: 25.65 }, { origin: "https://evil.example" }), undefined);
    expect(res.status).toBe(403);
  });
  it("rechaza JSON mal formado y datos inválidos con 400", async () => {
    as(ME);
    const { POST } = await import("@/app/api/reportes/route");
    expect((await POST(req("POST", "{no es json"), undefined)).status).toBe(400);
    const bad = await POST(req("POST", { categoria: "bache", lng: 2.3, lat: 48.8 }), undefined);
    expect(bad.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
  it("trata ids que no son uuid como inexistentes", async () => {
    as(ME);
    const { DELETE } = await import("@/app/api/bloqueos/[id]/route");
    expect((await DELETE(req("DELETE"), ctx("1; DROP TABLE usuario"))).status).toBe(404);
  });
});

describe("POST /api/ws-token", () => {
  it("emite un JWT corto con sub, role y exp (gps no lleva allow)", async () => {
    as(ME);
    const { POST } = await import("@/app/api/ws-token/route");
    const res = await POST(req("POST", { role: "gps" }), undefined);
    expect(res.status).toBe(200);
    const { token, expiresAt } = (await json(res)) as { token: string; expiresAt: number };
    const { payload, protectedHeader } = await jwtVerify(token, new TextEncoder().encode("y".repeat(40)));
    expect(protectedHeader.alg).toBe("HS256");
    expect(payload.sub).toBe(ME);
    expect(payload.role).toBe("gps");
    expect(payload.allow).toBeUndefined();
    expect(payload.exp! * 1000).toBe(expiresAt);
    expect(payload.exp! - Math.floor(Date.now() / 1000)).toBeLessThanOrEqual(300);
  });
  it("para map incluye allow con quienes comparten con la persona", async () => {
    as(ME);
    vi.mocked(query).mockResolvedValueOnce([{ usuario_id: OTHER }]);
    const { POST } = await import("@/app/api/ws-token/route");
    const { token } = (await json(await POST(req("POST", { role: "map" }), undefined))) as { token: string };
    const { payload } = await jwtVerify(token, new TextEncoder().encode("y".repeat(40)));
    expect(payload.role).toBe("map");
    expect(payload.allow).toEqual([OTHER]);
    expect(vi.mocked(query).mock.calls[0][0]).toContain("v_comparticion_activa");
    expect(vi.mocked(query).mock.calls[0][1]).toEqual([ME]);
  });
  it("rechaza roles desconocidos", async () => {
    as(ME);
    const { POST } = await import("@/app/api/ws-token/route");
    expect((await POST(req("POST", { role: "admin" }), undefined)).status).toBe(400);
  });
});

describe("inicio de sesión", () => {
  it("responde igual si el correo no existe o la contraseña es incorrecta", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const noUser = await POST(req("POST", { correo: "a@b.com", contrasena: "mala-contrasena" }), undefined);
    vi.mocked(queryOne).mockResolvedValueOnce({ id: ME, contrasena_hash: await hashPassword("la-buena-contrasena") });
    const badPass = await POST(req("POST", { correo: "a@b.com", contrasena: "mala-contrasena" }), undefined);
    expect(noUser.status).toBe(401);
    expect(badPass.status).toBe(401);
    expect(await json(noUser)).toEqual(await json(badPass));
  });
  it("abre sesión con credenciales correctas", async () => {
    const { openSession } = await import("@/server/session");
    const { POST } = await import("@/app/api/auth/login/route");
    vi.mocked(queryOne).mockResolvedValueOnce({ id: ME, contrasena_hash: await hashPassword("la-buena-contrasena") });
    const ok = await POST(req("POST", { correo: "A@B.com", contrasena: "la-buena-contrasena" }), undefined);
    expect(ok.status).toBe(200);
    expect(openSession).toHaveBeenCalledWith(ME);
    expect(vi.mocked(queryOne).mock.calls[0][1]).toEqual(["a@b.com"]);
  });
  it("limita los intentos por correo (429 con Retry-After)", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    let last: Response | null = null;
    for (let i = 0; i < 8; i++) last = await POST(req("POST", { correo: "victima@b.com", contrasena: "intento-numero-" + i }), undefined);
    expect(last!.status).toBe(429);
    expect(last!.headers.get("Retry-After")).toBeTruthy();
  });
});

describe("registro", () => {
  it("avisa si el correo ya existe (409) y no abre sesión", async () => {
    const { openSession } = await import("@/server/session");
    vi.mocked(tx).mockRejectedValueOnce(Object.assign(new Error("dup"), { code: "23505" }));
    const { POST } = await import("@/app/api/auth/registro/route");
    const res = await POST(req("POST", { nombre: "Ana", correo: "ana@b.com", contrasena: "12345678" }), undefined);
    expect(res.status).toBe(409);
    expect(openSession).not.toHaveBeenCalled();
  });
  it("rechaza contraseñas cortas", async () => {
    const { POST } = await import("@/app/api/auth/registro/route");
    expect((await POST(req("POST", { nombre: "Ana", correo: "ana@b.com", contrasena: "corta" }), undefined)).status).toBe(400);
    expect(tx).not.toHaveBeenCalled();
  });
});

describe("borrar cuenta", () => {
  it("pide la contraseña correcta", async () => {
    as(ME);
    vi.mocked(queryOne).mockResolvedValueOnce({ contrasena_hash: await hashPassword("la-buena-contrasena") });
    const { DELETE } = await import("@/app/api/auth/cuenta/route");
    const res = await DELETE(req("DELETE", { contrasena: "otra" }), undefined);
    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
});

describe("permisos sobre recursos ajenos", () => {
  it("no se puede pausar la rodada de otra persona", async () => {
    as(ME);
    vi.mocked(queryOne).mockResolvedValueOnce(null); // la consulta filtra por usuario_id = sesión
    const { POST } = await import("@/app/api/rodadas/[id]/pausa/route");
    const res = await POST(req("POST", { pausada: true }), ctx(RIDE));
    expect(res.status).toBe(404);
    expect(vi.mocked(queryOne).mock.calls[0][1]).toEqual([RIDE, ME]);
  });
  it("no se puede confirmar el propio reporte (403)", async () => {
    as(ME);
    const row = { reporte_id: REPORT, categoria_clave: "bache", latitud: 25.65, longitud: -100.4, referencia: null, colonia: null, municipio: null, gravedad_clave: null, nota: null, tiene_foto: false, creado_en: new Date(), estado_clave: "enviado", confirmaciones: 0, mi_voto: null, mio: true };
    vi.mocked(query).mockImplementation(async (sql: string) => (sql.includes("FROM v_reporte v WHERE v.usuario_id") ? [row] : []));
    const { POST } = await import("@/app/api/reportes/[id]/confirmacion/route");
    const res = await POST(req("POST", { resultado: "sigue" }), ctx(REPORT));
    expect(res.status).toBe(403);
    expect(vi.mocked(query).mock.calls.some(([sql]) => String(sql).includes("INSERT INTO reporte_confirmacion"))).toBe(false);
  });
  it("un reporte de la comunidad sí se puede confirmar, con la sesión como votante", async () => {
    as(ME);
    const row = { reporte_id: REPORT, categoria_clave: "bache", latitud: 25.65, longitud: -100.4, referencia: null, colonia: null, municipio: null, gravedad_clave: null, nota: null, tiene_foto: false, creado_en: new Date(), estado_clave: "enviado", confirmaciones: 2, mi_voto: null, mio: false };
    vi.mocked(query).mockImplementation(async (sql: string) => (sql.includes("FROM v_reporte_publico v") ? [row] : []));
    const { POST } = await import("@/app/api/reportes/[id]/confirmacion/route");
    const res = await POST(req("POST", { resultado: "sigue" }), ctx(REPORT));
    expect(res.status).toBe(200);
    const insert = vi.mocked(query).mock.calls.find(([sql]) => String(sql).includes("INSERT INTO reporte_confirmacion"));
    expect(insert?.[1]).toEqual([REPORT, ME, "sigue"]);
  });
  it("no se puede completar ni subir foto a un reporte ajeno", async () => {
    as(ME);
    const patch = (await import("@/app/api/reportes/[id]/route")).PATCH;
    const res = await patch(req("PATCH", { severity: "leve", note: "Bache grande en el carril", street: "Av. Morones Prieto" }), ctx(REPORT));
    expect(res.status).toBe(404);
    const put = (await import("@/app/api/reportes/[id]/foto/route")).PUT;
    const foto = await put(req("PUT", "bytes", { "Content-Type": "image/jpeg" }), ctx(REPORT));
    expect(foto.status).toBe(404);
  });
});

describe("amistades y bloqueos", () => {
  it("valida la acción y no permite agregarse a uno mismo", async () => {
    as(ME);
    const { POST } = await import("@/app/api/amistades/route");
    expect((await POST(req("POST", { con: OTHER, accion: "hackear" }), undefined)).status).toBe(400);
    expect((await POST(req("POST", { con: ME, accion: "enviar" }), undefined)).status).toBe(400);
  });
  it("no se puede enviar solicitud a quien bloqueó o fue bloqueado (403)", async () => {
    as(ME);
    vi.mocked(queryOne).mockImplementation(async (sql: string) => (sql.includes("FROM usuario WHERE id") ? { "?column?": 1 } : sql.includes("usuario_bloqueado") ? { "?column?": 1 } : null));
    const { POST } = await import("@/app/api/amistades/route");
    expect((await POST(req("POST", { con: OTHER, accion: "enviar" }), undefined)).status).toBe(403);
    expect(tx).not.toHaveBeenCalled();
  });
  it("no se puede bloquear a uno mismo", async () => {
    as(ME);
    const { POST } = await import("@/app/api/bloqueos/route");
    expect((await POST(req("POST", { usuarioId: ME }), undefined)).status).toBe(400);
  });
});

describe("fotos de reportes", () => {
  const mine = { reporte_id: REPORT, categoria_clave: "bache", latitud: 25.65, longitud: -100.4, referencia: null, colonia: null, municipio: null, gravedad_clave: null, nota: null, tiene_foto: false, creado_en: new Date(), estado_clave: "enviado", confirmaciones: 0, mi_voto: null, mio: true };
  beforeEach(() => {
    as(ME);
    vi.mocked(query).mockImplementation(async (sql: string) => (sql.includes("FROM v_reporte v WHERE v.usuario_id") ? [mine] : []));
  });
  it("rechaza archivos que no son imágenes (415)", async () => {
    const put = (await import("@/app/api/reportes/[id]/foto/route")).PUT;
    const res = await put(req("PUT", "<script>alert(1)</script> esto no es una foto", { "Content-Type": "image/jpeg" }), ctx(REPORT));
    expect(res.status).toBe(415);
  });
  it("rechaza fotos de más de 5 MB (413)", async () => {
    const put = (await import("@/app/api/reportes/[id]/foto/route")).PUT;
    const res = await put(req("PUT", "x", { "Content-Length": String(6 * 1024 * 1024), "Content-Type": "image/jpeg" }), ctx(REPORT));
    expect(res.status).toBe(413);
  });
});
