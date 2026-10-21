"use client";

import { Phone, Send, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useSocial } from "@/lib/social";

interface Props {
  open: boolean;
  alerted: boolean;
  onAlert: () => void;
  onSimulateFall: () => void;
  onClose: () => void;
}

export function EmergencySheet({ open, alerted, onAlert, onSimulateFall, onClose }: Props) {
  const { emergencyContacts } = useSocial();
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button aria-label="Cerrar" className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Emergencia" className="pb-safe relative rounded-t-3xl bg-white p-5 text-ink">
        <div className="flex items-start justify-between">
          <div><h2 className="text-xl font-bold">Emergencia</h2><p className="text-sm text-muted">Pide ayuda o avisa a tus contactos.</p></div>
          <button aria-label="Cerrar" onClick={onClose} className="-mr-2 -mt-1 flex h-11 w-11 items-center justify-center"><X size={22} /></button>
        </div>
        <a href="tel:911" className="mt-4 flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-risk-red text-lg font-semibold text-white"><Phone size={22} />Llamar al 911</a>
        {alerted ? (
          <p role="status" className="mt-3 rounded-xl bg-brand-100 p-3 text-sm font-semibold text-brand-700">Avisamos a {emergencyContacts.map((c) => c.name.split(" ")[0]).join(" y ") || "tus contactos"} con tu ubicación actual.</p>
        ) : (
          <Button full variant="outline" size="lg" className="mt-3" icon={<Send size={20} />} disabled={emergencyContacts.length === 0} onClick={onAlert}>
            Avisar a mis contactos ({emergencyContacts.length})
          </Button>
        )}
        {emergencyContacts.length === 0 && <p className="mt-2 text-sm text-muted">Aún no tienes contactos. <Link href="/configuracion/emergencia" className="font-semibold text-brand-600 underline">Agrégalos</Link>.</p>}
        <button onClick={onSimulateFall} className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 text-sm font-semibold text-muted"><TriangleAlert size={16} />Probar detección de caída (demo)</button>
      </div>
    </div>
  );
}
