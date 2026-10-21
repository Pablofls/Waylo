import { RideDetail } from "@/components/screens/RideDetail";
import { getRiskPoints } from "@/lib/data";

export default async function ActividadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RideDetail id={id} risk={await getRiskPoints()} />;
}
