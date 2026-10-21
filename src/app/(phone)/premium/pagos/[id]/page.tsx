import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EmptyState } from "@/components/ui/States";
import { ReceiptBody } from "@/components/screens/Receipt";
import { getPayment } from "@/lib/data";

export default async function ReciboPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recibo = await getPayment(decodeURIComponent(id));
  return (
    <>
      <ScreenHeader title="Recibo" back="/premium/pagos" />
      {recibo ? <ReceiptBody r={recibo} /> : <EmptyState title="No encontramos este recibo" text="Revisa tu historial de pagos." />}
    </>
  );
}
