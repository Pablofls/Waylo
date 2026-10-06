import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { MyReports } from "@/components/screens/MyReports";
import { getMyReports } from "@/lib/data";

export default async function ReportesPage() {
  const reports = await getMyReports();
  return (
    <>
      <ScreenHeader title="Mis reportes" subtitle={`${reports.length} reportes enviados`} back="/perfil" />
      <MyReports reports={reports} />
    </>
  );
}
