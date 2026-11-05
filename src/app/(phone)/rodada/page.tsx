import { LiveRide } from "@/components/screens/LiveRide";
import { getNavigation, getRecentReports, getRoute, getRiskPoints, getZoneShapes } from "@/lib/data";

export default async function RodadaPage({ searchParams }: { searchParams: Promise<{ ruta?: string }> }) {
  const { ruta } = await searchParams;
  const route = ruta ? await getRoute(ruta) : null;
  const nav = route?.optionId ? await getNavigation(route.optionId) : { steps: [], alerts: [] };
  const [risk, zones, reports] = await Promise.all([getRiskPoints(), getZoneShapes(), getRecentReports()]);
  return <LiveRide route={route} steps={nav.steps} alerts={nav.alerts} risk={risk} zones={zones} reports={reports} />;
}
