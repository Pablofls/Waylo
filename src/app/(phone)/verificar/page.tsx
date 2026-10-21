"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSocial } from "@/lib/social";

export default function VerificarPage() {
  const router = useRouter();
  const { me } = useSocial();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const submit = () => {
    if (!/^\d{6}$/.test(code)) return setError("El código tiene 6 dígitos.");
    router.push("/permisos/notificaciones");
  };

  return (
    <>
      <ScreenHeader title="Verifica tu correo" back="/registro" />
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 pt-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600"><MailCheck size={28} /></span>
          <h2 className="text-2xl font-bold">Escribe el código que te enviamos</h2>
          <p className="text-sm text-muted">Lo mandamos a <strong className="text-ink">{me.email}</strong>. Así sabemos que eres tú y podemos avisarte del estado de tus reportes.</p>
          <Input label="Código de 6 dígitos" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" />
          {error && <p role="alert" className="text-sm font-semibold text-risk-red">{error}</p>}
          <button type="button" disabled={seconds > 0} onClick={() => setSeconds(30)} className="min-h-[44px] text-sm font-semibold text-brand-600 disabled:text-muted">
            {seconds > 0 ? `Reenviar código en ${seconds} s` : "Reenviar código"}
          </button>
          <p className="text-xs text-muted">Pantalla de demostración: cualquier código de 6 dígitos funciona.</p>
        </div>
        <div className="pb-safe border-t border-line bg-white px-4 pt-3">
          <Button type="submit" full size="lg">Verificar</Button>
          <Button full variant="ghost" href="/permisos/notificaciones">Verificar después</Button>
          <div className="h-2" />
        </div>
      </form>
    </>
  );
}
