"use client";

import { use } from "react";
import { MapView } from "@/components/map/MapView";
import { PinMarker } from "@/components/map/PinMarker";
import { Avatar } from "@/components/domain/Avatar";
import { Logo } from "@/components/layout/Logo";
import { MONTERREY_CENTER } from "@/lib/map/geo";
import { useLivePositions } from "@/lib/realtime/hooks";
import { useSocial } from "@/lib/social";
import { formatDateTime } from "@/lib/format";
import { ScreenHeader } from "@/components/layout/ScreenHeader";

/** Vista de quien te comparte su ubicación: se alimenta del WebSocket (`role=map`) con tu lista `allow`. */
export default function SeguimientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { person } = useSocial();
  const { positions, status } = useLivePositions();
  const who = person(id);
  const pos = positions[id];
  const here: [number, number] | null = pos ? [pos.longitude, pos.latitude] : null;
  const name = who?.name ?? "Tu amigo";

  return (
    <div className="relative flex flex-1 flex-col bg-white">
      <ScreenHeader title={name.split(" ")[0]} subtitle="Ubicación en vivo" back="/compartir-ubicacion" action={<Logo size="sm" />} />
      <div className="relative flex-1">
        <MapView center={here ?? MONTERREY_CENTER} zoom={here ? 15 : 11}>{here && <PinMarker position={here} recenter />}</MapView>
      </div>
      <div className="pb-safe absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line bg-white p-4">
        <div className="flex items-center gap-3">
          <Avatar name={name} size={48} />
          <div>
            <p className="text-lg font-bold">{pos ? `${name.split(" ")[0]} va en camino` : `Esperando la ubicación de ${name.split(" ")[0]}`}</p>
            <p className="text-sm text-muted">{pos ? `Última actualización: ${formatDateTime(pos.ts)}` : status === "open" ? "Aparecerá cuando empiece a grabar una rodada." : "Conectando…"}</p>
          </div>
        </div>
        {pos && <div className="mt-3 border-t border-line pt-3 text-sm"><span><strong className="metric text-2xl">{Math.round(pos.speed)}</strong> km/h</span></div>}
      </div>
    </div>
  );
}
