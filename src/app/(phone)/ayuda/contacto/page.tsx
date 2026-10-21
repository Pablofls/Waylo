"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { useSocial } from "@/lib/social";
import { api, errorText } from "@/lib/api";

const topics: [string, string][] = [["cuenta", "Mi cuenta"], ["rutas", "Rutas y mapa"], ["reportes", "Reportes"], ["pagos", "Pagos"], ["otro", "Otro"]];

export default function ContactoPage() {
  const { me } = useSocial();
  const [topic, setTopic] = useState("rutas");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const send = async () => {
    if (message.trim().length < 15) return setError("Cuéntanos un poco más (al menos 15 caracteres).");
    setError("");
    setBusy(true);
    try {
      await api("/api/ayuda/soporte", "POST", { tema: topic, mensaje: message.trim() });
      setSent(true);
    } catch (e) {
      setError(errorText(e));
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <>
        <ScreenHeader title="Contacto" back="/ayuda" />
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white"><CheckCircle2 size={30} /></span>
          <h2 className="mt-4 text-2xl font-bold">Mensaje enviado</h2>
          <p className="mt-1 text-muted">Recibimos tu mensaje. Te responderemos a {me.email}.</p>
          <Button href="/ayuda" className="mt-6">Volver a Ayuda</Button>
        </div>
      </>
    );
  }

  return (
    <>
      <ScreenHeader title="Contacto y soporte" subtitle="Te respondemos por correo" back="/ayuda" />
      <div className="flex-1 space-y-5 overflow-y-auto bg-white px-4 pb-6 pt-3">
        <div>
          <p className="mb-1.5 text-sm font-semibold">Tema</p>
          <div className="flex flex-wrap gap-2">{topics.map(([k, l]) => <Chip key={k} selected={topic === k} onClick={() => setTopic(k)}>{l}</Chip>)}</div>
        </div>
        <div>
          <label htmlFor="msg" className="mb-1.5 block text-sm font-semibold">Mensaje</label>
          <textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} maxLength={600} placeholder="Describe qué pasó y en qué pantalla" className="w-full rounded-xl border border-line px-4 py-3 text-base placeholder:text-[#8A929C] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20" />
          <p className="mt-1 text-right text-xs text-muted">{message.length}/600</p>
        </div>
        <p className="text-sm text-muted">Responderemos a <strong className="text-ink">{me.email}</strong>.</p>
        {error && <p role="alert" className="text-sm font-semibold text-risk-red">{error}</p>}
      </div>
      <div className="pb-safe border-t border-line bg-white px-4 pt-3"><Button full size="lg" disabled={busy} onClick={() => void send()}>{busy ? "Enviando…" : "Enviar mensaje"}</Button><div className="h-3" /></div>
    </>
  );
}
