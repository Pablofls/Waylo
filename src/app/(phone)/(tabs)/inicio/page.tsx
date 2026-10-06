import { Home } from "@/components/screens/Home";
import { getUser, getUsualRoute, getRides, getCommunityRides, getFriends, getFriendActivity } from "@/lib/data";

export default async function InicioPage() {
  const [user, usual, rides, community, friends, activity] = await Promise.all([getUser(), getUsualRoute(), getRides(), getCommunityRides(), getFriends(), getFriendActivity()]);
  return <Home user={user} usual={usual} rides={rides} communityRides={community} friends={friends} activity={activity} />;
}
