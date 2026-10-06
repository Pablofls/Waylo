"use client";

import { useEffect } from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useMap } from "./MapView";
import { categoryById } from "@/lib/report-categories";
import type { Report } from "@/types";

interface Props {
  reports: Report[];
  onSelect?: (r: Report) => void;
}

export function ReportMarkers({ reports, onSelect }: Props) {
  const ctx = useMap();

  useEffect(() => {
    if (!ctx) return;
    const { map, lib } = ctx;
    const markers = reports.map((r) => {
      const cat = categoryById(r.category);
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", cat.label);
      el.className = "flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-white text-ink";
      el.innerHTML = renderToStaticMarkup(createElement(cat.icon, { size: 16, strokeWidth: 2.4 }));
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelect?.(r);
      });
      return new lib.Marker({ element: el }).setLngLat(r.coordinates).addTo(map);
    });
    return () => markers.forEach((m) => m.remove());
  }, [ctx, reports, onSelect]);

  return null;
}
