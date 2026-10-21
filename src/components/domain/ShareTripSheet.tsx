"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Avatar } from "./Avatar";
import { Button } from "@/components/ui/Button";
import { useSocial } from "@/lib/social";

interface Props {
  open: boolean;
  sharingWith: string[];
  etaLabel: string;
  onStart: (ids: string[]) => void;
  onStop: () => void;
  onClose: () => void;
}

/** Compartir el viaje en vivo con amigos (solo ellos pueden ver tu posición en tiempo real). */
export function ShareTripSheet({ open, sharingWith, etaLabel, onStart, onStop, onClose }: Props) {
  const { friends } = useSocial();
  const [picked, setPicked] = useState<string[]>([]);
  if (!open) return null;

  const options = friends.map((f) => ({ id: f.id, name: f.name, detail: "Amigo en Waylo" }));
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const sharing = sharingWith.length > 0;

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button aria-label="Cerrar" className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Compartir viaje" className="pb-safe relative max-h-[85%] overflow-y-auto rounded-t-3xl bg-white p-5 text-ink">
        <div className="flex items-start justify-between">
          <div><h2 className="text-xl font-bold">Compartir mi viaje</h2><p className="text-sm text-muted">Verán tu ubicación en vivo y la hora estimada de llegada ({etaLabel}).</p></div>
          <button aria-label="Cerrar" onClick={onClose} className="-mr-2 -mt-1 flex h-11 w-11 items-center justify-center"><X size={22} /></button>
        </div>
        {sharing ? (
          <>
            <p className="mt-4 rounded-xl bg-brand-100 p-3 text-sm font-semibold text-brand-700">Compartiendo con {sharingWith.join(", ")}.</p>
            <Button full variant="danger" className="mt-3" onClick={() => { onStop(); onClose(); }}>Dejar de compartir</Button>
          </>
        ) : (
          <>
            {options.length === 0 && <p className="mt-3 text-sm text-muted">Agrega amigos para compartir tu viaje con ellos.</p>}
            <ul className="mt-3 divide-y divide-line rounded-card border border-line">
              {options.map((o) => {
                const on = picked.includes(o.id);
                return (
                  <li key={o.id}>
                    <button role="checkbox" aria-checked={on} onClick={() => toggle(o.id)} className="flex min-h-[60px] w-full items-center gap-3 px-3 text-left">
                      <Avatar name={o.name} size={40} />
                      <span className="min-w-0 flex-1"><span className="block truncate text-[15px] font-semibold">{o.name}</span><span className="block truncate text-xs text-muted">{o.detail}</span></span>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-md border-2 ${on ? "border-brand-600 bg-brand-600 text-white" : "border-[#C9CED3]"}`}>{on && <Check size={16} strokeWidth={3} />}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <Button full size="lg" className="mt-4" disabled={picked.length === 0} onClick={() => { onStart(picked); onClose(); }}>
              Compartir con {picked.length || ""} {picked.length === 1 ? "persona" : "personas"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
