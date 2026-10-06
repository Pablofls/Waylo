"use client";

import { useEffect } from "react";
import type { Marker } from "maplibre-gl";
import { useMap } from "./MapView";
import type { LngLat } from "@/types";

interface Props {
  position: LngLat | null;
  follow?: boolean;
  zoom?: number;
}

export function UserMarker({ position, follow, zoom = 16 }: Props) {
  const ctx = useMap();

  useEffect(() => {
    if (!ctx || !position) return;
    const { map, lib } = ctx;
    const el = document.createElement("div");
    el.className = "relative h-5 w-5";
    el.innerHTML =
      '<span class="absolute inset-0 animate-ping rounded-full bg-brand-600/40"></span><span class="absolute inset-0 rounded-full border-[3px] border-white bg-brand-600"></span>';
    const marker: Marker = new lib.Marker({ element: el }).setLngLat(position).addTo(map);
    if (follow) map.easeTo({ center: position, zoom: Math.max(map.getZoom(), zoom), duration: 600 });
    return () => {
      marker.remove();
    };
  }, [ctx, position, follow, zoom]);

  return null;
}
