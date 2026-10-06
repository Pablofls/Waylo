"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LngLat } from "@/types";
import { densify, distanceKm } from "@/lib/map/geo";

export const MAX_ACCURACY_M = 30;

export interface RideState {
  position: LngLat | null;
  track: LngLat[];
  km: number;
  seconds: number;
  speedKmh: number;
  error: string | null;
}

interface Options {
  active: boolean;
  paused: boolean;
  simulate: boolean;
  simulationRoute: LngLat[];
}

/**
 * Graba la rodada con geolocalización real (descartando lecturas con precisión > 30 m)
 * o reproduciendo una ruta mock en modo simulación.
 */
export function useRide({ active, paused, simulate, simulationRoute }: Options): RideState {
  const [state, setState] = useState<RideState>({ position: null, track: [], km: 0, seconds: 0, speedKmh: 0, error: null });
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const route = useRef<LngLat[]>([]);
  const idx = useRef(0);

  const push = useCallback((p: LngLat, speedKmh: number) => {
    setState((s) => {
      if (pausedRef.current) return { ...s, position: p, speedKmh: 0 };
      const last = s.track[s.track.length - 1];
      return {
        ...s,
        position: p,
        speedKmh,
        track: [...s.track, p],
        km: last ? s.km + distanceKm(last, p) : s.km,
      };
    });
  }, []);

  // Cronómetro
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      if (!pausedRef.current) setState((s) => ({ ...s, seconds: s.seconds + 1 }));
    }, 1000);
    return () => clearInterval(t);
  }, [active]);

  // Modo simulado
  useEffect(() => {
    if (!active || !simulate) return;
    route.current = densify(simulationRoute, 25);
    idx.current = 0;
    setState((s) => ({ ...s, error: null }));
    const t = setInterval(() => {
      if (pausedRef.current) return;
      const p = route.current[Math.min(idx.current, route.current.length - 1)];
      idx.current += 1;
      push(p, 14 + Math.sin(idx.current / 9) * 3);
    }, 700);
    return () => clearInterval(t);
  }, [active, simulate, simulationRoute, push]);

  // Geolocalización real
  useEffect(() => {
    if (!active || simulate) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, error: "Tu navegador no admite geolocalización. Activa el modo simulación." }));
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        if (pos.coords.accuracy > MAX_ACCURACY_M) return;
        push([pos.coords.longitude, pos.coords.latitude], Math.max(0, (pos.coords.speed ?? 0) * 3.6));
      },
      (err) => setState((s) => ({ ...s, error: err.code === err.PERMISSION_DENIED ? "Permiso de ubicación denegado." : "No pudimos obtener tu ubicación." })),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [active, simulate, push]);

  return state;
}
