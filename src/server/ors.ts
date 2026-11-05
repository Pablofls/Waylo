import type { LngLat, TurnType } from "@/types";

/**
 * Cliente de OpenRouteService (perfil de bicicleta). Solo se usa desde el servidor: la llave (`ORS_API_KEY`)
 * nunca llega al navegador. Ver https://openrouteservice.org/dev/#/api-docs/v2/directions.
 */
const ORS_URL = "https://api.openrouteservice.org/v2/directions/cycling-regular/geojson";

export type Paso = { giro: TurnType; texto: string; punto: LngLat };

export type Candidato = {
  coords: LngLat[];
  segundos: number;
  metros: number;
  pasos: Paso[];
  /** Calle con más distancia recorrida (para "vía ..."). */
  via: string;
  /** Fracción del trayecto en ciclovía o camino sin autos (0-1). */
  fraccionCiclovia: number;
  /** Fracción del trayecto en carreteras o vías rápidas (0-1). */
  fraccionViaRapida: number;
};

type OrsStep = { distance: number; type: number; instruction: string; name: string; way_points: [number, number] };
type OrsExtra = { values: [number, number, number][] };
type OrsFeature = {
  geometry: { coordinates: number[][] };
  properties: { summary: { distance?: number; duration?: number }; segments: { steps: OrsStep[] }[]; extras?: { waytypes?: OrsExtra; waycategory?: OrsExtra } };
};

export const orsConfigurado = () => Boolean(process.env.ORS_API_KEY);

/**
 * Tipos de maniobra de ORS → `cat_giro`. 0/2/4/12 izquierda, 1/3/5/13 derecha, 9 vuelta en U (a la izquierda),
 * 10 llegada; el resto (recto, glorieta, salida) se muestra como "recto".
 */
export function giroDesdeORS(type: number): TurnType {
  if ([0, 2, 4, 9, 12].includes(type)) return "izquierda";
  if ([1, 3, 5, 13].includes(type)) return "derecha";
  if (type === 10) return "llegada";
  return "recto";
}

/** Cuadro de `m` metros de lado alrededor de un punto, como anillo GeoJSON (para `avoid_polygons`). */
export function cuadroEvitar([lng, lat]: LngLat, m: number): LngLat[] {
  const dLat = m / 2 / 111_320;
  const dLng = m / 2 / (111_320 * Math.cos((lat * Math.PI) / 180));
  return [[lng - dLng, lat - dLat], [lng + dLng, lat - dLat], [lng + dLng, lat + dLat], [lng - dLng, lat + dLat], [lng - dLng, lat - dLat]];
}

/** Fracción del trayecto (por número de vértices de cada tramo, ponderado por distancia) cuyo valor cumple `pred`. */
export function fraccionExtra(extra: OrsExtra | undefined, coords: LngLat[], pred: (v: number) => boolean): number {
  if (!extra || coords.length < 2) return 0;
  const seg = (i: number) => Math.hypot(coords[i + 1][0] - coords[i][0], coords[i + 1][1] - coords[i][1]);
  let total = 0;
  let si = 0;
  for (const [from, to, v] of extra.values) {
    let d = 0;
    for (let i = from; i < to && i < coords.length - 1; i++) d += seg(i);
    total += d;
    if (pred(v)) si += d;
  }
  return total > 0 ? si / total : 0;
}

function aCandidato(f: OrsFeature): Candidato {
  const coords = f.geometry.coordinates.map((c) => [c[0], c[1]] as LngLat);
  const steps = f.properties.segments.flatMap((s) => s.steps);
  const porCalle = new Map<string, number>();
  for (const s of steps) if (s.name && s.name !== "-") porCalle.set(s.name, (porCalle.get(s.name) ?? 0) + s.distance);
  const via = [...porCalle.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "calles locales";
  const ex = f.properties.extras;
  return {
    coords,
    segundos: f.properties.summary.duration ?? 0,
    metros: f.properties.summary.distance ?? 0,
    pasos: steps.map((s) => ({ giro: giroDesdeORS(s.type), texto: s.instruction, punto: coords[Math.min(s.way_points[0], coords.length - 1)] })),
    via,
    // waytype: 4 camino, 6 ciclovía; 1 carretera estatal. waycategory: bit 1 = autopista.
    fraccionCiclovia: fraccionExtra(ex?.waytypes, coords, (v) => v === 4 || v === 6),
    fraccionViaRapida: Math.max(fraccionExtra(ex?.waytypes, coords, (v) => v === 1), fraccionExtra(ex?.waycategory, coords, (v) => (v & 1) === 1)),
  };
}

/**
 * Pide a ORS hasta 3 alternativas de `origen` a `destino`. `evitar` son anillos que la ruta no debe cruzar.
 * Lanza si ORS no responde o devuelve error; quien llama decide el respaldo.
 */
export async function rutasORS(origen: LngLat, destino: LngLat, evitar: LngLat[][] = []): Promise<Candidato[]> {
  const key = process.env.ORS_API_KEY;
  if (!key) throw new Error("Falta ORS_API_KEY.");
  const res = await fetch(ORS_URL, {
    method: "POST",
    headers: { Authorization: key, "Content-Type": "application/json", Accept: "application/geo+json" },
    body: JSON.stringify({
      coordinates: [origen, destino],
      language: "es",
      instructions: true,
      extra_info: ["waytype", "waycategory"],
      alternative_routes: { target_count: 3, share_factor: 0.6, weight_factor: 1.6 },
      ...(evitar.length > 0 ? { options: { avoid_polygons: { type: "MultiPolygon", coordinates: evitar.map((ring) => [ring]) } } } : {}),
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`ORS ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { features?: OrsFeature[] };
  return (data.features ?? []).map(aCandidato).filter((c) => c.coords.length >= 2);
}
