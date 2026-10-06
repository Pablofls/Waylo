"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.100-6.7-4.9H1.300v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.400a7.200 7.200 0 0 1 0-4.6V6.7H1.300a12 12 0 0 0 0 10.800l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.800c1.800 0 3.3.6 4.6 1.800l3.4-3.4A12 12 0 0 0 1.300 6.7l4 3.1C6.3 6.9 8.9 4.800 12 4.800Z" />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M16.400 12.700c0-2.300 1.900-3.4 2-3.500-1.100-1.600-2.800-1.800-3.4-1.800-1.400-.1-2.800.9-3.500.9s-1.800-.8-3-.8c-1.500 0-3 .9-3.800 2.300-1.600 2.800-.4 7 1.200 9.300.8 1.100 1.700 2.400 2.900 2.300 1.200 0 1.600-.7 3-.7s1.800.7 3 .7 2-1.100 2.800-2.200c.9-1.300 1.200-2.500 1.300-2.600-.1 0-2.500-1-2.500-3.900ZM14.100 5.800c.6-.8 1.100-1.900.9-3-.9 0-2.100.6-2.700 1.400-.6.7-1.100 1.800-1 2.900 1.100.1 2.100-.5 2.800-1.300Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const go = () => router.push("/mapa");

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
          go();
        }}
        className="space-y-4"
      >
        <Input label="Correo electrónico" type="email" autoComplete="email" defaultValue="daniela.garza@correo.com" />
        <div className="relative">
          <Input label="Contraseña" type={show ? "text" : "password"} autoComplete="current-password" defaultValue="waylo2026" />
          <button type="button" aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} onClick={() => setShow(!show)} className="absolute bottom-0 right-0 flex h-[52px] w-12 items-center justify-center text-muted">
            {show ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <div className="text-right">
          <Link href="/login" className="inline-flex min-h-[44px] items-center text-sm font-semibold text-brand-600">¿Olvidaste tu contraseña?</Link>
        </div>
        <Button type="submit" size="lg" full>Continuar</Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-sm text-muted">
        <span className="h-px flex-1 bg-line" />o<span className="h-px flex-1 bg-line" />
      </div>

      <div className="space-y-3">
        <Button variant="outline" full size="lg" icon={<GoogleMark />} onClick={go}>Continuar con Google</Button>
        <Button variant="outline" full size="lg" icon={<AppleMark />} onClick={go}>Continuar con Apple</Button>
      </div>

      <p className="py-8 text-center text-sm text-muted">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/registro" className="inline-flex min-h-[44px] items-center font-semibold text-brand-600">Crear cuenta</Link>
      </p>
    </div>
  );
}
