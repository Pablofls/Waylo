"use client";

import { useEffect, useState } from "react";
import { Link2, Search, UserPlus } from "lucide-react";
import { PersonRow } from "@/components/domain/PersonRow";
import { RelationButton } from "@/components/domain/RelationButton";
import { ShareSheet } from "@/components/domain/ShareSheet";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { useSocial } from "@/lib/social";
import { api } from "@/lib/api";
import type { Person } from "@/types";

type Tab = "amigos" | "solicitudes" | "agregar";

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex min-h-[52px] items-center gap-3 rounded-xl border border-line bg-white px-4 focus-within:border-brand-600">
      <Search size={20} className="shrink-0 text-muted" />
      <input value={value} onChange={(e) => onChange(e.target.value)} aria-label={placeholder} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#8A929C]" />
    </div>
  );
}

const match = (p: Person, q: string) => `${p.name} ${p.city}`.toLowerCase().includes(q.trim().toLowerCase());
const detail = (p: Person) => `${p.city} · ${p.mutual} en común`;

export function Friends() {
  const { friends, received, sent, suggestions, person } = useSocial();
  const [found, setFound] = useState<Person[]>([]);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const [tab, setTab] = useState<Tab>("amigos");
  const [qFriends, setQFriends] = useState("");
  const [qAll, setQAll] = useState("");
  const [share, setShare] = useState(false);

  const tabs: { v: Tab; l: string }[] = [
    { v: "amigos", l: `Amigos (${friends.length})` },
    { v: "solicitudes", l: `Solicitudes${received.length ? ` (${received.length})` : ""}` },
    { v: "agregar", l: "Buscar" },
  ];
  const searching = qAll.trim().length >= 2;
  // La búsqueda es en el servidor (nombre o correo exacto): no se descarga un directorio de personas.
  useEffect(() => {
    const q = qAll.trim();
    if (q.length < 2) return setFound([]);
    let alive = true;
    const t = setTimeout(() => {
      api<{ personas: Person[] }>(`/api/personas?q=${encodeURIComponent(q)}`)
        .then((r) => alive && setFound(r.personas))
        .catch(() => alive && setFound([]));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [qAll]);
  const results = found.map((p) => person(p.id) ?? p);
  const myFriends = friends.filter((p) => match(p, qFriends));

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
        {tab === "amigos" && (
          <>
            {friends.length > 0 && <div className="p-4 pb-2"><SearchBox value={qFriends} onChange={setQFriends} placeholder="Buscar entre tus amigos" /></div>}
            {friends.length === 0 ? (
              <EmptyState icon={<UserPlus size={26} />} title="Aún no tienes amigos" text="Busca a quienes ruedan contigo para ver su actividad." action={<Button onClick={() => setTab("agregar")}>Buscar personas</Button>} />
            ) : myFriends.length === 0 ? (
              <EmptyState title="Sin resultados" text="Ningún amigo coincide con tu búsqueda." />
            ) : (
              <ul>{myFriends.map((p) => <PersonRow key={p.id} id={p.id} name={p.name} detail={`${p.city} · ${p.stats.rides} rodadas`} right={<RelationButton person={p} />} />)}</ul>
            )}
          </>
        )}

        {tab === "solicitudes" && (
          <>
            {received.length === 0 && sent.length === 0 && <EmptyState title="Sin solicitudes" text="Cuando alguien quiera ser tu amigo aparecerá aquí." />}
            {received.length > 0 && (
              <>
                <h2 className="px-4 pb-1 pt-4 text-sm font-bold uppercase tracking-wide text-muted">Recibidas</h2>
                <ul>{received.map((p) => <PersonRow key={p.id} id={p.id} name={p.name} detail={detail(p)} right={<RelationButton person={p} />} />)}</ul>
              </>
            )}
            {sent.length > 0 && (
              <>
                <h2 className="px-4 pb-1 pt-4 text-sm font-bold uppercase tracking-wide text-muted">Enviadas</h2>
                <ul>{sent.map((p) => <PersonRow key={p.id} id={p.id} name={p.name} detail={detail(p)} right={<RelationButton person={p} />} />)}</ul>
              </>
            )}
          </>
        )}

        {tab === "agregar" && (
          <>
            <div className="space-y-3 p-4">
              <SearchBox value={qAll} onChange={setQAll} placeholder="Nombre o correo exacto" />
              <Button variant="secondary" full icon={<Link2 size={18} />} onClick={() => setShare(true)}>Invitar con un enlace</Button>
            </div>
            <h2 className="px-4 pb-1 text-sm font-bold uppercase tracking-wide text-muted">{searching ? `Resultados (${results.length})` : "Personas que quizá conoces"}</h2>
            {(searching ? results : suggestions).length === 0 ? (
              <EmptyState title="Sin resultados" text="Prueba con otro nombre o invita a tu amigo con un enlace." action={<Button variant="outline" onClick={() => setShare(true)}>Invitar con un enlace</Button>} />
            ) : (
              <ul>{(searching ? results : suggestions).map((p) => <PersonRow key={p.id} id={p.id} name={p.name} detail={detail(p)} right={<RelationButton person={p} />} />)}</ul>
            )}
          </>
        )}
      </div>

      <ShareSheet open={share} onClose={() => setShare(false)} title="Invita a tus amigos" text="Quien abra el enlace podrá crear su cuenta y agregarte." url={`${origin}/registro`} />
    </>
  );
}
