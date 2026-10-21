"use client";

import { MapView } from "@/components/map/MapView";
import { PinMarker } from "@/components/map/PinMarker";
import type { LngLat } from "@/types";

export function MiniMap({ position, height = 180 }: { position: LngLat; height?: number }) {
  return (
    <div className="relative overflow-hidden rounded-card border border-line" style={{ height }}>
      <MapView center={position} zoom={15}>
        <PinMarker position={position} />
      </MapView>
    </div>
  );
}
