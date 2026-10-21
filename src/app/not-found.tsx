import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600"><Compass size={30} /></span>
      <h1 className="mt-5 text-3xl font-bold">No encontramos esta página</h1>
      <p className="mt-2 max-w-xs text-muted">Puede que el enlace esté roto o que la página ya no exista.</p>
      <Link href="/inicio" className="mt-6 inline-flex min-h-[48px] items-center rounded-xl bg-brand-600 px-6 font-semibold text-white">Volver al inicio</Link>
    </main>
  );
}
