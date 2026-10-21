import { describe, expect, it } from "vitest";
import { hashPassword, checkPassword, hashToken, newCode, newToken, safeEqual } from "@/server/crypto";
import { rateLimit, resetRateLimits } from "@/server/rate-limit";
import { tipoDeImagen } from "@/server/fotos";
import { routeProgress, bearing } from "@/lib/map/geo";
import { scoreFromTrack } from "@/lib/map/risk";
import { smsHref } from "@/lib/emergency";
import { lineFromGeoJSON, isUuid } from "@/server/geo";
import { registroSchema } from "@/server/cuenta";
import { crearReporteInput } from "@/server/reportes";
import { placeInput } from "@/server/lugares";

describe("contraseñas y tokens", () => {
  it("hace hash con argon2 y verifica", async () => {
    const h = await hashPassword("una-contraseña-larga");
    expect(h).toMatch(/^\$argon2/);
    expect(await checkPassword(h, "una-contraseña-larga")).toBe(true);
    expect(await checkPassword(h, "otra")).toBe(false);
    expect(await checkPassword("no-es-un-hash", "x")).toBe(false);
  });
  it("el hash del token depende de SESSION_SECRET y es estable", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
    expect(hashToken("abc")).toMatch(/^[0-9a-f]{64}$/);
  });
  it("genera tokens y códigos", () => {
    expect(newToken()).not.toBe(newToken());
    expect(newCode()).toMatch(/^\d{6}$/);
    expect(safeEqual("a", "a")).toBe(true);
    expect(safeEqual("a", "ab")).toBe(false);
  });
});

describe("límite de intentos", () => {
  it("bloquea al pasar el máximo y libera al terminar la ventana", () => {
    resetRateLimits();
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 1000, 1000 + i).ok).toBe(true);
    const blocked = rateLimit("k", 3, 1000, 1500);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(rateLimit("k", 3, 1000, 2500).ok).toBe(true);
    expect(rateLimit("otra", 3, 1000, 1500).ok).toBe(true);
  });
});

describe("fotos", () => {
  it("reconoce el tipo por los bytes y rechaza lo demás", () => {
    expect(tipoDeImagen(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))?.ext).toBe("jpg");
    expect(tipoDeImagen(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]))?.ext).toBe("png");
    expect(tipoDeImagen(Buffer.from("<script>alert(1)</script>"))).toBeNull();
    expect(tipoDeImagen(Buffer.from("RIFFxxxxWEBPyyyy"))?.ext).toBe("webp");
  });
});

describe("geografía", () => {
  const ruta: [number, number][] = [[-100.4, 25.65], [-100.39, 25.65], [-100.38, 25.65]];
  it("calcula avance y distancia a la ruta", () => {
    const mitad = routeProgress([-100.39, 25.65], ruta);
    expect(mitad.fraction).toBeCloseTo(0.5, 2);
    expect(mitad.offKm).toBeLessThan(0.01);
    const lejos = routeProgress([-100.39, 25.66], ruta);
    expect(lejos.offKm).toBeGreaterThan(1);
  });
  it("calcula el rumbo", () => {
    expect(Math.round(bearing([-100.4, 25.65], [-100.39, 25.65]))).toBe(90);
    expect(Math.round(bearing([-100.4, 25.65], [-100.4, 25.66]))).toBe(0);
  });
  it("puntúa un recorrido libre según el riesgo cercano", () => {
    const sinRiesgo = { type: "FeatureCollection" as const, features: [] };
    const conRiesgo = { type: "FeatureCollection" as const, features: ruta.map((c) => ({ type: "Feature" as const, properties: { weight: 1 }, geometry: { type: "Point" as const, coordinates: c } })) };
    expect(scoreFromTrack(ruta, sinRiesgo)).toBeGreaterThan(scoreFromTrack(ruta, conRiesgo));
    expect(scoreFromTrack([], sinRiesgo)).toBe(70);
  });
  it("lee GeoJSON y valida uuid", () => {
    expect(lineFromGeoJSON('{"type":"LineString","coordinates":[[-100.4,25.6],[-100.3,25.7]]}')).toEqual([[-100.4, 25.6], [-100.3, 25.7]]);
    expect(lineFromGeoJSON(null)).toEqual([]);
    expect(isUuid("00000000-0000-4000-8000-000000000000")).toBe(true);
    expect(isUuid("1; DROP TABLE usuario")).toBe(false);
  });
});

describe("emergencia", () => {
  it("arma el enlace sms con la ubicación", () => {
    const href = smsHref([{ id: "1", name: "Rosa", phone: "81 1234 5678", relation: "Mamá" }], [-100.4, 25.65], "Emergencia.");
    expect(href.startsWith("sms:8112345678?&body=")).toBe(true);
    expect(decodeURIComponent(href)).toContain("maps?q=25.650000,-100.400000");
  });
});

describe("validaciones de entrada", () => {
  it("el registro exige correo, contraseña de 8+ y normaliza el correo", () => {
    expect(registroSchema.safeParse({ nombre: "Ana", correo: "ANA@Correo.com ", contrasena: "12345678" }).data?.correo).toBe("ana@correo.com");
    expect(registroSchema.safeParse({ nombre: "Ana", correo: "no-es-correo", contrasena: "12345678" }).success).toBe(false);
    expect(registroSchema.safeParse({ nombre: "Ana", correo: "a@b.com", contrasena: "corta" }).success).toBe(false);
  });
  it("un reporte debe quedar dentro del área metropolitana y usar una categoría válida", () => {
    expect(crearReporteInput.safeParse({ categoria: "bache", lng: -100.4, lat: 25.65 }).success).toBe(true);
    expect(crearReporteInput.safeParse({ categoria: "bache", lng: 2.3, lat: 48.8 }).success).toBe(false);
    expect(crearReporteInput.safeParse({ categoria: "otra", lng: -100.4, lat: 25.65 }).success).toBe(false);
  });
  it("un lugar exige coordenadas válidas", () => {
    expect(placeInput.safeParse({ name: "UDEM", coordinates: [-100.417, 25.66] }).success).toBe(true);
    expect(placeInput.safeParse({ name: "", coordinates: [-100.417, 25.66] }).success).toBe(false);
  });
});
