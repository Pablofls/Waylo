import { PersonProfile } from "@/components/screens/PersonProfile";
import { getPersonActivity, getBadges, getPerson } from "@/lib/data";

export default async function PersonaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [activity, b, person] = await Promise.all([getPersonActivity(id), getBadges(), getPerson(id)]);
  return <PersonProfile id={id} person={person} activity={activity} allBadges={b.badges} />;
}
