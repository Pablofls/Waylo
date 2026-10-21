import { PostDetail } from "@/components/screens/PostDetail";
import { getFriendActivity, getCommunityRides } from "@/lib/data";

export default async function PublicacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [activity, community] = await Promise.all([getFriendActivity(), getCommunityRides()]);
  const a = activity.find((x) => x.id === id);
  const c = community.find((x) => x.id === id);
  const post = a
    ? { id, personId: a.friendId, name: "", title: a.title, km: a.km, minutes: a.minutes, safetyScore: a.safetyScore, at: a.at, vehicle: a.vehicle }
    : c
      ? { id, personId: c.personId, name: c.person, title: c.title, km: c.km, minutes: c.minutes, safetyScore: c.safetyScore, at: c.at, vehicle: undefined }
      : null;
  return <PostDetail post={post} />;
}
