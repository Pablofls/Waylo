import { MapHome } from "@/components/screens/MapHome";
import { getRiskPoints, getRecentReports, getUsualRoute } from "@/lib/data";

export default async function MapaPage() {
  const [risk, reports, usual] = await Promise.all([getRiskPoints(), getRecentReports(), getUsualRoute()]);
  return <MapHome risk={risk} reports={reports} usual={usual} />;
}
