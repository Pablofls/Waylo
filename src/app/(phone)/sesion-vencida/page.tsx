"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/domain/Avatar";
import { useSocial } from "@/lib/social";

export default function SesionVencidaPage() {
  const router = useRouter();
  const { me } = useSocial();
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="pt-safe pb-safe flex flex-1 flex-col bg-white px-6">
      <form onSubmit={(e) => { e.preventDefault(); if (!pass) return setError("Escribe tu contraseña."); router.push("/inicio"); }} className="flex flex-1 flex-col justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FCEBDD] text-[#A8530F]"><Clock size={28} /></span>
        <h1 className="mt-4 text-3xl font-bold">Tu sesión venció</h1>
        <p className="mt-2 text-muted">Por seguridad cerramos tu sesión después de un tiempo sin usar la app. Tu rodada y tus reportes están a salvo.</p>
        <div className="mt-6 flex items-center gap-3 rounded-card border border-line p-3">
          <Avatar name={me.name} /><div className="min-w-0"><p className="font-semibold">{me.name}</p><p className="truncate text-sm text-muted">{me.email}</p></div>
        </div>
        <Input className="mt-4" label="Contraseña" type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} />
        {error && <p role="alert" className="mt-2 text-sm font-semibold text-risk-red">{error}</p>}
        <Button type="submit" full size="lg" className="mt-4">Continuar</Button>
        <Link href="/login" className="mt-2 flex min-h-[48px] items-center justify-center text-sm font-semibold text-brand-600">Entrar con otra cuenta</Link>
      </form>
    </div>
  );
}
