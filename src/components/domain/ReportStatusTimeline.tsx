import { Check } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { statusLabels } from "@/lib/report-categories";
import type { Report, ReportStatus } from "@/types";

const order: ReportStatus[] = ["enviado", "en_revision", "atendido"];

export function ReportStatusTimeline({ report }: { report: Report }) {
  const reached = report.timeline.length;
  return (
    <ol className="relative">
      {order.map((status, i) => {
        const entry = report.timeline.find((t) => t.status === status);
        const done = i < reached;
        return (
          <li key={status} className="relative flex gap-4 pb-6 last:pb-0">
            {i < order.length - 1 && <span className={`absolute left-[15px] top-8 h-[calc(100%-1rem)] w-0.5 ${i < reached - 1 ? "bg-brand-600" : "bg-line"}`} />}
            <span className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${done ? "bg-brand-600 text-white" : "border-2 border-line bg-white text-transparent"}`}>
              <Check size={16} strokeWidth={3} />
            </span>
            <div className="pt-0.5">
              <p className={`text-[15px] font-semibold ${done ? "text-ink" : "text-muted"}`}>{statusLabels[status]}</p>
              {entry ? (
                <>
                  <p className="text-xs text-muted">{formatDateTime(entry.at)}</p>
                  <p className="mt-1 text-sm">{entry.text}</p>
                </>
              ) : (
                <p className="text-xs text-muted">Pendiente</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
