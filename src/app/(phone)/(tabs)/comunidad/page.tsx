import { Community } from "@/components/screens/Community";
import { getCommunityReports } from "@/lib/data";

export default async function ComunidadPage() {
  return <Community reports={await getCommunityReports()} />;
}
