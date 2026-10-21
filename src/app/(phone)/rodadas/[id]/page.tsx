import { GroupRideDetail } from "@/components/screens/GroupRideDetail";

export default async function RodadaGrupalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GroupRideDetail id={id} />;
}
