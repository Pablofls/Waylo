"use client";

import { useEffect } from "react";
import type { FeatureCollection, Point } from "geojson";
import type { GeoJSONSource } from "maplibre-gl";
import { useMap } from "./MapView";

interface Props {
  data: FeatureCollection<Point>;
  visible: boolean;
}

/** Mapa de calor de RIESGO (verde, amarillo, naranja, rojo). */
export function HeatmapLayer({ data, visible }: Props) {
  const ctx = useMap();

  useEffect(() => {
    if (!ctx) return;
    const { map } = ctx;
    if (!map.getSource("risk")) {
      map.addSource("risk", { type: "geojson", data });
      map.addLayer({
        id: "risk-heat",
        type: "heatmap",
        source: "risk",
        paint: {
          "heatmap-weight": ["get", "weight"],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 10, 0.8, 15, 1.6],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 10, 18, 13, 34, 16, 60],
          "heatmap-opacity": 0.85,
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(19,137,111,0)",
            0.12, "rgba(19,137,111,0.55)",
            0.35, "rgba(242,201,76,0.75)",
            0.65, "rgba(232,131,58,0.88)",
            1, "rgba(214,69,69,0.95)",
          ],
        },
      });
    } else {
      (map.getSource("risk") as GeoJSONSource).setData(data);
    }
    return () => {
      // El mapa puede haberse destruido ya al desmontar la pantalla.
      try {
        if (map.getLayer("risk-heat")) map.removeLayer("risk-heat");
        if (map.getSource("risk")) map.removeSource("risk");
      } catch {}
    };
  }, [ctx, data]);

  useEffect(() => {
    if (!ctx || !ctx.map.getLayer("risk-heat")) return;
    ctx.map.setLayoutProperty("risk-heat", "visibility", visible ? "visible" : "none");
  }, [ctx, visible, data]);

  return null;
}
