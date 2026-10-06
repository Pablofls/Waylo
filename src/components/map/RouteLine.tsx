"use client";

import { useEffect } from "react";
import type { FeatureCollection, Point } from "geojson";
import type { GeoJSONSource } from "maplibre-gl";
import { useMap } from "./MapView";
import { line, bounds } from "@/lib/map/geo";
import { riskGradient, ROUTE_COLOR } from "@/lib/map/risk";
import type { LngLat } from "@/types";

interface Props {
  id: string;
  coordinates: LngLat[];
  /** Color por defecto de la ruta (cuando no se muestra el riesgo). */
  color?: string;
  width?: number;
  opacity?: number;
  /** Si se pasa, la ruta se colorea según el riesgo a lo largo del trayecto. */
  risk?: FeatureCollection<Point>;
  fit?: boolean;
  fitPadding?: { top: number; bottom: number; left: number; right: number };
}

export function RouteLine({ id, coordinates, color = ROUTE_COLOR, width = 6, opacity = 1, risk, fit, fitPadding }: Props) {
  const ctx = useMap();

  useEffect(() => {
    if (!ctx) return;
    const { map } = ctx;
    const src = map.getSource(id) as GeoJSONSource | undefined;
    if (src) {
      src.setData(line(coordinates));
    } else {
      map.addSource(id, { type: "geojson", data: line(coordinates), lineMetrics: true });
      map.addLayer({ id: `${id}-casing`, type: "line", source: id, layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#FFFFFF", "line-width": width + 4, "line-opacity": opacity } });
      map.addLayer({ id: `${id}-line`, type: "line", source: id, layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": color, "line-width": width, "line-opacity": opacity } });
    }
    const gradient = risk ? riskGradient(coordinates, risk) : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.setPaintProperty(`${id}-line`, "line-gradient", (gradient ?? undefined) as any);
    map.setPaintProperty(`${id}-line`, "line-color", color);
  }, [ctx, coordinates, risk, color, id, width, opacity]);

  useEffect(() => {
    if (!ctx) return;
    const { map } = ctx;
    return () => {
      [`${id}-line`, `${id}-casing`].forEach((l) => map.getLayer(l) && map.removeLayer(l));
      if (map.getSource(id)) map.removeSource(id);
    };
  }, [ctx, id]);

  useEffect(() => {
    if (!ctx || !fit || coordinates.length < 2) return;
    ctx.map.fitBounds(bounds(coordinates), { padding: fitPadding ?? 48, duration: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, fit]);

  return null;
}
