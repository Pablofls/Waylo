"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase, GraduationCap, Home, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { PlaceSearchField } from "@/components/domain/PlaceSearchField";
import { ConfirmSheet } from "@/components/domain/ConfirmSheet";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { useSocial } from "@/lib/social";
import { PLACES } from "@/mocks/places";
import type { Place, SavedPlace } from "@/types";

const kinds: { v: SavedPlace["kind"]; l: string; icon: typeof Home }[] = [
  { v: "casa", l: "Casa", icon: Home },
  { v: "escuela", l: "Escuela", icon: GraduationCap },
  { v: "trabajo", l: "Trabajo", icon: Briefcase },
  { v: "favorito", l: "Favorito", icon: Star },
];

export default function LugaresPage() {
  const { savedPlaces, addSavedPlace, removeSavedPlace } = useSocial();
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<SavedPlace["kind"]>("favorito");
  const [label, setLabel] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<SavedPlace | null>(null);

  const save = () => {
    if (!place) return setError("Elige un lugar.");
    addSavedPlace({ id: `sp_${Date.now()}`, label: label.trim() || place.name, kind, place });
    setAdding(false);
    setLabel("");
    setPlace(null);
    setError("");
  };

  return (
    <>
      <ScreenHeader title="Lugares guardados" subtitle="Llega más rápido a donde vas seguido" back="/perfil" />
      <div className="flex-1 overflow-y-auto bg-white">
        {adding ? (
          <div className="space-y-4 p-4">
            <h2 className="text-lg font-bold">Nuevo lugar</h2>
            <div className="flex flex-wrap gap-2">
              {kinds.map(({ v, l, icon: Icon }) => <Chip key={v} selected={kind === v} icon={<Icon size={16} />} onClick={() => setKind(v)}>{l}</Chip>)}
            </div>
            <PlaceSearchField label="Lugar" places={PLACES} value={place} onChange={setPlace} error={error} />
            <Input label="Nombre (opcional)" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Gimnasio" />
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => { setAdding(false); setError(""); }}>Cancelar</Button>
              <Button onClick={save}>Guardar</Button>
            </div>
          </div>
        ) : savedPlaces.length === 0 ? (
          <EmptyState icon={<MapPin size={26} />} title="Aún no guardas lugares" text="Guarda tu casa, escuela o trabajo para planear rutas con un toque." action={<Button onClick={() => setAdding(true)}>Agregar lugar</Button>} />
        ) : (
          <>
            <ul>
              {savedPlaces.map((sp) => {
                const Icon = kinds.find((k) => k.v === sp.kind)!.icon;
                return (
                  <li key={sp.id} className="flex min-h-[72px] items-center gap-2 border-b border-line pr-2">
                    <Link href={`/mapa?destino=${sp.place.coordinates.join(",")}&nombre=${encodeURIComponent(sp.label)}`} className="flex min-h-[72px] min-w-0 flex-1 items-center gap-3 py-3 pl-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600"><Icon size={20} /></span>
                      <span className="min-w-0">
                        <span className="block truncate text-[15px] font-semibold">{sp.label}</span>
                        <span className="block truncate text-sm text-muted">{sp.place.detail}</span>
                      </span>
                    </Link>
                    <button aria-label={`Eliminar ${sp.label}`} onClick={() => setToDelete(sp)} className="flex h-11 w-11 items-center justify-center rounded-full text-muted active:bg-canvas"><Trash2 size={20} /></button>
                  </li>
                );
              })}
            </ul>
            <div className="p-4"><Button full variant="secondary" icon={<Plus size={18} />} onClick={() => setAdding(true)}>Agregar lugar</Button></div>
          </>
        )}
      </div>
      <ConfirmSheet open={toDelete !== null} danger title={`¿Eliminar ${toDelete?.label ?? "este lugar"}?`} text="Podrás volver a guardarlo cuando quieras." confirmLabel="Eliminar" onConfirm={() => toDelete && removeSavedPlace(toDelete.id)} onClose={() => setToDelete(null)} />
    </>
  );
}
