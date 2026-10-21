import { MapPlanner } from "@/components/screens/MapPlanner";
import { getRiskPoints, getRecentReports, getRoutes, getUsualRoute, getUser, getPlaces } from "@/lib/data";
import type { Place } from "@/types";

export default async function MapaPage({ searchParams }: { searchParams: Promise<{ destino?: string; nombre?: string }> }) {
  const { destino, nombre } = await searchParams;
  const [risk, reports, routes, usual, user, places] = await Promise.all([getRiskPoints(), getRecentReports(), getRoutes(), getUsualRoute(), getUser(), getPlaces()]);
  const [lng, lat] = (destino ?? "").split(",").map(Number);
  const initialDest: Place | null = Number.isFinite(lng) && Number.isFinite(lat) && destino ? { name: nombre ?? "Destino", detail: "Punto de salida de la rodada", coordinates: [lng, lat] } : null;
  return <MapPlanner risk={risk} reports={reports} routes={routes} origin={usual.origin} places={places} maxExtraMinutes={user.maxExtraMinutes} initialDest={initialDest} />;
}
