import Link from "next/link";
import { ChevronRight, Receipt } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EmptyState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { getPayments } from "@/lib/data";

const fecha = (iso: string) => new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Monterrey" }).format(new Date(iso));

export default async function PagosPage() {
  const pagos = await getPayments();
  return (
    <>
      <ScreenHeader title="Historial de pagos" back="/premium/suscripcion" />
      <div className="flex-1 overflow-y-auto bg-white">
        {pagos.length === 0 ? (
          <EmptyState icon={<Receipt size={26} />} title="Aún no tienes pagos" text="Cuando te suscribas a Premium verás aquí tus recibos." action={<Button href="/premium">Ver Premium</Button>} />
        ) : (
          <ul>
            {pagos.map((p) => (
              <li key={p.folio}>
                <Link href={`/premium/pagos/${p.folio}`} className="flex min-h-[72px] items-center gap-3 border-b border-line px-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-600"><Receipt size={20} /></span>
                  <span className="min-w-0 flex-1"><span className="block text-[15px] font-semibold">{p.concepto}</span><span className="block text-sm text-muted">{fecha(p.fecha)}</span></span>
                  <span className="font-semibold">${p.total.toFixed(2)}</span><ChevronRight size={18} className="text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
