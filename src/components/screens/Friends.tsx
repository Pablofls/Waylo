"use client";

import { useState } from "react";
import { Check, Link2, Search, X } from "lucide-react";
import { Avatar } from "@/components/domain/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import type { Friend } from "@/types";

type Tab = "amigos" | "solicitudes" | "agregar";

interface Props {
  friends: Friend[];
  requests: Friend[];
  suggestions: Friend[];
}

function Row({ f, children }: { f: Friend; children: React.ReactNode }) {
  return (
    <li className="flex min-h-[72px] items-center gap-3 border-b border-line px-4 py-3">
      <Avatar name={f.name} size={48} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{f.name}</p>
        <p className="truncate text-sm text-muted">{f.city} · {f.mutual} en común</p>
      </div>
      {children}
    </li>
  );
}

export function Friends({ friends, requests, suggestions }: Props) {
  const [tab, setTab] = useState<Tab>("amigos");
  const [mine, setMine] = useState(friends);
  const [pending, setPending] = useState(requests);
  const [sent, setSent] = useState<string[]>([]);
  const [q, setQ] = useState("");

  const accept = (f: Friend) => {
    setMine([...mine, f]);
    setPending(pending.filter((p) => p.id !== f.id));
  };
  const results = suggestions.filter((s) => `${s.name} ${s.city}`.toLowerCase().includes(q.trim().toLowerCase()));
  const tabs: { v: Tab; l: string }[] = [
    { v: "amigos", l: `Amigos (${mine.length})` },
    { v: "solicitudes", l: `Solicitudes${pending.length ? ` (${pending.length})` : ""}` },
    { v: "agregar", l: "Agregar" },
  ];

  return (
    <>
      <div role="tablist" className="flex shrink-0 border-b border-line bg-white">
        {tabs.map((t) => (
          <button key={t.v} role="tab" aria-selected={tab === t.v} onClick={() => setTab(t.v)} className={`min-h-[48px] flex-1 border-b-2 px-1 text-sm font-semibold ${tab === t.v ? "border-brand-600 text-brand-600" : "border-transparent text-muted"}`}>
            {t.l}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto bg-white">
        {tab === "amigos" &&
          (mine.length === 0 ? (
            <EmptyState title="Aún no tienes amigos" text="Agrega a quienes ruedan contigo para ver su actividad." />
          ) : (
            <ul>{mine.map((f) => <Row key={f.id} f={f}><span className="text-xs font-semibold text-muted">Amigos</span></Row>)}</ul>
          ))}

        {tab === "solicitudes" &&
          (pending.length === 0 ? (
            <EmptyState title="Sin solicitudes" text="Cuando alguien quiera ser tu amigo aparecerá aquí." />
          ) : (
            <ul>
              {pending.map((f) => (
                <Row key={f.id} f={f}>
                  <button aria-label={`Rechazar a ${f.name}`} onClick={() => setPending(pending.filter((p) => p.id !== f.id))} className="flex h-11 w-11 items-center justify-center rounded-full border border-line"><X size={20} /></button>
                  <button aria-label={`Aceptar a ${f.name}`} onClick={() => accept(f)} className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white"><Check size={20} strokeWidth={3} /></button>
                </Row>
              ))}
            </ul>
          ))}

        {tab === "agregar" && (
          <div>
            <div className="space-y-3 p-4">
              <div className="flex min-h-[52px] items-center gap-3 rounded-xl border border-line px-4 focus-within:border-brand-600">
                <Search size={20} className="text-muted" />
                <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar por nombre o correo" placeholder="Buscar por nombre o correo" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#8A929C]" />
              </div>
              <Button variant="secondary" full icon={<Link2 size={18} />}>Invitar con un enlace</Button>
            </div>
            <p className="px-4 pb-1 text-sm font-bold uppercase tracking-wide text-muted">{q ? "Resultados" : "Personas que quizá conoces"}</p>
            {results.length === 0 ? (
              <EmptyState title="Sin resultados" text="Prueba con otro nombre o invita a tu amigo con un enlace." />
            ) : (
              <ul>
                {results.map((f) => {
                  const done = sent.includes(f.id);
                  return (
                    <Row key={f.id} f={f}>
                      <Button variant={done ? "secondary" : "primary"} disabled={done} onClick={() => setSent([...sent, f.id])} className="!min-h-[44px] !px-4 text-sm">
                        {done ? "Enviada" : "Agregar"}
                      </Button>
                    </Row>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}
