import { Profile } from "@/components/screens/Profile";
import { getUser, getMonthStats, getRides, getBadges, getFriends } from "@/lib/data";

export default async function PerfilPage() {
  const [user, stats, rides, b, friends] = await Promise.all([getUser(), getMonthStats(), getRides(), getBadges(), getFriends()]);
  return <Profile user={user} stats={stats} rides={rides} badges={b.badges} confirmedReports={b.confirmedReports} friendCount={friends.length} />;
}
