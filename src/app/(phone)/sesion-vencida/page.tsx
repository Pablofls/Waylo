import { Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SesionVencidaPage() {
  return (
    <div className="pt-safe pb-safe flex flex-1 flex-col justify-center bg-white px-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FCEBDD] text-[#A8530F]"><Clock size={28} /></span>
      <h1 className="mt-4 text-3xl font-bold">Tu sesión venció</h1>
      <p className="mt-2 text-muted">Por seguridad cerramos tu sesión después de un tiempo sin usar la app. Tu rodada y tus reportes están a salvo.</p>
      <Button href="/login" full size="lg" className="mt-6">Iniciar sesión</Button>
    </div>
  );
}
