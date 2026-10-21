"use client";

import { useEffect, useState } from "react";
import { Check, Siren } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  contactNames: string[];
  onOk: () => void;
}

/** Aviso de posible caída: 15 s para responder antes de alertar a los contactos. */
export function FallAlert({ contactNames, onOk }: Props) {
  const [left, setLeft] = useState(15);
  const sent = left <= 0;

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  return (
    <div role="alertdialog" aria-modal="true" aria-label="Posible caída" className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-risk-red px-6 text-center text-white">
      {sent ? (
        <>
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-risk-red"><Check size={44} strokeWidth={3} /></span>
          <h2 className="mt-6 text-3xl font-bold">Avisamos a tus contactos</h2>
          <p className="mt-2 text-white/90">{contactNames.length ? `${contactNames.join(" y ")} recibieron` : "Se envió"} tu ubicación actual. Si necesitas ayuda de inmediato, llama al 911.</p>
          <a href="tel:911" className="mt-8 flex min-h-[56px] w-full items-center justify-center rounded-xl bg-white text-lg font-bold text-risk-red">Llamar al 911</a>
          <button onClick={onOk} className="mt-3 min-h-[48px] w-full rounded-xl border border-white/60 font-semibold">Estoy bien</button>
        </>
      ) : (
        <>
          <Siren size={48} />
          <h2 className="mt-4 text-3xl font-bold">¿Te caíste?</h2>
          <p className="mt-2 text-white/90">Detectamos un golpe fuerte. Si no respondes, avisaremos a tus contactos de emergencia.</p>
          <p className="metric mt-6 text-9xl" aria-live="polite">{left}</p>
          <Button full size="lg" className="mt-8 !bg-white !text-risk-red" onClick={onOk}>Estoy bien</Button>
          <button onClick={() => setLeft(0)} className="mt-3 min-h-[48px] w-full rounded-xl border border-white/60 font-semibold">Necesito ayuda ahora</button>
        </>
      )}
    </div>
  );
}
