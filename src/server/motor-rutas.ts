import type { PoolClient } from "pg";
import { ApiError, notFound } from "./api";
import { query, queryOne, tx } from "./db";
import { lugarVisible, resolverLugar, type PlaceInput } from "./lugares";
import { cuadroEvitar, orsConfigurado, rutasORS, type Candidato } from "./ors";
import { rateLimit } from "./rate-limit";
import { OPTION_SQL, navegacion, opcionPorId, opcionesHacia, withFactors, type OptionRow } from "./rutas";
import { distanceKm } from "@/lib/map/geo";
import type { LngLat, NavAlert, NavStep, RiskKey, RouteKind, RouteOption } from "@/types";

/**
 * Motor de rutas: pide alternativas a OpenRouteService, las califica con los reportes de la comunidad,
 * elige rápida / equilibrada / segura según las preferencias de la persona y las guarda en
 * ruta_consulta / ruta_opcion (el Safety Score lo sigue calculando v_ruta_opcion con los pesos del catálogo).
 */

// Pesos de cat_factor_seguridad (para elegir entre candidatos antes de guardarlos).
const PESOS: Record<RiskKey, number> = { trafico: 0.25, robo: 0.25, iluminacion: 0.2, pavimento: 0.15, ciclovia: 0.15 };

const CATEGORIAS: Record<Exclude<RiskKey, "ciclovia">, string[]> = {
  trafico: ["alta_velocidad", "conductor_agresivo", "accidente"],
  robo: ["robo"],
  iluminacion: ["poca_iluminacion"],
  pavimento: ["bache", "calle_cerrada"],
};

const NOMBRES: Record<Exclude<RiskKey, "ciclovia">, string> = { trafico: "tráfico o accidentes", robo: "robo o asalto", iluminacion: "poca iluminación", pavimento: "baches u obras" };

export type Preferencias = { inclinacion: number; minutosExtra: number; evitar: string[]; preferir: string[] };
export type ReportesEnTrazo = { categoria: string; n: number; peso: number }[];
export type Factor = { key: RiskKey; calificacion: number; explicacion: string };

/** Calificación 0-100 de un factor según el riesgo por km (peso de categoría × recencia). */
export const calificacionFactor = (riesgoPorKm: number) => Math.max(20, Math.min(100, Math.round(100 - 12 * riesgoPorKm)));

export function factoresDeRuta(reportes: ReportesEnTrazo, km: number, fraccionCiclovia: number): Factor[] {
  const kmBase = Math.max(0.5, km);
  const out: Factor[] = (Object.keys(CATEGORIAS) as (keyof typeof CATEGORIAS)[]).map((key) => {
    const rs = reportes.filter((r) => CATEGORIAS[key].includes(r.categoria));
    const n = rs.reduce((s, r) => s + r.n, 0);
    const peso = rs.reduce((s, r) => s + r.peso, 0);
    return {
      key,
      calificacion: calificacionFactor(peso / kmBase),
      explicacion: n === 0 ? `Sin reportes recientes de ${NOMBRES[key]} en el trayecto.` : `${n} ${n === 1 ? "reporte" : "reportes"} de ${NOMBRES[key]} en los últimos 90 días.`,
    };
  });
  const pct = Math.round(fraccionCiclovia * 100);
  out.push({ key: "ciclovia", calificacion: Math.round(35 + 65 * fraccionCiclovia), explicacion: pct === 0 ? "El trayecto no usa ciclovías." : `${pct} % del trayecto en ciclovía o camino sin autos.` });
  return out;
}

export const puntaje = (fs: Factor[], pesos: Record<RiskKey, number> = PESOS) => {
  const total = fs.reduce((s, f) => s + pesos[f.key], 0) || 1;
  return fs.reduce((s, f) => s + f.calificacion * pesos[f.key], 0) / total;
};

/** De 19:00 a 06:00 en Monterrey. */
export function esDeNoche(d = new Date()): boolean {
  const h = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "America/Monterrey" }).format(d));
  return h >= 19 || h < 6;
}

export type Evaluado = { minutos: number; factores: Factor[]; fraccionCiclovia: number; fraccionViaRapida: number; cruzaZonaRoja: boolean };

