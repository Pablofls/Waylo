import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { categoryById, statusLabels } from "@/lib/report-categories";
import { formatDateTime } from "@/lib/format";
import type { Report } from "@/types";

const statusTone = { enviado: "neutral", en_revision: "yellow", atendido: "brand" } as const;

export function ReportListItem({ report, href }: { report: Report; href?: string }) {
  const cat = categoryById(report.category);
  const Icon = cat.icon;
  const content = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-canvas text-ink">
        <Icon size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold">{cat.label}</p>
        <p className="truncate text-sm text-muted">{report.street}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge tone={statusTone[report.status]}>{statusLabels[report.status]}</Badge>
          {report.pendingDetails && <Badge tone="orange">Falta completar</Badge>}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 self-start">
        <span className="text-xs text-muted">{formatDateTime(report.createdAt)}</span>
        {href && <ChevronRight size={18} className="text-muted" />}
      </div>
    </>
  );
  const cls = "flex min-h-[72px] items-center gap-3 border-b border-line bg-white px-4 py-3";
  return href ? <Link href={href} className={cls}>{content}</Link> : <div className={cls}>{content}</div>;
}
