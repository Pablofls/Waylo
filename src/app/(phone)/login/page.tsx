"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api, errorText } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      await api("/api/auth/login", "POST", { correo: email, contrasena: pass });
      router.replace("/inicio");
      router.refresh();
    } catch (e) {
      setError(errorText(e));
      setBusy(false);
    }
  };

  return (
    <div className="pt-safe pb-safe flex-1 overflow-y-auto px-6">
      <div className="pb-6 pt-12">
        <Logo size="md" />
        <h1 className="mt-8 text-3xl font-bold">Inicia sesión</h1>
        <p className="mt-1 text-muted">Entra para ver las rutas más seguras de tu zona.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="space-y-4"
      >
        <Input label="Correo electrónico" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="relative">
          <Input label="Contraseña" type={show ? "text" : "password"} autoComplete="current-password" required value={pass} onChange={(e) => setPass(e.target.value)} />
          <button type="button" aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShow(!show)} className="absolute bottom-0 right-0 flex h-[52px] w-12 items-center justify-center text-muted">
            {show ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <div className="text-right">
          <Link href="/recuperar" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-600">¿Olvidaste tu contraseña?</Link>
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-risk-red">{error}</p>}
        <Button type="submit" size="lg" full disabled={busy}>{busy ? "Entrando…" : "Continuar"}</Button>
      </form>

      <p className="py-8 text-center text-sm text-muted">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className="inline-flex min-h-[44px] items-center font-semibold text-brand-600">Crear cuenta</Link>
      </p>
    </div>
  );
}
