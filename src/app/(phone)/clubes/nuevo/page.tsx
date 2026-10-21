"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Input } from "@/components/ui/Input";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { useSocial } from "@/lib/social";

export default function NuevoClubPage() {
  const router = useRouter();
  const { createClub, municipalities, me } = useSocial();
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [zone, setZone] = useState(municipalities.find((m) => m.nombre === me.city)?.clave ?? "");
  const [privacy, setPrivacy] = useState<"publico" | "privado">("publico");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = async () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 3) e.name = "Escribe un nombre de al menos 3 caracteres.";
    if (description.trim().length < 15) e.description = "Cuéntanos de qué trata el club (al menos 15 caracteres).";
    if (!zone) e.zone = "Elige el municipio.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      router.push(`/clubes/${await createClub({ name: name.trim(), description: description.trim(), municipality: zone, privacy })}`);
    } catch (err) {
      setErrors({ name: err instanceof Error ? err.message : "No pudimos crear el club." });
      setBusy(false);
    }
  };
  const err = (k: string) => errors[k] && <p role="alert" className="mt-1 text-xs font-semibold text-risk-red">{errors[k]}</p>;

  return (
    <>
      <ScreenHeader title="Crear club" subtitle="Reúne a tu comunidad" back="/comunidad" />
      <div className="flex-1 space-y-5 overflow-y-auto bg-white px-4 pb-6 pt-3">
        <div><Input label="Nombre del club" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Ciclistas del Valle" />{err("name")}</div>
        <div>
          <label htmlFor="club-desc" className="mb-1.5 block text-sm font-semibold">Descripción</label>
          <textarea id="club-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={300} placeholder="Quiénes son, cuándo ruedan y qué buscan" className="w-full rounded-xl border border-line px-4 py-3 text-base placeholder:text-[#8A929C] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20" />
          {err("description")}
        </div>
        <div>
          <label htmlFor="club-zona" className="mb-1.5 block text-sm font-semibold">Municipio</label>
          <select id="club-zona" value={zone} onChange={(e) => setZone(e.target.value)} className="min-h-[52px] w-full rounded-xl border border-line bg-white px-4 text-base focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20">
            <option value="">Elige un municipio</option>
            {municipalities.map((m) => <option key={m.clave} value={m.clave}>{m.nombre}</option>)}
          </select>
          {err("zone")}
        </div>
        <div><p className="mb-1.5 text-sm font-semibold">Privacidad</p><Segmented label="Privacidad" value={privacy} onChange={setPrivacy} options={[{ value: "publico", label: "Público" }, { value: "privado", label: "Privado" }]} /><p className="mt-1.5 text-xs text-muted">{privacy === "publico" ? "Cualquiera puede unirse." : "Las personas deben solicitar unirse."}</p></div>
      </div>
      <div className="pb-safe border-t border-line bg-white px-4 pt-3"><Button full size="lg" disabled={busy} onClick={() => void submit()}>{busy ? "Creando…" : "Crear club"}</Button><div className="h-3" /></div>
    </>
  );
}
