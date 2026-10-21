import { Profile } from "@/components/screens/Profile";
import { getUser, getMonthStats, getRides, getBadges } from "@/lib/data";

export default async function PerfilPage() {
  const [user, stats, rides, b] = await Promise.all([getUser(), getMonthStats(), getRides(), getBadges()]);
  return <Profile user={user} stats={stats} rides={rides} badges={b.badges} confirmedReports={b.confirmedReports} />;
}
