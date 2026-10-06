"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/Button";

export default function Splash() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.push("/login"), 3500);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="pt-safe pb-safe flex flex-1 flex-col bg-brand-900 px-6 text-white">
      <div className="flex flex-1 flex-col items-start justify-center">
        <Logo size="xl" tone="light" />
        <p className="mt-4 font-display text-4xl font-bold uppercase leading-none tracking-tight text-brand-100">Llega seguro</p>
        <p className="mt-4 max-w-[280px] text-base text-white/70">Rutas con Safety Score para bici y scooter en el Área Metropolitana de Monterrey.</p>
      </div>
      <div className="pb-6">
        <Button href="/login" size="lg" full className="!bg-white !text-brand-900">Comenzar</Button>
        <Link href="/catalogo" className="mt-2 flex min-h-[44px] items-center justify-center text-sm text-white/60">Ver catálogo de pantallas</Link>
      </div>
    </div>
  );
}
