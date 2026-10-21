import { RideForm } from "@/components/screens/RideForm";
import { getPlaces } from "@/lib/data";

export default async function NuevaRodadaPage() {
  return <RideForm places={await getPlaces()} />;
}
