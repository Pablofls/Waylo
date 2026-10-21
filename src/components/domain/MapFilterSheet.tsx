"use client";

import { X } from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { reportCategories } from "@/lib/report-categories";
import type { ReportCategory } from "@/types";

export type ReportAge = "todo" | "24h" | "7d" | "30d";
export const ageLabels: Record<ReportAge, string> = { todo: "Todos", "24h": "Últimas 24 h", "7d": "Últimos 7 días", "30d": "Últimos 30 días" };

interface Props {
  open: boolean;
  categories: ReportCategory[];
  age: ReportAge;
  onChange: (c: ReportCategory[], a: ReportAge) => void;
  onClose: () => void;
}

/** Filtros del mapa: tipo de reporte (vacío = todos) y antigüedad. */
export function MapFilterSheet({ open, categories, age, onChange, onClose }: Props) {
  if (!open) return null;
  const toggle = (c: ReportCategory) => onChange(categories.includes(c) ? categories.filter((x) => x !== c) : [...categories, c], age);
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button aria-label="Cerrar" className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Filtros del mapa" className="pb-safe relative max-h-[85%] overflow-y-auto rounded-t-3xl bg-white p-5">
        <div className="flex items-start justify-between">
          <div><h2 className="text-xl font-bold">Filtros</h2><p className="text-sm text-muted">Qué reportes ver en el mapa</p></div>
          <button aria-label="Cerrar" onClick={onClose} className="-mr-2 -mt-1 flex h-11 w-11 items-center justify-center"><X size={22} /></button>
        </div>
        <h3 className="mt-4 text-sm font-bold uppercase tracking-wide text-muted">Tipo de reporte</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {reportCategories.map(({ id, label, icon: Icon }) => <Chip key={id} selected={categories.includes(id)} icon={<Icon size={16} />} onClick={() => toggle(id)}>{label}</Chip>)}
        </div>
        <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-muted">Antigüedad</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(ageLabels) as ReportAge[]).map((a) => <Chip key={a} selected={age === a} onClick={() => onChange(categories, a)}>{ageLabels[a]}</Chip>)}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => onChange([], "todo")}>Limpiar</Button>
          <Button onClick={onClose}>Aplicar</Button>
        </div>
      </div>
    </div>
  );
}
