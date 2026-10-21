import { CompleteReport } from "@/components/screens/CompleteReport";
import { getMyReport } from "@/lib/data";

export default async function CompletarReportePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CompleteReport report={await getMyReport(id)} />;
}