/** Puntaje para elegir (no se guarda): ajusta el Safety Score a lo que la persona pidió evitar o preferir. */
export function puntajeAjustado(c: Evaluado, p: Preferencias, noche: boolean): number {
  const pesos = { ...PESOS };
  if (noche && p.evitar.includes("calles_sin_iluminacion")) pesos.iluminacion *= 2;
  let s = puntaje(c.factores, pesos);
  if (p.evitar.includes("vias_rapidas_sin_ciclovia")) s -= 15 * c.fraccionViaRapida;
  if (p.preferir.includes("ciclovias_confinadas")) s += 10 * c.fraccionCiclovia;
  return s;
}

/** Utilidad entre seguridad y tiempo: α = inclinación (0 = solo tiempo, 1 = solo seguridad). */
const utilidad = (score: number, extra: number, base: number, inclinacion: number) => {
  const a = inclinacion / 100;
  return a * (score / 100) - (1 - a) * (extra / Math.max(1, base));
};

/** Índice de cada tipo de ruta dentro de `cs`. Un mismo candidato puede ocupar varios tipos si hay pocos. */
export function clasificar(cs: Evaluado[], p: Preferencias, noche = esDeNoche()): { rapida: number; segura: number; equilibrada: number; excedeTope: boolean } {
  const idx = cs.map((_, i) => i);
  const rapida = idx.reduce((a, b) => (cs[b].minutos < cs[a].minutos ? b : a));
  const base = cs[rapida].minutos;
  const adj = cs.map((c) => puntajeAjustado(c, p, noche));
  const sinZonaRoja = idx.filter((i) => !cs[i].cruzaZonaRoja);
  const pool = p.evitar.includes("zonas_riesgo_alto") && sinZonaRoja.length > 0 ? sinZonaRoja : idx;
  const mejor = (is: number[], f: (i: number) => number) => is.reduce((a, b) => (f(b) > f(a) ? b : a));
  const enTope = pool.filter((i) => cs[i].minutos - base <= p.minutosExtra);
  const segura = mejor(enTope.length > 0 ? enTope : pool, (i) => adj[i]);
  const resto = pool.filter((i) => i !== rapida && i !== segura);
  const equilibrada = mejor(resto.length > 0 ? resto : pool, (i) => utilidad(adj[i], cs[i].minutos - base, base, Math.max(25, Math.min(75, p.inclinacion))));
  return { rapida, segura, equilibrada, excedeTope: enTope.length === 0 };
}

/** Ruta recomendada entre las opciones ya calculadas: la de mejor utilidad dentro del tope de minutos extra. */
export function recomendar(opciones: RouteOption[], p: Pick<Preferencias, "inclinacion" | "minutosExtra">): RouteKind | null {
  if (opciones.length === 0) return null;
  const base = Math.min(...opciones.map((o) => o.minutes));
  const ok = opciones.filter((o) => o.extraMinutes <= p.minutosExtra);
  const pool = ok.length > 0 ? ok : opciones;
  return pool.reduce((a, b) => (utilidad(b.safetyScore, b.extraMinutes, base, p.inclinacion) > utilidad(a.safetyScore, a.extraMinutes, base, p.inclinacion) ? b : a)).id;
}

/** Quita candidatos casi iguales (mismos puntos al 25, 50 y 75 % del trazo, a menos de 80 m). */
export function sinDuplicados(cs: Candidato[]): Candidato[] {
  const en = (c: Candidato, f: number) => c.coords[Math.min(c.coords.length - 1, Math.round(f * (c.coords.length - 1)))];
  const iguales = (a: Candidato, b: Candidato) => Math.abs(a.metros - b.metros) / Math.max(1, a.metros) < 0.03 && [0.25, 0.5, 0.75].every((f) => distanceKm(en(a, f), en(b, f)) < 0.08);
  return cs.reduce<Candidato[]>((acc, c) => (acc.some((x) => iguales(x, c)) ? acc : [...acc, c]), []);
}

// Base de datos ----------------------------------------------------------------------

export async function preferencias(uid: string): Promise<Preferencias> {
  const [r, ev, pr] = await Promise.all([
    queryOne<{ inclinacion_segura: number; minutos_extra_max: number }>(`SELECT inclinacion_segura, minutos_extra_max FROM preferencia_ruta WHERE usuario_id = $1`, [uid]),
    query<{ evitar_clave: string }>(`SELECT evitar_clave FROM preferencia_ruta_evitar WHERE usuario_id = $1`, [uid]),
    query<{ preferir_clave: string }>(`SELECT preferir_clave FROM preferencia_ruta_preferir WHERE usuario_id = $1`, [uid]),
  ]);
  return { inclinacion: r?.inclinacion_segura ?? 50, minutosExtra: r?.minutos_extra_max ?? 10, evitar: ev.map((e) => e.evitar_clave), preferir: pr.map((e) => e.preferir_clave) };
}

