import { RideForm } from "@/components/screens/RideForm";
import { getPlaces } from "@/lib/data";

export default async function NuevaRodadaPage({ searchParams }: { searchParams: Promise<{ club?: string }> }) {
  const { club } = await searchParams;
  return <RideForm places={await getPlaces()} clubId={club} />;
}
