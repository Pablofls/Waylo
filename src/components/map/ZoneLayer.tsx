"use client";

import { useEffect, useRef } from "react";
import type { FeatureCollection, Polygon } from "geojson";
import type { GeoJSONSource, MapLayerMouseEvent } from "maplibre-gl";
import { useMap } from "./MapView";
import { riskColor } from "@/lib/map/risk";
import type { ZoneShapeProps } from "@/types";

interface Props {
  data: FeatureCollection<Polygon, ZoneShapeProps>;
  visible: boolean;
  onSelect?: (z: ZoneShapeProps) => void;
}

// Safety Score de la zona → misma escala de riesgo que el mapa de calor (100 = verde, 0 = rojo).
const COLOR = ["interpolate", ["linear"], ["get", "score"], 0, riskColor(1), 40, riskColor(0.6), 70, riskColor(0.3), 100, riskColor(0)];

/** Zonas de seguridad como polígonos coloreados por su Safety Score. */
export function ZoneLayer({ data, visible, onSelect }: Props) {
  const ctx = useMap();
  const select = useRef(onSelect);
  select.current = onSelect;

  useEffect(() => {
    if (!ctx) return;
    const { map } = ctx;
    if (!map.getSource("zones")) {
      map.addSource("zones", { type: "geojson", data });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.addLayer({ id: "zones-fill", type: "fill", source: "zones", paint: { "fill-color": COLOR as any, "fill-opacity": 0.22 } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.addLayer({ id: "zones-line", type: "line", source: "zones", paint: { "line-color": COLOR as any, "line-width": 2, "line-dasharray": [2, 1.5] } });
    } else {
      (map.getSource("zones") as GeoJSONSource).setData(data);
    }
    const click = (e: MapLayerMouseEvent) => {
      const p = e.features?.[0]?.properties as ZoneShapeProps | undefined;
      if (p) select.current?.({ id: String(p.id), name: String(p.name), score: Number(p.score) });
    };
    map.on("click", "zones-fill", click);
    return () => {
      // El mapa puede haberse destruido ya al desmontar la pantalla.
      try {
        map.off("click", "zones-fill", click);
        ["zones-line", "zones-fill"].forEach((l) => map.getLayer(l) && map.removeLayer(l));
        if (map.getSource("zones")) map.removeSource("zones");
      } catch {}
    };
  }, [ctx, data]);

  useEffect(() => {
    if (!ctx) return;
    for (const l of ["zones-fill", "zones-line"]) if (ctx.map.getLayer(l)) ctx.map.setLayoutProperty(l, "visibility", visible ? "visible" : "none");
  }, [ctx, visible, data]);

  return null;
}
