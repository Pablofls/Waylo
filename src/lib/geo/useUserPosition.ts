"use client";

import { useEffect, useState } from "react";
import type { LngLat } from "@/types";

const AMM: LngLat = [-100.3161, 25.6866];

/** Posición actual del usuario; si está fuera del AMM o sin permiso usa `fallback` (útil en desarrollo). */
export function useUserPosition(fallback: LngLat): LngLat {
  const [pos, setPos] = useState<LngLat>(fallback);
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const here: LngLat = [p.coords.longitude, p.coords.latitude];
        const near = Math.abs(here[0] - AMM[0]) < 0.4 && Math.abs(here[1] - AMM[1]) < 0.4;
        if (near) setPos(here);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);
  return pos;
}
