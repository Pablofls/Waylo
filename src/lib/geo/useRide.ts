"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LngLat } from "@/types";
import { bearing, distanceKm } from "@/lib/map/geo";
import type { GpsSample } from "@/lib/realtime/client";

export const MAX_ACCURACY_M = 30;

export interface RideState {
  position: LngLat | null;
  track: LngLat[];
  km: number;
  seconds: number;
  speedKmh: number;
  error: "denied" | "unavailable" | "failed" | null;
}

interface Options {
  active: boolean;
  paused: boolean;
  /** Se llama con cada lectura aceptada (precisión ≤ 30 m). */
  onSample?: (s: GpsSample) => void;
}

/** ¿Hay GPS y permiso? Se usa antes de iniciar una rodada. */
export function checkGps(): Promise<"ok" | "denied" | "unavailable"> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve("unavailable");
  return new Promise((resolve) =>
    navigator.geolocation.getCurrentPosition(
      () => resolve("ok"),
      (e) => resolve(e.code === e.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    ),
  );
}

/** Graba la rodada con el GPS real del dispositivo (`watchPosition` de alta precisión); descarta lecturas con precisión > 30 m. */
export function useRide({ active, paused, onSample }: Options): RideState {
  const [state, setState] = useState<RideState>({ position: null, track: [], km: 0, seconds: 0, speedKmh: 0, error: null });
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const sampleRef = useRef(onSample);
  sampleRef.current = onSample;
  const last = useRef<{ p: LngLat; t: number } | null>(null);

  const push = useCallback((p: LngLat, speedKmh: number) => {
    setState((s) => {
      if (pausedRef.current) return { ...s, position: p, speedKmh: 0 };
      const prev = s.track[s.track.length - 1];
      return { ...s, position: p, speedKmh, track: [...s.track, p], km: prev ? s.km + distanceKm(prev, p) : s.km };
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

  // Geolocalización real
  useEffect(() => {
    if (!active) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, error: "unavailable" }));
      return;
    }
    last.current = null;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        if (pos.coords.accuracy > MAX_ACCURACY_M) return;
        const p: LngLat = [pos.coords.longitude, pos.coords.latitude];
        const prev = last.current;
        const dt = prev ? (pos.timestamp - prev.t) / 1000 : 0;
        // Algunos navegadores no entregan velocidad ni rumbo: se calculan con el punto anterior.
        const speedKmh = Math.min(80, Math.max(0, pos.coords.speed != null ? pos.coords.speed * 3.6 : prev && dt > 0 ? (distanceKm(prev.p, p) / dt) * 3600 : 0));
        const heading = pos.coords.heading != null && !Number.isNaN(pos.coords.heading) ? pos.coords.heading : prev ? bearing(prev.p, p) : 0;
        last.current = { p, t: pos.timestamp };
        push(p, speedKmh);
        if (!pausedRef.current)
          sampleRef.current?.({ latitude: p[1], longitude: p[0], speed: Math.round(speedKmh * 10) / 10, heading: Math.round(((heading % 360) + 360) % 360) % 360, accuracy: Math.round(pos.coords.accuracy * 10) / 10, ts: new Date(pos.timestamp).toISOString() });
      },
      (err) => setState((s) => ({ ...s, error: err.code === err.PERMISSION_DENIED ? "denied" : "failed" })),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [active, push]);

  return state;
}
