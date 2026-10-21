"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquareWarning, Siren } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useSocial } from "@/lib/social";
import { smsHref } from "@/lib/emergency";
import type { LngLat } from "@/types";

interface Props {
  seconds: number;
  position: LngLat | null;
  rideId: string | null;
  onOk: () => void;
}

/** Aviso de posible caída: cuenta regresiva para responder; al acabarse se registra el evento y se ofrece avisar a los contactos. */
export function FallAlert({ seconds, position, rideId, onOk }: Props) {
  const { emergencyContacts, openEmergency, closeEmergency } = useSocial();
  const [left, setLeft] = useState(seconds);
  const [eventId, setEventId] = useState<string | null>(null);
  const opened = useRef(false);
  const expired = left <= 0;

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  useEffect(() => {
    if (!expired || opened.current) return;
    opened.current = true;
    openEmergency("caida_detectada", position, rideId).then(setEventId).catch(() => {});
  }, [expired, openEmergency, position, rideId]);

  const fine = () => {
    if (eventId) void closeEmergency(eventId, "falsa_alarma").catch(() => {});
    onOk();
  };

  return (
    <div role="alertdialog" aria-modal="true" aria-label="Posible caída" className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-risk-red px-6 text-center text-white">
      {expired ? (
        <>
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-risk-red"><MessageSquareWarning size={40} /></span>
          <h2 className="mt-6 text-3xl font-bold">Avisa a tus contactos</h2>
          <p className="mt-2 text-white/90">No respondiste a tiempo. Envía un mensaje con tu ubicación a quienes te cuidan y, si necesitas ayuda de inmediato, llama al 911.</p>
          <a href="tel:911" className="mt-8 flex min-h-[56px] w-full items-center justify-center rounded-xl bg-white text-lg font-bold text-risk-red">Llamar al 911</a>
          {emergencyContacts.length > 0 && (
            <a href={smsHref(emergencyContacts, position, "Creo que tuve una caída.")} onClick={() => eventId && void closeEmergency(eventId, "contactos_avisados").catch(() => {})} className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-xl border border-white font-semibold">
              Enviar mensaje a {emergencyContacts.map((c) => c.name.split(" ")[0]).join(" y ")}
            </a>
          )}
          <button onClick={fine} className="mt-3 min-h-[48px] w-full rounded-xl border border-white/60 font-semibold">Estoy bien</button>
        </>
      ) : (
        <>
          <Siren size={48} />
          <h2 className="mt-4 text-3xl font-bold">¿Te caíste?</h2>
          <p className="mt-2 text-white/90">Detectamos un golpe fuerte. Si no respondes, te ayudaremos a avisar a tus contactos de emergencia.</p>
          <p className="metric mt-6 text-9xl" aria-live="polite">{left}</p>
          <Button full size="lg" className="mt-8 !bg-white !text-risk-red" onClick={fine}>Estoy bien</Button>
          <button onClick={() => setLeft(0)} className="mt-3 min-h-[48px] w-full rounded-xl border border-white/60 font-semibold">Necesito ayuda ahora</button>
        </>
      )}
    </div>
  );
}
