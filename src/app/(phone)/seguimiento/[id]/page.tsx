"use client";

import { MapView } from "@/components/map/MapView";
import { PinMarker } from "@/components/map/PinMarker";
import { RouteLine } from "@/components/map/RouteLine";
import { Avatar } from "@/components/domain/Avatar";
import { Logo } from "@/components/layout/Logo";
import { useSocial } from "@/lib/social";
import { mockRoutes } from "@/mocks/routes";

/** Vista que recibe la persona con quien compartes tu ubicación. */
export default function SeguimientoPage() {
  const { me } = useSocial();
  const route = mockRoutes.find((r) => r.id === "segura")!;
  const here = route.coordinates[3];
  return (
    <div className="relative flex flex-1 flex-col bg-white">
      <div className="pt-safe flex shrink-0 items-center justify-between border-b border-line bg-white px-4 pb-3 pt-4"><Logo size="sm" /><span className="text-xs font-semibold text-muted">Vista de quien te sigue</span></div>
      <div className="relative flex-1">
        <MapView center={here} zoom={14.5}>
          <RouteLine id="seg" coordinates={route.coordinates} fit fitPadding={{ top: 60, bottom: 220, left: 40, right: 40 }} />
          <PinMarker position={here} recenter={false} />
        </MapView>
      </div>
      <div className="pb-safe absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-line bg-white p-4">
        <div className="flex items-center gap-3"><Avatar name={me.name} size={48} /><div><p className="text-lg font-bold">{me.name.split(" ")[0]} va en camino</p><p className="text-sm text-muted">Casa a la UDEM · llega en 9 min</p></div></div>
        <div className="mt-3 flex gap-6 border-t border-line pt-3 text-sm"><span><strong className="metric text-2xl">13</strong> km/h</span><span className="text-muted">Última actualización hace 5 s</span></div>
      </div>
    </div>
  );
}
