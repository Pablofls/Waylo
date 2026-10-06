import type { StyleSpecification } from "maplibre-gl";

const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;

// Estilo de respaldo gratuito y sin llave (OpenFreeMap) para que el mapa siempre cargue en desarrollo.
const FALLBACK_STYLE = "https://tiles.openfreemap.org/styles/positron";

export const mapStyle: string | StyleSpecification = key
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`
  : FALLBACK_STYLE;
