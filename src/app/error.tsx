"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main role="alert" className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F9E1E1] text-risk-red"><TriangleAlert size={30} /></span>
      <h1 className="mt-5 text-3xl font-bold">Algo salió mal</h1>
      <p className="mt-2 max-w-xs text-muted">No pudimos cargar esta pantalla. Inténtalo de nuevo; si sigue pasando, vuelve al inicio.</p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="inline-flex min-h-[48px] items-center rounded-xl bg-brand-600 px-6 font-semibold text-white">Reintentar</button>
        <Link href="/inicio" className="inline-flex min-h-[48px] items-center rounded-xl border border-line bg-white px-6 font-semibold">Ir al inicio</Link>
      </div>
    </main>
  );
}
