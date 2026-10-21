import { PhoneFrame } from "@/components/layout/PhoneFrame";
import { SocialProvider } from "@/lib/social";
import { getUser, getPeople, getGroupRides, getRides, getSavedPlaces, getNotifications, getSavedRoutes, getEmergencyContacts, getSearchHistory, getComments, getClubs } from "@/lib/data";

export default async function PhoneLayout({ children }: { children: React.ReactNode }) {
  const [me, people, rides, myRides, savedPlaces, notifications, savedRoutes, emergencyContacts, searchHistory, comments, clubs] = await Promise.all([getUser(), getPeople(), getGroupRides(), getRides(), getSavedPlaces(), getNotifications(), getSavedRoutes(), getEmergencyContacts(), getSearchHistory(), getComments(), getClubs()]);
  return (
    <PhoneFrame>
      <SocialProvider me={me} people={people} rides={rides} myRides={myRides} savedPlaces={savedPlaces} notifications={notifications} savedRoutes={savedRoutes} emergencyContacts={emergencyContacts} searchHistory={searchHistory} comments={comments} clubs={clubs}>
        {children}
      </SocialProvider>
    </PhoneFrame>
  );
}
