import { Community } from "@/components/screens/Community";
import { getCommunityReports, getGroupRides } from "@/lib/data";

export default async function ComunidadPage() {
  const [reports, rides] = await Promise.all([getCommunityReports(), getGroupRides()]);
  return <Community reports={reports} rides={rides} />;
}
