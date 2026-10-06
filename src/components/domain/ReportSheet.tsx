"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { reportCategories, categoryById } from "@/lib/report-categories";
import { Button } from "@/components/ui/Button";
import type { ReportCategory } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (c: ReportCategory) => void;
  /** Texto de ubicación mostrado en la hoja. */
  locationLabel?: string;
}

export function ReportSheet({ open, onClose, onSaved, locationLabel = "Tu ubicación actual" }: Props) {
  const [saved, setSaved] = useState<ReportCategory | null>(null);
  const [later, setLater] = useState(false);

  useEffect(() => {
    if (!open) {
      setSaved(null);
      setLater(false);
    }
  }, [open]);

  if (!open) return null;
  const SavedIcon = saved ? categoryById(saved).icon : null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button aria-label="Cerrar" className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Reporte rápido" className="pb-safe relative rounded-t-3xl bg-white px-4 pt-3">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        {!saved ? (
          <>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">Reporte rápido</h2>
                <p className="text-sm text-muted">Un toque guarda el reporte en {locationLabel.toLowerCase()}.</p>
              </div>
              <button aria-label="Cerrar" onClick={onClose} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full active:bg-canvas">
                <X size={22} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pb-4">
              {reportCategories.map(({ id, label, icon: Icon }, i) => (
                <button
                  key={id}
                  onClick={() => {
                    setSaved(id);
                    onSaved?.(id);
                  }}
                  className={`flex min-h-[88px] flex-col items-start justify-between rounded-xl border border-line bg-white p-3 text-left active:bg-brand-100 ${i === reportCategories.length - 1 ? "col-span-2 min-h-[64px] flex-row items-center justify-start gap-3" : ""}`}
                >
                  <Icon size={26} className="text-brand-600" />
                  <span className="text-[15px] font-semibold leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="pb-4">
            <div className="flex items-center gap-3 py-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white">
                <Check size={26} strokeWidth={3} />
              </span>
              <div>
                <h2 className="text-xl font-bold">Reporte guardado</h2>
                <p className="flex items-center gap-1.5 text-sm text-muted">
                  {SavedIcon && <SavedIcon size={14} />}
                  {categoryById(saved).label} · {locationLabel}
                </p>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={later}
              onClick={() => setLater(!later)}
              className="mt-3 flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-line px-4 text-left"
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-md border-2 ${later ? "border-brand-600 bg-brand-600 text-white" : "border-[#C9CED3]"}`}>
                {later && <Check size={16} strokeWidth={3} />}
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-semibold">Completar al llegar</span>
                <span className="block text-xs text-muted">Te recordamos agregar foto y detalles al terminar la rodada.</span>
              </span>
            </button>
            <Button full size="lg" className="mt-3" onClick={onClose}>
              Listo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
