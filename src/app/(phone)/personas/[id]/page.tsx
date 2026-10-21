import { PersonProfile } from "@/components/screens/PersonProfile";
import { getPersonActivity, getBadges } from "@/lib/data";

export default async function PersonaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [activity, b] = await Promise.all([getPersonActivity(id), getBadges()]);
  return <PersonProfile id={id} activity={activity} allBadges={b.badges} />;
}
