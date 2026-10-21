"use client";

import { Crown, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** Hoja "Disponible en Premium" para funciones bloqueadas. */
export function PremiumGate({ open, feature, onClose }: { open: boolean; feature: string; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button aria-label="Cerrar" className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Disponible en Premium" className="pb-safe relative rounded-t-3xl bg-white p-5">
        <button aria-label="Cerrar" onClick={onClose} className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center"><X size={22} /></button>
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600"><Crown size={24} /></span>
        <h2 className="mt-3 text-xl font-bold">Disponible en Premium</h2>
        <p className="mt-1 text-sm text-muted"><strong className="text-ink">{feature}</strong> es parte de Waylo Premium, desde $79 MXN al mes.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>Ahora no</Button>
          <Button href="/premium">Ver Premium</Button>
        </div>
      </div>
    </div>
  );
}
