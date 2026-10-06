import { MapPlanner } from "@/components/screens/MapPlanner";
import { getRiskPoints, getRecentReports, getRoutes, getUsualRoute, getUser, getPlaces } from "@/lib/data";

export default async function MapaPage() {
  const [risk, reports, routes, usual, user, places] = await Promise.all([getRiskPoints(), getRecentReports(), getRoutes(), getUsualRoute(), getUser(), getPlaces()]);
  return <MapPlanner risk={risk} reports={reports} routes={routes} origin={usual.origin} places={places} maxExtraMinutes={user.maxExtraMinutes} />;
}
