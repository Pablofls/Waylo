import { OfflineMaps } from "@/components/screens/OfflineMaps";
import { getOfflineAreas } from "@/lib/data";

export default async function MapasSinConexionPage() {
  return <OfflineMaps areas={await getOfflineAreas()} />;
}
