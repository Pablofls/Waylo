"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, PartyPopper } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { PlaceSearchField } from "@/components/domain/PlaceSearchField";
import { MiniMap } from "@/components/domain/MiniMap";
import { Avatar } from "@/components/domain/Avatar";
import { ShareSheet } from "@/components/domain/ShareSheet";
import { useSocial } from "@/lib/social";
import type { Place, RideLevel, RidePace, RidePrivacy, Vehicle } from "@/types";

// Nombres del catálogo cat_regla_rodada.
const RULES = ["Casco puesto", "Luces delantera y trasera", "Respeta los semáforos", "Lleva agua", "Chaleco o ropa reflejante", "Kit de reparación", "Bicicleta revisada"];

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      {children}
    </div>
  );
}

export function RideForm({ places, editId, clubId }: { places: Place[]; editId?: string; clubId?: string }) {
  const router = useRouter();
  const { me, friends, ride: find, createRide, updateRide } = useSocial();
  const editing = editId ? find(editId) : undefined;
  const isEdit = Boolean(editId);

  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [date, setDate] = useState(editing?.date.slice(0, 10) ?? "");
  const [time, setTime] = useState(editing?.date.slice(11, 16) ?? "");
  const [place, setPlace] = useState<Place | null>(editing ? { id: editing.meetingPlaceId, name: editing.meetingPoint, detail: "", coordinates: editing.meetingCoordinates } : null);
  const [busy, setBusy] = useState(false);
  const [level, setLevel] = useState<RideLevel>(editing?.level ?? "Principiante");
  const [pace, setPace] = useState<RidePace>(editing?.pace ?? "Relajado");
  const [vehicle, setVehicle] = useState<Vehicle>(editing?.vehicle ?? "bicicleta");
  const [km, setKm] = useState(String(editing?.km ?? ""));
  const [capacity, setCapacity] = useState(editing?.capacity ? String(editing.capacity) : "");
  const [privacy, setPrivacy] = useState<RidePrivacy>(editing?.privacy ?? "publica");
  const [rules, setRules] = useState<string[]>(editing?.rules ?? ["Casco puesto", "Luces delantera y trasera"]);
  const [invited, setInvited] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [share, setShare] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  if (isEdit && !editing) return (<><ScreenHeader title="Editar rodada" back="/comunidad" /><p className="p-4 text-muted">No encontramos esta rodada.</p></>);
  if (isEdit && editing && editing.organizerId !== me.id) return (<><ScreenHeader title="Editar rodada" back={`/rodadas/${editId}`} /><p className="p-4 text-muted">Solo quien organiza puede editar la rodada.</p></>);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const submit = async () => {
    const e: Record<string, string> = {};
    if (title.trim().length < 4) e.title = "Escribe un nombre de al menos 4 caracteres.";
    if (!date) e.date = "Elige la fecha.";
    else if (!isEdit && date < today()) e.date = "La fecha debe ser hoy o futura.";
    if (!time) e.time = "Elige la hora.";
    if (!place?.id) e.place = "Elige el punto de salida de la lista.";
    if (!(Number(km) > 0)) e.km = "Indica una distancia aproximada.";
    if (capacity && !(Number(capacity) >= 2)) e.capacity = "El cupo mínimo es 2.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const draft = {
      title: title.trim(),
      description: description.trim() || "Sin descripción.",
      date: `${date}T${time}:00-06:00`,
      meetingPoint: place!.name,
      meetingPlaceId: place!.id,
      meetingCoordinates: place!.coordinates,
      level, pace, vehicle,
      km: Number(km),
      capacity: capacity ? Number(capacity) : undefined,
      privacy, rules,
    };
    setBusy(true);
    try {
      if (isEdit && editId) {
        await updateRide(editId, draft);
        router.push(`/rodadas/${editId}`);
      } else {
        setCreatedId(await createRide(draft, invited, clubId));
      }
    } catch (err) {
      setErrors({ title: err instanceof Error ? err.message : "No pudimos guardar la rodada." });
      setBusy(false);
    }
  };

  if (createdId) {
    return (
      <div className="pt-safe pb-safe flex flex-1 flex-col bg-white px-6">
        <div className="flex flex-1 flex-col justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white"><PartyPopper size={30} /></span>
          <h1 className="mt-5 text-3xl font-bold">Rodada publicada</h1>
          <p className="mt-2 text-muted">{title.trim()} ya aparece en Comunidad. Comparte el enlace para que más personas se unan.</p>
          <p className="mt-4 rounded-xl bg-canvas px-4 py-3 font-mono text-sm">{`${origin}/rodadas/${createdId}`}</p>
        </div>
        <div className="space-y-2 pb-6">
          <Button full size="lg" icon={<Copy size={18} />} onClick={() => setShare(true)}>Compartir enlace</Button>
          <Button full variant="outline" href={`/rodadas/${createdId}`}>Ver rodada</Button>
        </div>
        <ShareSheet open={share} onClose={() => setShare(false)} title="Comparte la rodada" text="Cualquiera con el enlace podrá ver los detalles." url={`${origin}/rodadas/${createdId}`} />
      </div>
    );
  }

  return (
    <>
      <ScreenHeader title={isEdit ? "Editar rodada" : "Crear rodada"} subtitle="Es un punto de encuentro; cada quien registra su recorrido" back={isEdit ? `/rodadas/${editId}` : "/comunidad"} />
      <div className="flex-1 space-y-5 overflow-y-auto bg-white px-4 pb-6 pt-2">
        <div>
          <Input label="Nombre de la rodada" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Rodada nocturna por Fundidora" maxLength={60} />
          {errors.title && <p role="alert" className="mt-1 text-xs font-semibold text-risk-red">{errors.title}</p>}
        </div>
        <div>
          <label htmlFor="desc" className="mb-1.5 block text-sm font-semibold">Descripción</label>
          <textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={300} placeholder="Ritmo, paradas, qué esperar" className="w-full rounded-xl border border-line px-4 py-3 text-base placeholder:text-[#8A929C] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input label="Fecha" type="date" min={isEdit ? undefined : today()} value={date} onChange={(e) => setDate(e.target.value)} />
            {errors.date && <p role="alert" className="mt-1 text-xs font-semibold text-risk-red">{errors.date}</p>}
          </div>
          <div>
            <Input label="Hora de salida" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            {errors.time && <p role="alert" className="mt-1 text-xs font-semibold text-risk-red">{errors.time}</p>}
          </div>
        </div>

        <div className="space-y-3">
          <PlaceSearchField label="Punto de salida" places={places} value={place} onChange={setPlace} error={errors.place} />
          {place && <MiniMap position={place.coordinates} height={150} />}
        </div>

        <Field label="Nivel">
          <Segmented label="Nivel" value={level} onChange={setLevel} options={[{ value: "Principiante", label: "Principiante" }, { value: "Intermedio", label: "Intermedio" }, { value: "Avanzado", label: "Avanzado" }]} />
        </Field>
        <Field label="Ritmo">
          <Segmented label="Ritmo" value={pace} onChange={setPace} options={[{ value: "Relajado", label: "Relajado" }, { value: "Moderado", label: "Moderado" }, { value: "Rápido", label: "Rápido" }]} />
        </Field>
        <Field label="Vehículo">
          <Segmented label="Vehículo" value={vehicle} onChange={setVehicle} options={[{ value: "bicicleta", label: "Bicicleta" }, { value: "scooter", label: "Scooter" }, { value: "ambos", label: "Ambos" }]} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input label="Distancia (km)" type="number" inputMode="decimal" min="1" value={km} onChange={(e) => setKm(e.target.value)} placeholder="15" />
            {errors.km && <p role="alert" className="mt-1 text-xs font-semibold text-risk-red">{errors.km}</p>}
          </div>
          <div>
            <Input label="Cupo (opcional)" type="number" inputMode="numeric" min="2" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Sin límite" />
            {errors.capacity && <p role="alert" className="mt-1 text-xs font-semibold text-risk-red">{errors.capacity}</p>}
          </div>
        </div>

        <Field label="Quién puede verla">
          <Segmented label="Privacidad" value={privacy} onChange={setPrivacy} options={[{ value: "publica", label: "Pública" }, { value: "amigos", label: "Solo amigos" }]} />
        </Field>

        <Field label="Recomendaciones para asistentes">
          <div className="flex flex-wrap gap-2">
            {RULES.map((r) => <Chip key={r} selected={rules.includes(r)} onClick={() => setRules(toggle(rules, r))}>{r}</Chip>)}
          </div>
        </Field>

        {!isEdit && friends.length > 0 && (
          <Field label="Invitar amigos">
            <ul className="divide-y divide-line rounded-card border border-line">
              {friends.map((f) => {
                const on = invited.includes(f.id);
                return (
                  <li key={f.id}>
                    <button type="button" role="checkbox" aria-checked={on} onClick={() => setInvited(toggle(invited, f.id))} className="flex min-h-[56px] w-full items-center gap-3 px-3 text-left">
                      <Avatar name={f.name} size={36} />
                      <span className="flex-1 text-[15px] font-semibold">{f.name}</span>
                      <span className={`flex h-6 w-6 items-center justify-center rounded-md border-2 ${on ? "border-brand-600 bg-brand-600 text-white" : "border-[#C9CED3]"}`}>{on && <Check size={16} strokeWidth={3} />}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Field>
        )}
      </div>
      <div className="pb-safe border-t border-line bg-white px-4 pt-3">
        <Button full size="lg" disabled={busy} onClick={() => void submit()}>{busy ? "Guardando…" : isEdit ? "Guardar cambios" : "Publicar rodada"}</Button>
        <div className="h-3" />
      </div>
    </>
  );
}
