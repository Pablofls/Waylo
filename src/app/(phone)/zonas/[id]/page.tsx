import { notFound } from "next/navigation";
import { getZone } from "@/lib/data";
import { ZoneDetail } from "@/components/screens/ZoneDetail";

export default async function ZonaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const zone = await getZone(id);
  if (!zone) notFound();
  return <ZoneDetail zone={zone} />;
}
