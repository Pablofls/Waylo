"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Hexagon, Layers, SlidersHorizontal, Siren, X } from "lucide-react";
import { MapFilterSheet, type ReportAge } from "@/components/domain/MapFilterSheet";
import { SafetyScoreBadge } from "@/components/domain/SafetyScoreBadge";
import { categoryById } from "@/lib/report-categories";
import { formatDateTime } from "@/lib/format";
import type { Report, ReportCategory, ZoneShapeProps } from "@/types";

/**
 * Capas de riesgo compartidas por Mapa y Comenzar: mapa de calor, zonas, reportes con filtros
 * y la tarjeta de la zona o el reporte que se toca.
 */
export function useRiskLayers(reports: Report[]) {
  const [heat, setHeat] = useState(true);
  const [zones, setZones] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [cats, setCats] = useState<ReportCategory[]>([]);
  const [age, setAge] = useState<ReportAge>("todo");
  const [refTime] = useState(() => Date.now());
  const [zone, setZone] = useState<ZoneShapeProps | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const maxAge = { todo: Infinity, "24h": 864e5, "7d": 7 * 864e5, "30d": 30 * 864e5 }[age];
  const shownReports = useMemo(() => reports.filter((r) => (cats.length === 0 || cats.includes(r.category)) && refTime - new Date(r.createdAt).getTime() <= maxAge), [reports, cats, maxAge, refTime]);
  return {
    heat,
    setHeat,
    zones,
    setZones,
    shownReports,
    filtersOn: cats.length > 0 || age !== "todo",
    openFilters: () => setFilterOpen(true),
    filterSheet: <MapFilterSheet open={filterOpen} categories={cats} age={age} onChange={(c, a) => { setCats(c); setAge(a); }} onClose={() => setFilterOpen(false)} />,
    selectedZone: zone,
    selectedReport: report,
    selectZone: (z: ZoneShapeProps) => { setReport(null); setZone(z); },
    selectReport: (r: Report) => { setZone(null); setReport(r); },
    clearSelection: () => { setZone(null); setReport(null); },
  };
}

interface ControlsProps {
  heat: boolean;
  zones: boolean;
  filtersOn: boolean;
  onHeat: () => void;
  onZones: () => void;
  onFilters: () => void;
  onReport: () => void;
}

/** Leyenda de riesgo y botones de filtros, reportar, mapa de calor y zonas. */
export function RiskControls({ heat, zones, filtersOn, onHeat, onZones, onFilters, onReport }: ControlsProps) {
  const toggle = (on: boolean) => `flex h-11 items-center gap-1.5 rounded-xl border px-2.5 text-sm font-semibold ${on ? "border-brand-900 bg-brand-900 text-white" : "border-line bg-white text-ink"}`;
  return (
    <div className="flex items-start justify-between">
      {heat || zones ? (
        <div className="rounded-lg border border-line bg-white px-2.5 py-2">
          <p className="text-[11px] font-semibold text-muted">Nivel de riesgo</p>
          <div className="mt-1 h-2 w-24 rounded-full" style={{ background: "linear-gradient(to right, #13896F, #F2C94C, #E8833A, #D64545)" }} />
          <div className="flex justify-between text-[10px] text-muted"><span>Bajo</span><span>Alto</span></div>
        </div>
      ) : <span />}
      <div className="flex flex-col items-end gap-2">
        <div className="flex gap-2">
          <button onClick={onFilters} aria-label="Filtros del mapa" className={`relative flex h-11 w-11 items-center justify-center rounded-xl border ${filtersOn ? "border-brand-600 bg-brand-100 text-brand-700" : "border-line bg-white"}`}><SlidersHorizontal size={18} />{filtersOn && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-brand-600" />}</button>
          <button onClick={onReport} aria-label="Reportar un problema aquí" className="flex h-11 items-center gap-2 rounded-xl bg-risk-red px-3 text-sm font-semibold text-white"><Siren size={18} />Reportar</button>
        </div>
        <div className="flex gap-2">
          <button onClick={onHeat} aria-pressed={heat} aria-label="Mapa de calor de riesgo" className={toggle(heat)}><Layers size={18} />Riesgo</button>
          <button onClick={onZones} aria-pressed={zones} aria-label="Zonas de seguridad" className={toggle(zones)}><Hexagon size={18} />Zonas</button>
        </div>
      </div>
    </div>
  );
}

/** Tarjeta de la zona o el reporte tocado en el mapa. */
export function MapSelectionCard({ zone, report, onClose }: { zone: ZoneShapeProps | null; report: Report | null; onClose: () => void }) {
  if (zone)
    return (
      <div className="rounded-card border border-line bg-white p-4">
        <div className="flex items-start gap-3">
          <Hexagon size={26} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">{zone.name}</p>
            <p className="text-sm text-muted">{zone.score < 60 ? "Zona de riesgo alto" : zone.score < 80 ? "Zona de riesgo medio" : "Zona de riesgo bajo"} · Safety Score del mes</p>
            <Link href={`/zonas/${zone.id}`} className="mt-1 inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-600">Ver zona</Link>
          </div>
          <SafetyScoreBadge score={zone.score} />
          <button aria-label="Cerrar" onClick={onClose} className="-m-2 flex h-11 w-11 items-center justify-center"><X size={20} /></button>
        </div>
      </div>
    );
  if (!report) return null;
  const c = categoryById(report.category);
  return (
    <div className="rounded-card border border-line bg-white p-4">
      <div className="flex items-start gap-3">
        <c.icon size={26} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-bold">{c.label}</p>
          <p className="truncate text-sm text-muted">{report.street}</p>
          <p className="mt-1 text-xs text-muted">{formatDateTime(report.createdAt)} · {report.confirmations} confirmaciones</p>
          <Link href={report.mine ? `/reportes/${report.id}` : `/reportes-comunidad/${report.id}`} className="mt-1 inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-600">Ver detalle</Link>
        </div>
        <button aria-label="Cerrar" onClick={onClose} className="-m-2 flex h-11 w-11 items-center justify-center"><X size={20} /></button>
      </div>
    </div>
  );
}
