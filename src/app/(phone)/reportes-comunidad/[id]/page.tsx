import { CommunityReportDetail } from "@/components/screens/CommunityReportDetail";
import { getAnyReport } from "@/lib/data";

export default async function ReporteComunidadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CommunityReportDetail report={await getAnyReport(id)} mine={false} />;
}
