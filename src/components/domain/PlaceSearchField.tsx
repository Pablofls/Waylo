"use client";

import { useState } from "react";
import { MapPin, X } from "lucide-react";
import type { Place } from "@/types";

interface Props {
  label: string;
  places: Place[];
  value: Place | null;
  onChange: (p: Place | null) => void;
  error?: string;
}

export function PlaceSearchField({ label, places, value, onChange, error }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const matches = places.filter((p) => `${p.name} ${p.detail}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div>
      <label htmlFor="place-search" className="mb-1.5 block text-sm font-semibold">{label}</label>
      <div className={`flex min-h-[52px] items-center gap-3 rounded-xl border bg-white px-4 ${error ? "border-risk-red" : "border-line"} focus-within:border-brand-600`}>
        <MapPin size={18} className="shrink-0 text-brand-600" />
        <input
          id="place-search"
          value={open ? q : value?.name ?? ""}
          onFocus={() => { setOpen(true); setQ(""); }}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca un lugar"
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#8A929C]"
        />
        {value && !open && <button type="button" aria-label="Quitar lugar" onClick={() => onChange(null)} className="-mr-3 flex h-11 w-11 items-center justify-center"><X size={18} /></button>}
      </div>
      {error && <p role="alert" className="mt-1 text-xs font-semibold text-risk-red">{error}</p>}
      {open && (
        <ul className="mt-1 max-h-[220px] overflow-y-auto rounded-xl border border-line bg-white">
          {matches.length === 0 && <li className="px-4 py-3 text-sm text-muted">Sin resultados.</li>}
          {matches.map((p) => (
            <li key={p.name}>
              <button type="button" onClick={() => { onChange(p); setOpen(false); }} className="flex min-h-[52px] w-full flex-col justify-center px-4 text-left active:bg-canvas">
                <span className="text-sm font-semibold">{p.name}</span>
                <span className="text-xs text-muted">{p.detail}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
