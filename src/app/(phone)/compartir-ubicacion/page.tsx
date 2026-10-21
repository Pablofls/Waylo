"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, MapPin, Radio } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Avatar } from "@/components/domain/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { useSocial } from "@/lib/social";
import { api } from "@/lib/api";

const durations: { v: number | null; l: string }[] = [{ v: 1, l: "1 hora" }, { v: 4, l: "4 horas" }, { v: null, l: "Hasta que la detenga" }];

export default function CompartirUbicacionPage() {
  const { friends, liveShare, startLiveShare, stopLiveShare } = useSocial();
  const [sharers, setSharers] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    api<{ comparten: { id: string; name: string }[] }>("/api/comparticion").then((r) => setSharers(r.comparten)).catch(() => {});
  }, []);
  const [picked, setPicked] = useState<string[]>([]);
  const [hours, setHours] = useState<number | null>(1);
  const options = friends.map((f) => ({ id: f.id, name: f.name, detail: "Amigo en Waylo" }));
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <>
      <ScreenHeader title="Ubicación en vivo" subtitle="Que te sigan sin importar si ruedas" back="/configuracion" />
      <div className="flex-1 overflow-y-auto bg-white px-4 pb-6 pt-3">
        {liveShare ? (
          <div>
            <div className="rounded-card border border-brand-600 bg-brand-100 p-4">
              <p className="flex items-center gap-2 font-bold text-brand-700"><MapPin size={20} />Compartiendo tu ubicación</p>
              <p className="mt-1 text-sm text-brand-900">Con {liveShare.with.join(", ")} · {liveShare.hours ? `durante ${liveShare.hours} ${liveShare.hours === 1 ? "hora" : "horas"}` : "hasta que la detengas"}.</p>
            </div>
            <Button full variant="danger" className="mt-3" onClick={stopLiveShare}>Dejar de compartir</Button>
          </div>
        ) : (
          <>
            <p className="text-[15px] text-muted">Tus amigos elegidos verán dónde estás en tiempo real mientras grabas una rodada. Puedes detenerlo cuando quieras.</p>
            <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-muted">Duración</h2>
            <div className="mt-2 flex flex-wrap gap-2">{durations.map((d) => <Chip key={d.l} selected={hours === d.v} onClick={() => setHours(d.v)}>{d.l}</Chip>)}</div>
            <h2 className="mt-5 text-sm font-bold uppercase tracking-wide text-muted">Con quién</h2>
            {options.length === 0 ? <p className="mt-2 text-sm text-muted">Agrega amigos para compartir tu ubicación con ellos.</p> : (
              <ul className="mt-2 divide-y divide-line rounded-card border border-line">
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
            )}
            <Button full size="lg" className="mt-5" disabled={picked.length === 0} onClick={() => startLiveShare(picked, hours)}>Empezar a compartir</Button>
          </>
        )}
        {sharers.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Comparten contigo</h2>
            <ul className="mt-2 divide-y divide-line rounded-card border border-line">
              {sharers.map((p) => (
                <li key={p.id}>
                  <Link href={`/seguimiento/${p.id}`} className="flex min-h-[60px] items-center gap-3 px-3">
                    <Avatar name={p.name} size={40} />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{p.name}</span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-brand-600"><Radio size={16} />Ver en vivo</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
