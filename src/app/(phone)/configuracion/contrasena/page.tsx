"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function CambiarContrasenaPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const save = () => {
    if (!current) return setError("Escribe tu contraseña actual.");
    if (next.length < 8) return setError("La nueva contraseña debe tener al menos 8 caracteres.");
    if (next === current) return setError("La nueva contraseña debe ser distinta de la actual.");
    if (next !== again) return setError("Las contraseñas nuevas no coinciden.");
    setError("");
    setDone(true);
  };

  return (
    <>
      <ScreenHeader title="Cambiar contraseña" back="/configuracion" />
      {done ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white"><CheckCircle2 size={30} /></span>
          <h2 className="mt-4 text-2xl font-bold">Contraseña actualizada</h2>
          <p className="mt-1 text-muted">Úsala la próxima vez que inicies sesión.</p>
          <Button href="/configuracion" className="mt-6">Volver a configuración</Button>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-4 overflow-y-auto bg-white px-4 pt-3">
            <Input label="Contraseña actual" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            <Input label="Nueva contraseña" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} hint="Mínimo 8 caracteres." />
            <Input label="Confirma la nueva contraseña" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
            {error && <p role="alert" className="text-sm font-semibold text-risk-red">{error}</p>}
          </div>
          <div className="pb-safe border-t border-line bg-white px-4 pt-3"><Button full size="lg" onClick={save}>Guardar contraseña</Button><div className="h-3" /></div>
        </>
      )}
    </>
  );
}
