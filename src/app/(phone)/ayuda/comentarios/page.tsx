"use client";

import { useState } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { api, errorText } from "@/lib/api";

const kinds: [string, string][] = [["idea", "Idea"], ["no_funciona", "Algo no funciona"], ["me_gusto", "Me gustó"], ["otro", "Otro"]];

export default function ComentariosPage() {
  const [rating, setRating] = useState(0);
  const [kind, setKind] = useState("idea");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <>
        <ScreenHeader title="Comentarios" back="/ayuda" />
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white"><CheckCircle2 size={30} /></span>
          <h2 className="mt-4 text-2xl font-bold">Gracias por tu opinión</h2>
          <p className="mt-1 text-muted">Leemos todos los comentarios para mejorar Waylo.</p>
          <Button href="/ayuda" className="mt-6">Volver a Ayuda</Button>
        </div>
      </>
    );
  }
  return (
    <>
      <ScreenHeader title="Enviar comentarios" subtitle="Ayúdanos a mejorar Waylo" back="/ayuda" />
      <div className="flex-1 space-y-5 overflow-y-auto bg-white px-4 pb-6 pt-3">
        <div>
          <p className="mb-1.5 text-sm font-semibold">¿Cómo ha sido tu experiencia?</p>
          <div role="radiogroup" aria-label="Calificación" className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} de 5`} onClick={() => setRating(n)} className="flex h-12 w-12 items-center justify-center">
                <Star size={32} className={n <= rating ? "text-risk-yellow" : "text-[#C9CED3]"} fill={n <= rating ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
        </div>
        <div><p className="mb-1.5 text-sm font-semibold">Tipo</p><div className="flex flex-wrap gap-2">{kinds.map(([k, l]) => <Chip key={k} selected={kind === k} onClick={() => setKind(k)}>{l}</Chip>)}</div></div>
        <div>
          <label htmlFor="fb" className="mb-1.5 block text-sm font-semibold">Cuéntanos más</label>
          <textarea id="fb" value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={500} className="w-full rounded-xl border border-line px-4 py-3 text-base focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20" placeholder="¿Qué te gustaría que Waylo hiciera?" />
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-risk-red">{error}</p>}
      </div>
      <div className="pb-safe border-t border-line bg-white px-4 pt-3"><Button
          full
          size="lg"
          disabled={busy}
          onClick={async () => {
            if (rating === 0) return setError("Elige una calificación.");
            if (message.trim().length < 10) return setError("Cuéntanos un poco más (al menos 10 caracteres).");
            setError("");
            setBusy(true);
            try {
              await api("/api/ayuda/comentarios", "POST", { tipo: kind, calificacion: rating, mensaje: message.trim() });
              setSent(true);
            } catch (e) {
              setError(errorText(e));
              setBusy(false);
            }
          }}
        >
          {busy ? "Enviando…" : "Enviar comentarios"}
        </Button><div className="h-3" /></div>
    </>
  );
}
