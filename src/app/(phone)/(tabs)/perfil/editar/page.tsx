"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Avatar } from "@/components/domain/Avatar";
import { Input } from "@/components/ui/Input";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { useSocial } from "@/lib/social";
import type { Vehicle } from "@/types";

export default function EditarPerfilPage() {
  const router = useRouter();
  const { me, updateMe } = useSocial();
  const [name, setName] = useState(me.name);
  const [city, setCity] = useState(me.city);
  const [bio, setBio] = useState(me.bio ?? "");
  const [vehicle, setVehicle] = useState<Vehicle>(me.vehicle);
  const [error, setError] = useState("");

  const save = () => {
    if (name.trim().length < 2) return setError("Escribe tu nombre.");
    updateMe({ name: name.trim(), city: city.trim(), bio: bio.trim(), vehicle });
    router.push("/perfil");
  };

  return (
    <>
      <ScreenHeader title="Editar perfil" back="/perfil" />
      <div className="flex-1 space-y-5 overflow-y-auto bg-white px-4 pb-6 pt-3">
        <div className="flex items-center gap-4">
          <Avatar name={name || "?"} size={72} />
          <Button variant="outline" icon={<Camera size={18} />}>Cambiar foto</Button>
        </div>
        <div>
          <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          {error && <p role="alert" className="mt-1 text-xs font-semibold text-risk-red">{error}</p>}
        </div>
        <Input label="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} />
        <div>
          <label htmlFor="bio" className="mb-1.5 block text-sm font-semibold">Sobre ti</label>
          <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={160} placeholder="Cuéntales a tus amigos cómo ruedas" className="w-full rounded-xl border border-line px-4 py-3 text-base placeholder:text-[#8A929C] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20" />
          <p className="mt-1 text-right text-xs text-muted">{bio.length}/160</p>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold">Vehículo</p>
          <Segmented label="Vehículo" value={vehicle} onChange={setVehicle} options={[{ value: "bicicleta", label: "Bicicleta" }, { value: "scooter", label: "Scooter" }, { value: "ambos", label: "Ambos" }]} />
        </div>
        <Input label="Correo electrónico" value={me.email} disabled hint="El correo no se puede cambiar por ahora." />
      </div>
      <div className="pb-safe border-t border-line bg-white px-4 pt-3">
        <Button full size="lg" onClick={save}>Guardar cambios</Button>
        <div className="h-3" />
      </div>
    </>
  );
}
