"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarPlus, ChevronRight, MapPin, Route as RouteIcon, Users as UsersIcon } from "lucide-react";
import { ReportListItem } from "@/components/domain/ReportListItem";
import { AttendeeStack } from "@/components/domain/AttendeeStack";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/States";
import { useSocial } from "@/lib/social";
import { formatWeekday, formatTime } from "@/lib/format";
import type { GroupRide, Report } from "@/types";

const levelTone = { Principiante: "brand", Intermedio: "yellow", Avanzado: "orange" } as const;
type Filter = "proximas" | "voy" | "mias" | "pasadas";

export function Community({ reports }: { reports: Report[] }) {
  const { rides, me, join, people } = useSocial();
  const [tab, setTab] = useState<"reportes" | "rodadas">("reportes");
  const [filter, setFilter] = useState<Filter>("proximas");

  const visible = (r: GroupRide) => r.privacy === "publica" || r.organizerId === me.id || r.attendeeIds.includes(me.id) || people.find((p) => p.id === r.organizerId)?.relation === "amigo";
  const byFilter: Record<Filter, (r: GroupRide) => boolean> = {
    proximas: (r) => r.status === "programada" && visible(r),
    voy: (r) => r.status === "programada" && r.attendeeIds.includes(me.id),
    mias: (r) => r.organizerId === me.id && r.status !== "finalizada",
    pasadas: (r) => (r.status === "finalizada" || r.status === "cancelada") && (r.attendeeIds.includes(me.id) || r.organizerId === me.id),
  };
  const list = rides.filter(byFilter[filter]).sort((a, b) => (filter === "pasadas" ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)));
  const filters: { v: Filter; l: string }[] = [
    { v: "proximas", l: "Próximas" },
    { v: "voy", l: "Voy" },
    { v: "mias", l: "Organizadas por mí" },
    { v: "pasadas", l: "Pasadas" },
  ];
  const tabs = [{ v: "reportes", l: "Reportes cerca de ti" }, { v: "rodadas", l: "Rodadas grupales" }] as const;
  const nameOf = (id: string) => (id === me.id ? me.name : people.find((p) => p.id === id)?.name ?? "");

  return (
    <>
      <header className="pt-safe shrink-0 bg-white px-4">
        <div className="flex items-center justify-between pt-4">
          <h1 className="text-2xl font-bold">Comunidad</h1>
          <Link href="/amigos" aria-label="Amigos" className="flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold"><UsersIcon size={18} />Amigos</Link>
        </div>
        <div role="tablist" className="mt-2 flex">
          {tabs.map((t) => (
            <button key={t.v} role="tab" aria-selected={tab === t.v} onClick={() => setTab(t.v)} className={`min-h-[48px] flex-1 border-b-2 text-sm font-semibold ${tab === t.v ? "border-brand-600 text-brand-600" : "border-line text-muted"}`}>{t.l}</button>
          ))}
        </div>
      </header>

      <div className="relative flex-1 overflow-y-auto bg-white">
        {tab === "reportes" ? (
          reports.map((r) => <ReportListItem key={r.id} report={{ ...r }} href={`/reportes-comunidad/${r.id}`} />)
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto px-4 py-3">
              {filters.map((f) => <Chip key={f.v} selected={filter === f.v} onClick={() => setFilter(f.v)} className="shrink-0">{f.l}</Chip>)}
            </div>
            <div className="px-4 pb-3">
              <Button href="/rodadas/nueva" full variant="secondary" icon={<CalendarPlus size={18} />}>Crear una rodada</Button>
            </div>
            {list.length === 0 ? (
              <EmptyState icon={<CalendarPlus size={26} />} title="No hay rodadas aquí" text={filter === "mias" ? "Crea una rodada e invita a tus amigos." : "Cuando haya rodadas en este filtro aparecerán aquí."} action={filter === "mias" ? <Button href="/rodadas/nueva">Crear rodada</Button> : undefined} />
            ) : (
              <ul>
                {list.map((g) => {
                  const going = g.attendeeIds.includes(me.id);
                  const isMine = g.organizerId === me.id;
                  return (
                    <li key={g.id} className="border-b border-line">
                      <Link href={`/rodadas/${g.id}`} className="block p-4 pb-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="block text-xs font-semibold text-brand-600 first-letter:uppercase">{formatWeekday(g.date)} · {formatTime(g.date)} h</p>
                            <h3 className="mt-0.5 text-lg font-bold leading-tight">{g.title}</h3>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <Badge tone={levelTone[g.level]}>{g.level}</Badge>
                            {g.status === "cancelada" && <Badge tone="red">Cancelada</Badge>}
                            {g.privacy === "amigos" && <Badge>Solo amigos</Badge>}
                          </div>
                        </div>
                        <p className="mt-2 flex items-center gap-2 text-sm"><MapPin size={16} className="shrink-0 text-muted" />{g.meetingPoint}</p>
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted"><RouteIcon size={16} />{g.km} km · {isMine ? "Organizas tú" : nameOf(g.organizerId)}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <AttendeeStack names={g.attendeeIds.map(nameOf).filter(Boolean)} total={g.attendeeIds.length} size={28} />
                          <ChevronRight size={18} className="text-muted" />
                        </div>
                      </Link>
                      {g.status === "programada" && !isMine && (
                        <div className="px-4 pb-4">
                          {going ? <p className="text-sm font-semibold text-brand-700">Vas a asistir</p> : <Button full size="md" onClick={() => join(g.id)} disabled={g.capacity !== undefined && g.attendeeIds.length >= g.capacity}>Unirme</Button>}
                        </div>
                      )}
                      {g.status !== "programada" || isMine ? <div className="h-2" /> : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </>
  );
}
