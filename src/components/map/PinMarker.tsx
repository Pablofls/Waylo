"use client";

import { useEffect } from "react";
import { useMap } from "./MapView";
import type { LngLat } from "@/types";

/** Marcador de punto de salida; opcionalmente centra el mapa en él. */
export function PinMarker({ position, recenter = true, zoom = 15 }: { position: LngLat; recenter?: boolean; zoom?: number }) {
  const ctx = useMap();
  const [lng, lat] = position;

  useEffect(() => {
    if (!ctx) return;
    const { map, lib } = ctx;
    const el = document.createElement("div");
    el.className = "flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-brand-600 text-white";
    el.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
    const marker = new lib.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
    if (recenter) map.easeTo({ center: [lng, lat], zoom, duration: 500 });
    return () => {
      marker.remove();
    };
  }, [ctx, lng, lat, recenter, zoom]);

  return null;
}
