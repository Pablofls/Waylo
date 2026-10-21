import { ClubDetail } from "@/components/screens/ClubDetail";

export default async function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClubDetail id={id} />;
}
