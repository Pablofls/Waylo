"use client";

import { useState } from "react";
import Link from "next/link";
import { Users as UsersIcon, Calendar, MapPin, Users, Route as RouteIcon } from "lucide-react";
import { ReportListItem } from "@/components/domain/ReportListItem";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatWeekday, formatTime } from "@/lib/format";
import type { GroupRide, Report } from "@/types";

const levelTone = { Principiante: "brand", Intermedio: "yellow", Avanzado: "orange" } as const;

export function Community({ reports, rides }: { reports: Report[]; rides: GroupRide[] }) {
  const [tab, setTab] = useState<"reportes" | "rodadas">("reportes");
  const [joined, setJoined] = useState<string[]>([]);
  const tabs = [
    { v: "reportes", l: "Reportes cerca de ti" },
    { v: "rodadas", l: "Rodadas grupales" },
  ] as const;

  return (
    <>
      <header className="pt-safe shrink-0 bg-white px-4">
        <div className="flex items-center justify-between pt-4">
          <h1 className="text-2xl font-bold">Comunidad</h1>
          <Link href="/amigos" aria-label="Amigos" className="flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold"><UsersIcon size={18} />Amigos</Link>
        </div>
        <div role="tablist" className="mt-2 flex">
          {tabs.map((t) => (
            <button
              key={t.v}
              role="tab"
              aria-selected={tab === t.v}
              onClick={() => setTab(t.v)}
              className={`min-h-[48px] flex-1 border-b-2 text-sm font-semibold ${tab === t.v ? "border-brand-600 text-brand-600" : "border-line text-muted"}`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto bg-white">
        {tab === "reportes" ? (
          reports.map((r) => <ReportListItem key={r.id} report={r} />)
        ) : (
          <ul>
            {rides.map((g) => {
              const isIn = joined.includes(g.id);
              return (
                <li key={g.id} className="border-b border-line p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold capitalize text-brand-600">{formatWeekday(g.date)} · {formatTime(g.date)} h</p>
                      <h3 className="mt-0.5 text-lg font-bold leading-tight">{g.title}</h3>
                    </div>
                    <Badge tone={levelTone[g.level]}>{g.level}</Badge>
                  </div>
                  <p className="mt-2 flex items-center gap-2 text-sm"><MapPin size={16} className="shrink-0 text-muted" />{g.meetingPoint}</p>
                  <div className="mt-1.5 flex items-center gap-4 text-sm text-muted">
                    <span className="flex items-center gap-1.5"><RouteIcon size={16} />{g.km} km</span>
                    <span className="flex items-center gap-1.5"><Users size={16} />{g.attendees + (isIn ? 1 : 0)} asistentes</span>
                    <span className="flex items-center gap-1.5"><Calendar size={16} />{g.organizer}</span>
                  </div>
                  <Button className="mt-3" full variant={isIn ? "secondary" : "primary"} onClick={() => setJoined(isIn ? joined.filter((x) => x !== g.id) : [...joined, g.id])}>
                    {isIn ? "Vas a asistir" : "Unirme a la rodada"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
