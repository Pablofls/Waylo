"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, Plus, Search, Users } from "lucide-react";
import { Avatar } from "@/components/domain/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { useSocial } from "@/lib/social";

/** Lista de clubes dentro de Comunidad: los míos y los que puedo descubrir. */
export function ClubsList() {
  const { clubs, me } = useSocial();
  const [q, setQ] = useState("");
  const match = (c: { name: string; zone: string }) => `${c.name} ${c.zone}`.toLowerCase().includes(q.trim().toLowerCase());
  const mine = clubs.filter((c) => c.memberIds.includes(me.id) && match(c));
  const others = clubs.filter((c) => !c.memberIds.includes(me.id) && match(c));

  const Row = ({ id }: { id: string }) => {
    const c = clubs.find((x) => x.id === id)!;
    return (
      <li>
        <Link href={`/clubes/${c.id}`} className="flex min-h-[72px] items-center gap-3 border-b border-line px-4 py-3">
          <Avatar name={c.name} size={48} />
          <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5 truncate text-[15px] font-semibold">{c.name}{c.privacy === "privado" && <Lock size={14} className="shrink-0 text-muted" />}</span><span className="block truncate text-sm text-muted">{c.zone} · {c.memberCount} miembros</span></span>
        </Link>
      </li>
    );
  };

  return (
    <>
      <div className="space-y-3 p-4">
        <div className="flex min-h-[52px] items-center gap-3 rounded-xl border border-line px-4 focus-within:border-brand-600"><Search size={20} className="text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar clubes" placeholder="Buscar clubes" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#8A929C]" /></div>
        <Button href="/clubes/nuevo" full variant="secondary" icon={<Plus size={18} />}>Crear un club</Button>
      </div>
      {mine.length > 0 && (<><h2 className="px-4 pb-1 text-sm font-bold uppercase tracking-wide text-muted">Mis clubes</h2><ul>{mine.map((c) => <Row key={c.id} id={c.id} />)}</ul></>)}
      <h2 className="px-4 pb-1 pt-4 text-sm font-bold uppercase tracking-wide text-muted">Descubrir</h2>
      {others.length === 0 ? <EmptyState icon={<Users size={26} />} title="Sin clubes que mostrar" text="Prueba con otra búsqueda o crea el tuyo." /> : <ul>{others.map((c) => <Row key={c.id} id={c.id} />)}</ul>}
    </>
  );
}
