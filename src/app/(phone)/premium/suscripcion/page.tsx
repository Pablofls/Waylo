"use client";

import { useState } from "react";
import { Crown } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { ConfirmSheet } from "@/components/domain/ConfirmSheet";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { useSocial } from "@/lib/social";

export default function SuscripcionPage() {
  const { subscription, cancelSubscription, subscribe } = useSocial();
  const [confirm, setConfirm] = useState(false);

  if (!subscription.active) {
    return (<><ScreenHeader title="Suscripción" back="/premium" /><EmptyState icon={<Crown size={26} />} title="Aún no tienes Premium" text="Desbloquea mapas sin conexión, rutas personalizadas y más." action={<Button href="/premium">Ver Premium</Button>} /></>);
  }

  return (
    <>
      <ScreenHeader title="Mi suscripción" back="/premium" />
      <div className="flex-1 space-y-5 overflow-y-auto bg-white px-4 pb-6 pt-3">
        <div className="rounded-card border border-line p-4">
          <div className="flex items-center justify-between"><p className="text-lg font-bold">Waylo Premium</p>{subscription.cancelled ? <Badge tone="orange">Cancelada</Badge> : <Badge tone="brand">Activa</Badge>}</div>
          <p className="mt-1 text-sm text-muted">$79.00 MXN al mes</p>
          <p className="mt-3 text-sm">{subscription.cancelled ? <>Conservas los beneficios hasta el <strong>20 de noviembre de 2026</strong>. No habrá más cobros.</> : <>Próximo cobro el <strong>20 de noviembre de 2026</strong>.</>}</p>
        </div>
        <div>
          <h2 className="text-lg font-bold">Método de pago</h2>
          <p className="mt-1 text-[15px]">Tarjeta terminada en 4242</p>
        </div>
        <div>
          <h2 className="text-lg font-bold">Recibos</h2>
          <ul className="mt-2 divide-y divide-line rounded-card border border-line">
            <li className="flex min-h-[52px] items-center justify-between px-4 text-[15px]"><span>20 de octubre de 2026</span><span className="font-semibold">$79.00</span></li>
          </ul>
        </div>
        {subscription.cancelled ? (
          <Button full variant="secondary" onClick={subscribe}>Reactivar suscripción</Button>
        ) : (
          <Button full variant="outline" className="!text-[#B02E2E]" onClick={() => setConfirm(true)}>Cancelar suscripción</Button>
        )}
      </div>
      <ConfirmSheet open={confirm} danger title="¿Cancelar Premium?" text="Conservarás los beneficios hasta el 20 de noviembre y después volverás al plan gratis." confirmLabel="Cancelar suscripción" cancelLabel="Mantener" onConfirm={cancelSubscription} onClose={() => setConfirm(false)} />
    </>
  );
}
