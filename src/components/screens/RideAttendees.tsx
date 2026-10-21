"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { PersonRow } from "@/components/domain/PersonRow";
import { RelationButton } from "@/components/domain/RelationButton";
import { EmptyState } from "@/components/ui/States";
import { useAttendees, useSocial } from "@/lib/social";

export function RideAttendees({ id }: { id: string }) {
  const { ride: find, person, me } = useSocial();
  const ride = find(id);
  const attendees = useAttendees(ride?.attendeeIds ?? []);
  const [q, setQ] = useState("");

  if (!ride) return (<><ScreenHeader title="Asistentes" back="/comunidad" /><EmptyState title="No encontramos esta rodada" text="Puede que haya sido eliminada." /></>);

  // Amigos primero, luego el resto
  const rank = (a: { id: string; isMe: boolean }) => (a.isMe ? 0 : person(a.id)?.relation === "amigo" ? 1 : 2);
  const list = attendees.filter((a) => `${a.name} ${a.city}`.toLowerCase().includes(q.trim().toLowerCase())).sort((a, b) => rank(a) - rank(b));

  return (
    <>
      <ScreenHeader title="Quiénes van" subtitle={`${ride.title} · ${ride.attendeeCount} personas`} back={`/rodadas/${id}`} />
      <div className="p-4 pb-2">
        <div className="flex min-h-[52px] items-center gap-3 rounded-xl border border-line px-4 focus-within:border-brand-600">
          <Search size={20} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar asistente" placeholder="Buscar asistente" className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#8A929C]" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-white">
        {list.length === 0 ? (
          <EmptyState title="Sin resultados" text="Nadie coincide con esa búsqueda." />
        ) : (
          <ul>
            {list.map((a) => {
              const p = person(a.id);
              const label = a.id === ride.organizerId ? "Organiza" : a.isMe ? "Tú" : a.city;
              return a.isMe ? (
                <PersonRow key={a.id} id={a.id} name={`${a.name} (tú)`} detail={label} href="/perfil" />
              ) : (
                <PersonRow key={a.id} id={a.id} name={a.name} detail={a.id === ride.organizerId ? `Organiza · ${a.city}` : a.city} right={p ? <RelationButton person={p} /> : undefined} />
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
