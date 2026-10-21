"use client";

import { use } from "react";
import { Download } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { useSocial } from "@/lib/social";

export default function ReciboPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { subscription, me } = useSocial();
  if (!subscription.active || id !== "WLY-2026-0420") return (<><ScreenHeader title="Recibo" back="/premium/pagos" /><EmptyState title="No encontramos este recibo" text="Revisa tu historial de pagos." /></>);
  const rows: [string, string][] = [["Folio", id], ["Fecha", "20 de octubre de 2026"], ["Cliente", me.name], ["Método de pago", "Tarjeta terminada en 4242"], ["Concepto", "Waylo Premium, mensual"]];
  return (
    <>
      <ScreenHeader title="Recibo" back="/premium/pagos" />
      <div className="flex-1 overflow-y-auto bg-white px-4 pb-6 pt-3">
        <div className="flex items-end justify-between"><p className="metric text-6xl">$79<span className="text-3xl">.00</span></p><Badge tone="brand">Pagado</Badge></div>
        <p className="text-sm text-muted">MXN · pago simulado</p>
        <dl className="mt-5 divide-y divide-line rounded-card border border-line text-[15px]">
          {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 px-4 py-3"><dt className="text-muted">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>)}
        </dl>
        <dl className="mt-4 divide-y divide-line rounded-card border border-line text-[15px]">
          <div className="flex justify-between px-4 py-3"><dt className="text-muted">Subtotal</dt><dd>$68.10</dd></div>
          <div className="flex justify-between px-4 py-3"><dt className="text-muted">IVA 16 %</dt><dd>$10.90</dd></div>
          <div className="flex justify-between px-4 py-3 font-bold"><dt>Total</dt><dd>$79.00</dd></div>
        </dl>
        <Button full variant="outline" className="mt-5" icon={<Download size={18} />}>Descargar PDF</Button>
      </div>
    </>
  );
}
