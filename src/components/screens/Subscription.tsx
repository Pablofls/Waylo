"use client";

import { useState } from "react";
import { Crown } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { ConfirmSheet } from "@/components/domain/ConfirmSheet";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { useSocial } from "@/lib/social";
import type { Recibo } from "@/server/premium";

const fecha = (iso: string) => new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Monterrey" }).format(new Date(iso));
const money = (n: number) => `$${n.toFixed(2)}`;

export function SubscriptionScreen({ payments, plan }: { payments: Recibo[]; plan: { nombre: string; total: number } }) {
  const { subscription, cancelSubscription, reactivateSubscription } = useSocial();
  const [confirm, setConfirm] = useState(false);

  if (!subscription.active) {
    return (<><ScreenHeader title="Suscripción" back="/premium" /><EmptyState icon={<Crown size={26} />} title="Aún no tienes Premium" text="Desbloquea mapas sin conexión, rutas personalizadas y más." action={<Button href="/premium">Ver Premium</Button>} /></>);
  }
  const until = subscription.until ? fecha(`${subscription.until}T12:00:00-06:00`) : "";

  return (
    <>
      <ScreenHeader title="Mi suscripción" back="/premium" />
      <div className="flex-1 space-y-5 overflow-y-auto bg-white px-4 pb-6 pt-3">
        <div className="rounded-card border border-line p-4">
          <div className="flex items-center justify-between"><p className="text-lg font-bold">{plan.nombre}</p>{subscription.cancelled ? <Badge tone="orange">Cancelada</Badge> : <Badge tone="brand">Activa</Badge>}</div>
          <p className="mt-1 text-sm text-muted">{money(plan.total)} MXN al mes · pago simulado</p>
          <p className="mt-3 text-sm">{subscription.cancelled ? <>Conservas los beneficios hasta el <strong>{until}</strong>. No habrá más cobros.</> : <>Vigente hasta el <strong>{until}</strong>.</>}</p>
        </div>
        {subscription.last4 && (
          <div>
            <h2 className="text-lg font-bold">Método de pago</h2>
            <p className="mt-1 text-[15px]">Tarjeta terminada en {subscription.last4}</p>
          </div>
        )}
        <div>
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Recibos</h2><a href="/premium/pagos" className="flex min-h-[44px] items-center text-sm font-semibold text-brand-600">Ver historial</a></div>
          <ul className="mt-2 divide-y divide-line rounded-card border border-line">
            {payments.slice(0, 3).map((p) => <li key={p.folio} className="flex min-h-[52px] items-center justify-between px-4 text-[15px]"><span>{fecha(p.fecha)}</span><span className="font-semibold">{money(p.total)}</span></li>)}
          </ul>
        </div>
        {subscription.cancelled ? (
          <Button full variant="secondary" onClick={reactivateSubscription}>Reactivar suscripción</Button>
        ) : (
          <Button full variant="outline" className="!text-[#B02E2E]" onClick={() => setConfirm(true)}>Cancelar suscripción</Button>
        )}
      </div>
      <ConfirmSheet open={confirm} danger title="¿Cancelar Premium?" text={`Conservarás los beneficios hasta el ${until} y después volverás al plan gratis.`} confirmLabel="Cancelar suscripción" cancelLabel="Mantener" onConfirm={cancelSubscription} onClose={() => setConfirm(false)} />
    </>
  );
}