/** Lugar para la consulta: el indicado, o uno privado de la persona con el mismo nombre a ≤30 m, o uno nuevo. */
async function lugarPara(uid: string, p: PlaceInput): Promise<string> {
  if (p.id) return resolverLugar(uid, p);
  const r = await queryOne<{ id: string }>(
    `SELECT id FROM lugar WHERE propietario_id = $1 AND nombre = $2 AND ST_DWithin(geog, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 30) LIMIT 1`,
    [uid, p.name, p.coordinates[0], p.coordinates[1]],
  );
  return r?.id ?? resolverLugar(uid, p);
}

async function coordsDe(uid: string, p: PlaceInput): Promise<LngLat> {
  if (!p.id) return p.coordinates;
  const l = await lugarVisible(uid, p.id);
  if (!l) throw notFound("No encontramos ese lugar.");
  return l.coordinates;
}

/** Cuadros de 120 m alrededor de reportes graves recientes y zonas en rojo cercanas al trayecto (sin tocar origen ni destino). */
async function zonasAEvitar(o: LngLat, d: LngLat): Promise<LngLat[][]> {
  const radio = Math.min(3000, 500 + distanceKm(o, d) * 300);
  const params = [o[0], o[1], d[0], d[1], radio];
  const linea = `ST_MakeLine(ST_SetSRID(ST_MakePoint($1, $2), 4326), ST_SetSRID(ST_MakePoint($3, $4), 4326))::geography`;
  const [reps, zonas] = await Promise.all([
    query<{ lng: number; lat: number }>(
      `SELECT ST_X(r.geog::geometry) AS lng, ST_Y(r.geog::geometry) AS lat FROM reporte r JOIN cat_categoria_reporte c ON c.clave = r.categoria_clave
       WHERE r.cancelado_en IS NULL AND r.creado_en > now() - interval '30 days' AND c.peso_riesgo >= 2
         AND ST_DWithin(r.geog, ${linea}, $5)
         AND NOT ST_DWithin(r.geog, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 200) AND NOT ST_DWithin(r.geog, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, 200)
       ORDER BY c.peso_riesgo DESC, r.creado_en DESC LIMIT 20`,
      params,
    ),
    query<{ anillo: string }>(
      `SELECT ST_AsGeoJSON(ST_ExteriorRing(ST_SimplifyPreserveTopology(z.area::geometry, 0.0003))) AS anillo FROM zona z JOIN v_zona_resumen v ON v.zona_id = z.id
       WHERE v.score < 60 AND ST_DWithin(z.area, ${linea}, $5)
         AND NOT ST_Covers(z.area, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AND NOT ST_Covers(z.area, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography)
       LIMIT 5`,
      params,
    ),
  ]);
  return [
    ...reps.map((r) => cuadroEvitar([Number(r.lng), Number(r.lat)], 120)),
    ...zonas.map((z) => (JSON.parse(z.anillo) as { coordinates: LngLat[] }).coordinates),
  ];
}

