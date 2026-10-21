import { LiveRide } from "@/components/screens/LiveRide";
import { getNavigation, getRoute, getRiskPoints } from "@/lib/data";

export default async function RodadaPage({ searchParams }: { searchParams: Promise<{ ruta?: string }> }) {
  const { ruta } = await searchParams;
  const route = ruta ? await getRoute(ruta) : null;
  const nav = route?.optionId ? await getNavigation(route.optionId) : { steps: [], alerts: [] };
  return <LiveRide route={route} steps={nav.steps} alerts={nav.alerts} risk={await getRiskPoints()} />;
}
