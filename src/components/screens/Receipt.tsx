"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Recibo } from "@/server/premium";

const fecha = (iso: string) => new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Monterrey" }).format(new Date(iso));

export function ReceiptBody({ r }: { r: Recibo }) {
  const [entero, cents] = r.total.toFixed(2).split(".");
  const rows: [string, string][] = [["Folio", r.folio], ["Fecha", fecha(r.fecha)], ["Cliente", r.cliente], ["Método de pago", r.ultimos4 ? `${r.metodo} terminada en ${r.ultimos4}` : r.metodo], ["Concepto", r.concepto]];
  return (
    <div className="flex-1 overflow-y-auto bg-white px-4 pb-6 pt-3">
      <div className="flex items-end justify-between"><p className="metric text-6xl">${entero}<span className="text-3xl">.{cents}</span></p><Badge tone="brand">Pagado</Badge></div>
      <p className="text-sm text-muted">MXN · pago simulado</p>
      <dl className="mt-5 divide-y divide-line rounded-card border border-line text-[15px]">
        {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 px-4 py-3"><dt className="text-muted">{k}</dt><dd className="text-right font-semibold">{v}</dd></div>)}
      </dl>
      <dl className="mt-4 divide-y divide-line rounded-card border border-line text-[15px]">
        <div className="flex justify-between px-4 py-3"><dt className="text-muted">Subtotal</dt><dd>${r.subtotal.toFixed(2)}</dd></div>
        <div className="flex justify-between px-4 py-3"><dt className="text-muted">IVA {Math.round(r.tasaIva * 100)} %</dt><dd>${r.iva.toFixed(2)}</dd></div>
        <div className="flex justify-between px-4 py-3 font-bold"><dt>Total</dt><dd>${r.total.toFixed(2)}</dd></div>
      </dl>
      <Button full variant="outline" className="mt-5" icon={<Download size={18} />} onClick={() => window.print()}>Imprimir o guardar como PDF</Button>
    </div>
  );
}
