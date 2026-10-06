import { RoutePlanner } from "@/components/screens/RoutePlanner";
import { getRoutes, getUsualRoute, getUser, getRiskPoints } from "@/lib/data";

export default async function RutasPage() {
  const [routes, usual, user, risk] = await Promise.all([getRoutes(), getUsualRoute(), getUser(), getRiskPoints()]);
  return <RoutePlanner routes={routes} origin={usual.origin} destination={usual.destination} maxExtraMinutes={user.maxExtraMinutes} risk={risk} />;
}