async function evaluar(c: Candidato): Promise<Evaluado & { reportes: number }> {
  const geo = JSON.stringify({ type: "LineString", coordinates: c.coords });
  const [reps, zona] = await Promise.all([
    query<{ categoria: string; n: number; peso: number }>(
      `SELECT r.categoria_clave AS categoria, count(*)::int AS n,
              sum(cat.peso_riesgo * greatest(0, 1 - extract(epoch FROM now() - r.creado_en) / (90 * 86400)))::float AS peso
       FROM reporte r JOIN cat_categoria_reporte cat ON cat.clave = r.categoria_clave
       WHERE r.cancelado_en IS NULL AND r.creado_en > now() - interval '90 days' AND ST_DWithin(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography, r.geog, 60)
       GROUP BY r.categoria_clave`,
      [geo],
    ),
    queryOne<{ cruza: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM zona z JOIN v_zona_resumen v ON v.zona_id = z.id WHERE v.score < 60 AND ST_Intersects(z.area, ST_SetSRID(ST_GeomFromGeoJSON($1), 4326)::geography)) AS cruza`,
      [geo],
    ),
  ]);
  const rs = reps.map((r) => ({ categoria: r.categoria, n: Number(r.n), peso: Number(r.peso) }));
  return {
    minutos: Math.max(1, Math.round(c.segundos / 60)),
    factores: factoresDeRuta(rs, c.metros / 1000, c.fraccionCiclovia),
    fraccionCiclovia: c.fraccionCiclovia,
    fraccionViaRapida: c.fraccionViaRapida,
    cruzaZonaRoja: zona?.cruza ?? false,
    reportes: rs.reduce((s, r) => s + r.n, 0),
  };
}

function resumen(tipo: RouteKind, e: Evaluado & { reportes: number }, excedeTope: boolean, tope: number): string {
  const partes = [e.reportes === 0 ? "Sin reportes recientes en el trayecto" : `${e.reportes} ${e.reportes === 1 ? "reporte" : "reportes"} en el trayecto`];
  const pct = Math.round(e.fraccionCiclovia * 100);
  if (pct > 0) partes.push(`${pct} % en ciclovía`);
  if (e.cruzaZonaRoja) partes.push("cruza una zona de riesgo alto");
  if (tipo === "segura" && excedeTope) partes.push(`supera tu tope de ${tope} min extra`);
  return `${partes.join(" · ")}.`;
}

async function guardar(c: PoolClient, uid: string, origen: string, destino: string, elegidas: { tipo: RouteKind; cand: Candidato; ev: Evaluado & { reportes: number }; resumen: string }[]): Promise<string> {
  const { rows } = await c.query<{ id: string }>(`INSERT INTO ruta_consulta (usuario_id, origen_lugar_id, destino_lugar_id) VALUES ($1, $2, $3) RETURNING id`, [uid, origen, destino]);
  const consulta = rows[0].id;
  for (const e of elegidas) {
    const op = await c.query<{ id: string }>(
      `INSERT INTO ruta_opcion (consulta_id, tipo_ruta_clave, minutos, via, resumen, trazo) VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_GeomFromGeoJSON($6), 4326)::geography) RETURNING id`,
      [consulta, e.tipo, e.ev.minutos, e.cand.via, e.resumen, JSON.stringify({ type: "LineString", coordinates: e.cand.coords })],
    );
    const id = op.rows[0].id;
    await c.query(
      `INSERT INTO ruta_opcion_factor (opcion_id, factor_clave, calificacion, explicacion) SELECT $1::uuid, * FROM unnest($2::text[], $3::smallint[], $4::text[])`,
      [id, e.ev.factores.map((f) => f.key), e.ev.factores.map((f) => f.calificacion), e.ev.factores.map((f) => f.explicacion)],
    );
    const pasos = e.cand.pasos.filter((p) => p.texto.trim() !== "");
    if (pasos.length > 0)
      await c.query(
        `INSERT INTO ruta_opcion_maniobra (opcion_id, orden, giro_clave, texto, punto)
         SELECT $1::uuid, o, g, t, ST_SetSRID(ST_MakePoint(x, y), 4326)::geography FROM unnest($2::smallint[], $3::text[], $4::text[], $5::float8[], $6::float8[]) AS u(o, g, t, x, y)`,
        [id, pasos.map((_, i) => i + 1), pasos.map((p) => p.giro), pasos.map((p) => p.texto), pasos.map((p) => p.punto[0]), pasos.map((p) => p.punto[1])],
      );
  }
  return consulta;
}

async function opcionesDeConsulta(id: string): Promise<RouteOption[]> {
  return withFactors(await query<OptionRow>(`${OPTION_SQL} WHERE o.consulta_id = $1 ORDER BY t.orden`, [id]));
}

export type Calculo = { opciones: RouteOption[]; recomendada: RouteKind | null; aviso?: string };

/** Rutas de `origen` a `destino` con las preferencias de la persona. Si no hay proveedor o falla, usa las ya calculadas. */
export async function calcularRutas(uid: string, origen: PlaceInput, destino: PlaceInput, { sinCache = false } = {}): Promise<Calculo> {
  const prefs = await preferencias(uid);
  const [o, d] = await Promise.all([coordsDe(uid, origen), coordsDe(uid, destino)]);
  if (distanceKm(o, d) < 0.05) throw new ApiError(400, "El origen y el destino están demasiado cerca.");

  const respaldo = async (aviso: string): Promise<Calculo> => {
    const opciones = destino.id ? await opcionesHacia(uid, destino.id) : [];
    return { opciones, recomendada: recomendar(opciones, prefs), aviso };
  };
  if (!orsConfigurado()) return respaldo("El cálculo de rutas no está configurado; mostramos las rutas que ya teníamos.");

  // Misma consulta hace menos de 10 min (origen a ≤150 m, destino a ≤30 m): no gasta cuota del proveedor.
  const previa = sinCache ? null : await queryOne<{ id: string }>(
    `SELECT c.id FROM ruta_consulta c JOIN lugar lo ON lo.id = c.origen_lugar_id JOIN lugar ld ON ld.id = c.destino_lugar_id
     WHERE c.usuario_id = $1 AND c.calculada_en > now() - interval '10 minutes'
       AND ST_DWithin(lo.geog, ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography, 150) AND ST_DWithin(ld.geog, ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography, 30)
     ORDER BY c.calculada_en DESC LIMIT 1`,
    [uid, o[0], o[1], d[0], d[1]],
  );
  if (previa) {
    const opciones = await opcionesDeConsulta(previa.id);
    if (opciones.length > 0) return { opciones, recomendada: recomendar(opciones, prefs) };
  }

  const r = rateLimit(`rutas:${uid}`, 30, 10 * 60_000);
  if (!r.ok) throw new ApiError(429, "Calculaste muchas rutas seguidas. Espera unos minutos.", { "Retry-After": String(r.retryAfterSec) });

  let candidatos: Candidato[];
  try {
    const evitar = await zonasAEvitar(o, d);
    const [normales, seguras] = await Promise.all([
      rutasORS(o, d),
      evitar.length > 0 ? rutasORS(o, d, evitar).catch(() => [] as Candidato[]) : Promise.resolve([] as Candidato[]),
    ]);
    candidatos = sinDuplicados([...normales, ...seguras]);
  } catch (e) {
    console.error("[rutas] proveedor", e);
    return respaldo("No pudimos calcular rutas en este momento; intenta de nuevo en un rato.");
  }
  if (candidatos.length === 0) return respaldo("No encontramos un trayecto en bici hacia ese destino.");

  const evaluados = await Promise.all(candidatos.map(evaluar));
  const k = clasificar(evaluados, prefs);
  const elegidas = (["rapida", "equilibrada", "segura"] as RouteKind[]).map((tipo) => {
    const i = k[tipo];
    return { tipo, cand: candidatos[i], ev: evaluados[i], resumen: resumen(tipo, evaluados[i], k.excedeTope, prefs.minutosExtra) };
  });
  const [origenId, destinoId] = await Promise.all([lugarPara(uid, origen), lugarPara(uid, destino)]);
  if (origenId === destinoId) throw new ApiError(400, "El origen y el destino deben ser distintos.");
  const consulta = await tx((c) => guardar(c, uid, origenId, destinoId, elegidas));
  const opciones = await opcionesDeConsulta(consulta);
  return { opciones, recomendada: recomendar(opciones, prefs) };
}

/** Recalcula desde la posición actual hacia el destino de `opcionId`, con el mismo tipo de ruta. */
export async function recalcularRuta(uid: string, opcionId: string, pos: LngLat): Promise<{ route: RouteOption; steps: NavStep[]; alerts: NavAlert[] }> {
  const actual = await opcionPorId(uid, opcionId);
  if (!actual) throw notFound("No encontramos esa ruta.");
  const c = await queryOne<{ destino: string }>(`SELECT c.destino_lugar_id AS destino FROM ruta_opcion o JOIN ruta_consulta c ON c.id = o.consulta_id WHERE o.id = $1`, [opcionId]);
  const dest = c ? await lugarVisible(uid, c.destino) : null;
  if (!dest?.id) throw notFound("No encontramos el destino de esa ruta.");
  const calc = await calcularRutas(uid, { name: "Mi ubicación", detail: "", coordinates: pos }, { id: dest.id, name: dest.name, detail: dest.detail, coordinates: dest.coordinates }, { sinCache: true });
  const route = calc.opciones.find((x) => x.id === actual.id) ?? calc.opciones[0];
  if (!route?.optionId || route.optionId === opcionId) throw new ApiError(503, calc.aviso ?? "No pudimos recalcular la ruta.");
  return { route, ...(await navegacion(uid, route.optionId)) };
}
