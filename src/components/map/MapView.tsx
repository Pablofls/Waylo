"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Map as MLMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { mapStyle } from "@/lib/map/style";
import type { LngLat } from "@/types";

type MapLib = typeof import("maplibre-gl");
interface MapCtx {
  map: MLMap;
  lib: MapLib;
}

const Ctx = createContext<MapCtx | null>(null);
export const useMap = () => useContext(Ctx);

interface Props {
  center: LngLat;
  zoom?: number;
  className?: string;
  /** Se llama una vez que el estilo cargó; útil para controlar la cámara. */
  onReady?: (map: MLMap) => void;
  children?: React.ReactNode;
}

/** Encapsula la instancia de MapLibre. Las capas hijas leen el mapa con `useMap()`. */
export function MapView({ center, zoom = 13, className = "absolute inset-0", onReady, children }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const [ctx, setCtx] = useState<MapCtx | null>(null);
  const initial = useRef({ center, zoom, onReady });

  useEffect(() => {
    let map: MLMap | undefined;
    let cancelled = false;
    (async () => {
      const lib = await import("maplibre-gl");
      if (cancelled || !el.current) return;
      map = new lib.Map({
        container: el.current,
        style: mapStyle,
        center: initial.current.center,
        zoom: initial.current.zoom,
        attributionControl: { compact: true },
      });
      map.on("load", () => {
        if (cancelled || !map) return;
        setCtx({ map, lib });
        initial.current.onReady?.(map);
      });
    })();
    return () => {
      cancelled = true;
      setCtx(null);
      map?.remove();
    };
  }, []);

  return (
    <div className={className}>
      <div ref={el} className="h-full w-full" role="img" aria-label="Mapa de Monterrey" />
      {ctx && <Ctx.Provider value={ctx}>{children}</Ctx.Provider>}
    </div>
  );
}
