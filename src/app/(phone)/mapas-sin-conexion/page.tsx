"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Download, HardDrive, Trash2 } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { PremiumGate } from "@/components/domain/PremiumGate";
import { Button } from "@/components/ui/Button";
import { useSocial } from "@/lib/social";

const areas = [
  { id: "sp", name: "San Pedro Garza García", mb: 85 },
  { id: "mty", name: "Monterrey Centro", mb: 140 },
  { id: "sn", name: "San Nicolás de los Garza", mb: 110 },
  { id: "gpe", name: "Guadalupe", mb: 95 },
  { id: "amm", name: "Área metropolitana completa", mb: 520 },
];

export default function MapasSinConexionPage() {
  const { subscription, offlineMaps, toggleOfflineMap } = useSocial();
  const [gate, setGate] = useState(false);
  const [downloading, setDownloading] = useState<{ id: string; pct: number } | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const used = areas.filter((a) => offlineMaps.includes(a.id)).reduce((s, a) => s + a.mb, 0);
  const start = (id: string) => {
    if (!subscription.active) return setGate(true);
    setDownloading({ id, pct: 0 });
    timer.current = setInterval(() => {
      setDownloading((d) => {
        if (!d) return d;
        if (d.pct >= 100) {
          if (timer.current) clearInterval(timer.current);
          toggleOfflineMap(d.id);
          return null;
        }
        return { ...d, pct: d.pct + 10 };
      });
    }, 250);
  };

  return (
    <>
      <ScreenHeader title="Mapas sin conexión" subtitle="Incluido en Premium" back="/configuracion" />
      <div className="flex-1 overflow-y-auto bg-white pb-6">
        {!subscription.active && (
          <div className="m-4 rounded-card bg-brand-100 p-4 text-brand-900"><p className="font-bold">Descarga mapas para usarlos sin internet</p><p className="mt-1 text-sm">Es parte de Waylo Premium.</p><Button href="/premium" className="mt-3">Ver Premium</Button></div>
        )}
        <div className="px-4 pt-2">
          <div className="flex items-center gap-2 text-sm"><HardDrive size={18} className="text-muted" /><span className="font-semibold">{used} MB usados</span><span className="text-muted">de 1 GB</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round((used / 1024) * 100)} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, (used / 1024) * 100)}%` }} /></div>
        </div>
        <ul className="mt-3 border-t border-line">
          {areas.map((a) => {
            const done = offlineMaps.includes(a.id);
            const busy = downloading?.id === a.id;
            return (
              <li key={a.id} className="flex min-h-[72px] items-center gap-3 border-b border-line px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">{a.name}</span>
                  <span className="block text-sm text-muted">{busy ? `Descargando ${downloading!.pct}%` : done ? "Descargado" : `${a.mb} MB`}</span>
                  {busy && <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-line"><span className="block h-full bg-brand-600" style={{ width: `${downloading!.pct}%` }} /></span>}
                </span>
                {done ? (
                  <button aria-label={`Eliminar ${a.name}`} onClick={() => toggleOfflineMap(a.id)} className="flex h-11 w-11 items-center justify-center rounded-full text-muted"><Trash2 size={20} /></button>
                ) : busy ? (
                  <Check size={20} className="text-muted" aria-hidden />
                ) : (
                  <Button variant="outline" className="!min-h-[44px] !px-4 text-sm" icon={<Download size={16} />} disabled={downloading !== null} onClick={() => start(a.id)}>Descargar</Button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <PremiumGate open={gate} feature="Los mapas sin conexión" onClose={() => setGate(false)} />
    </>
  );
}
