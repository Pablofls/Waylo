import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Friends } from "@/components/screens/Friends";
import { getFriends, getFriendRequests, getFriendSuggestions } from "@/lib/data";

export default async function AmigosPage() {
  const [friends, requests, suggestions] = await Promise.all([getFriends(), getFriendRequests(), getFriendSuggestions()]);
  return (
    <>
      <ScreenHeader title="Amigos" subtitle="Sigue la actividad de quienes ruedan contigo" back="/inicio" />
      <Friends friends={friends} requests={requests} suggestions={suggestions} />
    </>
  );
}
