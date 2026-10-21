import { MapPlanner } from "@/components/screens/MapPlanner";
import { getRiskPoints, getRecentReports, getUser, getPlaces, getPlaceById } from "@/lib/data";
import type { Place } from "@/types";

export default async function MapaPage({ searchParams }: { searchParams: Promise<{ destino?: string; nombre?: string; ruta?: string }> }) {
  const { destino, nombre, ruta } = await searchParams;
  const initialRoute = ruta === "rapida" || ruta === "segura" || ruta === "equilibrada" ? ruta : undefined;
  const [risk, reports, user, places] = await Promise.all([getRiskPoints(), getRecentReports(), getUser(), getPlaces()]);
  let initialDest: Place | null = await getPlaceById(destino ?? "");
  if (!initialDest) {
    const [lng, lat] = (destino ?? "").split(",").map(Number);
    if (Number.isFinite(lng) && Number.isFinite(lat) && destino) initialDest = { name: nombre ?? "Destino", detail: "", coordinates: [lng, lat] };
  }
  return <MapPlanner risk={risk} reports={reports} places={places} maxExtraMinutes={user.maxExtraMinutes} initialDest={initialDest} initialRoute={initialRoute} />;
}
