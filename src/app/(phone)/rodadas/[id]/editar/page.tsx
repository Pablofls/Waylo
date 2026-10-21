import { RideForm } from "@/components/screens/RideForm";
import { getPlaces } from "@/lib/data";

export default async function EditarRodadaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RideForm places={await getPlaces()} editId={id} />;
}
