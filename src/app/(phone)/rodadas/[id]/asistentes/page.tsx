import { RideAttendees } from "@/components/screens/RideAttendees";

export default async function AsistentesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RideAttendees id={id} />;
}
