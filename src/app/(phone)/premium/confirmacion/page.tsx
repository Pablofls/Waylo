import { Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function ConfirmacionPage() {
  return (
    <div className="pt-safe pb-safe flex flex-1 flex-col bg-brand-900 px-6 text-white">
      <div className="flex flex-1 flex-col justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-900"><Crown size={30} /></span>
        <h1 className="mt-5 text-4xl font-bold leading-tight">Bienvenida a Premium</h1>
        <p className="mt-2 text-white/70">Tu pago simulado de $79.00 MXN se registró. Ya tienes mapas sin ssin conexión, rutas personalizadas, alertas avanzadas e historial por zona.</p>
        <dl className="mt-6 divide-y divide-white/15 rounded-card border border-white/15 text-sm">
          <div className="flex justify-between p-3"><dt className="text-white/70">Plan</dt><dd className="font-semibold">Mensual</dd></div>
          <div className="flex justify-between p-3"><dt className="text-white/70">Próximo cobro</dt><dd className="font-semibold">20 de noviembre de 2026</dd></div>
          <div className="flex justify-between p-3"><dt className="text-white/70">Folio</dt><dd className="font-mono font-semibold">WLY-2026-0420</dd></div>
        </dl>
      </div>
      <div className="space-y-2 pb-6">
        <Button href="/inicio" full size="lg" className="!bg-white !text-brand-900">Empezar</Button>
        <Button href="/premium/suscripcion" full variant="ghost" className="!text-white">Ver mi suscripción</Button>
      </div>
    </div>
  );
}
