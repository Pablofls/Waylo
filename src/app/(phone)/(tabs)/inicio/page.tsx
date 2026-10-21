import { Home } from "@/components/screens/Home";
import { getUser, getUsualRoute, getRides, getCommunityRides, getFriendActivity } from "@/lib/data";

export default async function InicioPage() {
  const [user, usual, rides, community, activity] = await Promise.all([getUser(), getUsualRoute(), getRides(), getCommunityRides(), getFriendActivity()]);
  return <Home user={user} usual={usual} rides={rides} communityRides={community} activity={activity} />;
}
