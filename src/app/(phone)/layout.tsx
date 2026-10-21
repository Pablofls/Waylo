import { PhoneFrame } from "@/components/layout/PhoneFrame";
import { SocialProvider } from "@/lib/social";
import { getUser, getPeople, getGroupRides } from "@/lib/data";

export default async function PhoneLayout({ children }: { children: React.ReactNode }) {
  const [me, people, rides] = await Promise.all([getUser(), getPeople(), getGroupRides()]);
  return (
    <PhoneFrame>
      <SocialProvider me={me} people={people} rides={rides}>
        {children}
      </SocialProvider>
    </PhoneFrame>
  );
}
