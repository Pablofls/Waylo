"use client";

import { useState } from "react";
import { MessageSquareWarning, Phone, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useSocial } from "@/lib/social";
import { smsHref } from "@/lib/emergency";
import type { LngLat } from "@/types";

interface Props {
  open: boolean;
  position: LngLat | null;
  rideId: string | null;
  onSimulateFall?: () => void;
  onClose: () => void;
}

export function EmergencySheet({ open, position, rideId, onSimulateFall, onClose }: Props) {
  const { emergencyContacts, openEmergency, closeEmergency } = useSocial();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;

  // Se registra el evento y se abre la app de mensajes con la ubicación lista; la persona envía el mensaje.
  const alertContacts = async () => {
    setError("");
    try {
      const id = await openEmergency("sos_manual", position, rideId);
      window.location.href = smsHref(emergencyContacts, position, "Emergencia.");
      setSent(true);
      await closeEmergency(id, "contactos_avisados");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos registrar la emergencia. Llama al 911.");
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button aria-label="Cerrar" className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Emergencia" className="pb-safe relative rounded-t-3xl bg-white p-5 text-ink">
        <div className="flex items-start justify-between">
          <div><h2 className="text-xl font-bold">Emergencia</h2><p className="text-sm text-muted">Pide ayuda o avisa a tus contactos.</p></div>
          <button aria-label="Cerrar" onClick={onClose} className="-mr-2 -mt-1 flex h-11 w-11 items-center justify-center"><X size={22} /></button>
        </div>
        <a href="tel:911" className="mt-4 flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-risk-red text-lg font-semibold text-white"><Phone size={22} />Llamar al 911</a>
        <Button full variant="outline" size="lg" className="mt-3" icon={<MessageSquareWarning size={20} />} disabled={emergencyContacts.length === 0} onClick={() => void alertContacts()}>
          Enviar mensaje a mis contactos ({emergencyContacts.length})
        </Button>
        {sent && <p role="status" className="mt-3 rounded-xl bg-brand-100 p-3 text-sm font-semibold text-brand-700">Abrimos tu app de mensajes con tu ubicación. Envíalo para avisar a {emergencyContacts.map((c) => c.name.split(" ")[0]).join(" y ")}.</p>}
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-risk-red">{error}</p>}
        {emergencyContacts.length === 0 && <p className="mt-2 text-sm text-muted">Aún no tienes contactos. <Link href="/configuracion/emergencia" className="font-semibold text-brand-600 underline">Agrégalos</Link>.</p>}
        {onSimulateFall && <button onClick={onSimulateFall} className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 text-sm font-semibold text-muted"><TriangleAlert size={16} />Probar detección de caída (solo desarrollo)</button>}
      </div>
    </div>
  );
}
