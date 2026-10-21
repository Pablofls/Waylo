"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Trash2 } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { ConfirmSheet } from "@/components/domain/ConfirmSheet";
import { SafetyScoreBadge } from "@/components/domain/SafetyScoreBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { useSocial } from "@/lib/social";
import type { SavedRoute } from "@/types";

export default function RutasGuardadasPage() {
  const { savedRoutes, removeSavedRoute } = useSocial();
  const [toDelete, setToDelete] = useState<SavedRoute | null>(null);
  return (
    <>
      <ScreenHeader title="Rutas guardadas" subtitle="Tus trayectos habituales" back="/configuracion" />
      <div className="flex-1 overflow-y-auto bg-white">
        {savedRoutes.length === 0 ? (
          <EmptyState icon={<Bookmark size={26} />} title="Aún no guardas rutas" text="Planea una ruta en el Mapa y toca Guardar ruta para repetirla con un toque." action={<Button href="/mapa">Ir al mapa</Button>} />
        ) : (
          <ul>
            {savedRoutes.map((r) => (
              <li key={r.id} className="flex min-h-[80px] items-center gap-2 border-b border-line pr-2">
                <Link href={`/mapa?destino=${r.destination.join(",")}&nombre=${encodeURIComponent(r.toName)}&ruta=${r.routeId}`} className="flex min-h-[80px] min-w-0 flex-1 items-center gap-3 py-3 pl-4">
                  <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold">{r.name}</span><span className="block text-sm text-muted">{r.fromName} a {r.toName} · {r.minutes} min</span></span>
                  <SafetyScoreBadge score={r.safetyScore} size="sm" />
                </Link>
                <button aria-label={`Quitar ${r.name}`} onClick={() => setToDelete(r)} className="flex h-11 w-11 items-center justify-center rounded-full text-muted"><Trash2 size={20} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ConfirmSheet open={toDelete !== null} danger title={`¿Quitar "${toDelete?.name ?? ""}"?`} text="Podrás guardarla de nuevo desde el Mapa." confirmLabel="Quitar" onConfirm={() => toDelete && removeSavedRoute(toDelete.id)} onClose={() => setToDelete(null)} />
    </>
  );
}
