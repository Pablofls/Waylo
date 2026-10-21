"use client";

import { useState } from "react";
import { MailCheck, ShieldCheck } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Stepper } from "@/components/ui/Stepper";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function RecuperarPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [error, setError] = useState("");

  const fail = (m: string) => setError(m);
  const next = () => {
    setError("");
    if (step === 1) return /\S+@\S+\.\S+/.test(email) ? setStep(2) : fail("Escribe un correo válido.");
    if (step === 2) return /^\d{6}$/.test(code) ? setStep(3) : fail("El código tiene 6 dígitos.");
    if (step === 3) {
      if (pass.length < 8) return fail("La contraseña debe tener al menos 8 caracteres.");
      if (pass !== pass2) return fail("Las contraseñas no coinciden.");
      setStep(4);
    }
  };

  if (step === 4) {
    return (
      <div className="pt-safe pb-safe flex flex-1 flex-col bg-white px-6">
        <div className="flex flex-1 flex-col justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-white"><ShieldCheck size={30} /></span>
          <h1 className="mt-5 text-3xl font-bold">Contraseña actualizada</h1>
          <p className="mt-2 text-muted">Ya puedes iniciar sesión con tu nueva contraseña.</p>
        </div>
        <div className="pb-6"><Button href="/login" full size="lg">Ir a iniciar sesión</Button></div>
      </div>
    );
  }

  return (
    <>
      <ScreenHeader title="Recuperar contraseña" back="/login" />
      <div className="px-4 pb-2"><Stepper step={step} total={3} /></div>
      <form onSubmit={(e) => { e.preventDefault(); next(); }} className="flex flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 pt-5">
          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold">¿Cuál es tu correo?</h2>
              <p className="text-sm text-muted">Te enviaremos un código de 6 dígitos para restablecer tu contraseña.</p>
              <Input label="Correo electrónico" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="daniela.garza@correo.com" />
            </>
          )}
          {step === 2 && (
            <>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600"><MailCheck size={28} /></span>
              <h2 className="text-2xl font-bold">Revisa tu correo</h2>
              <p className="text-sm text-muted">Enviamos un código a <strong className="text-ink">{email}</strong>. Caduca en 10 minutos.</p>
              <Input label="Código de 6 dígitos" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" />
              <button type="button" className="min-h-[44px] text-sm font-semibold text-brand-600">Reenviar código</button>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="text-2xl font-bold">Crea tu nueva contraseña</h2>
              <Input label="Nueva contraseña" type="password" autoComplete="new-password" value={pass} onChange={(e) => setPass(e.target.value)} hint="Mínimo 8 caracteres." />
              <Input label="Confirma la contraseña" type="password" autoComplete="new-password" value={pass2} onChange={(e) => setPass2(e.target.value)} />
            </>
          )}
          {error && <p role="alert" className="text-sm font-semibold text-risk-red">{error}</p>}
          <p className="text-xs text-muted">Pantalla de demostración: no se envía ningún correo ni se valida el código.</p>
        </div>
        <div className="pb-safe border-t border-line bg-white px-4 pt-3">
          <Button type="submit" full size="lg">{step === 3 ? "Guardar contraseña" : "Continuar"}</Button>
          <div className="h-3" />
        </div>
      </form>
    </>
  );
}
