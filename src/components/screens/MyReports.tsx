"use client";

import { useState } from "react";
import { Inbox } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/States";
import { ReportListItem } from "@/components/domain/ReportListItem";
import { statusLabels } from "@/lib/report-categories";
import type { Report, ReportStatus } from "@/types";

export function MyReports({ reports }: { reports: Report[] }) {
  const [filter, setFilter] = useState<ReportStatus | "todos">("todos");
  const shown = filter === "todos" ? reports : reports.filter((r) => r.status === filter);
  const options: { v: ReportStatus | "todos"; l: string }[] = [
    { v: "todos", l: "Todos" },
    { v: "enviado", l: "Enviado" },
    { v: "en_revision", l: "En revisión" },
    { v: "atendido", l: statusLabels.atendido },
  ];
  return (
    <>
      <div className="flex gap-2 overflow-x-auto border-b border-line bg-white px-4 pb-3">
        {options.map((o) => (
          <Chip key={o.v} selected={filter === o.v} onClick={() => setFilter(o.v)} className="shrink-0">{o.l}</Chip>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto bg-white">
        {shown.length === 0 ? (
          <EmptyState icon={<Inbox size={26} />} title="Sin reportes en este estado" text="Cuando un reporte cambie de estado lo verás aquí." />
        ) : (
          shown.map((r) => <ReportListItem key={r.id} report={r} href={`/reportes/${r.id}`} />)
        )}
      </div>
    </>
  );
}
