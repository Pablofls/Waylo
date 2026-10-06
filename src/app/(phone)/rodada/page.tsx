import { LiveRide } from "@/components/screens/LiveRide";
import { getNavigation, getRoute, getRoutes, getRiskPoints } from "@/lib/data";

export default async function RodadaPage({ searchParams }: { searchParams: Promise<{ ruta?: string }> }) {
  const { ruta } = await searchParams;
  const route = (await getRoute(ruta ?? "segura")) ?? (await getRoutes())[0];
  const nav = await getNavigation(route.id);
  return <LiveRide route={route} steps={nav.steps} alerts={nav.alerts} risk={await getRiskPoints()} />;
}
