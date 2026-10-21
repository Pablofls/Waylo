import { PhoneFrame } from "@/components/layout/PhoneFrame";
import { SocialProvider } from "@/lib/social";
import { getOptionalUser, getPeople, getGroupRides, getRides, getSavedPlaces, getNotifications, getSavedRoutes, getEmergencyContacts, getSearchHistory, getComments, getClubs, getPlaces } from "@/lib/data";

export default async function PhoneLayout({ children }: { children: React.ReactNode }) {
  const me = await getOptionalUser();
  // Pantallas públicas (login, registro, recuperar...): sin sesión no hay datos que cargar.
  if (!me) return <PhoneFrame>{children}</PhoneFrame>;
  const [publicPlaces, people, rides, myRides, savedPlaces, notifications, savedRoutes, emergencyContacts, searchHistory, comments, clubs] = await Promise.all([getPlaces(), getPeople(), getGroupRides(), getRides(), getSavedPlaces(), getNotifications(), getSavedRoutes(), getEmergencyContacts(), getSearchHistory(), getComments(), getClubs()]);
  return (
    <PhoneFrame>
      <SocialProvider me={me} people={people} rides={rides} myRides={myRides} savedPlaces={savedPlaces} notifications={notifications} savedRoutes={savedRoutes} emergencyContacts={emergencyContacts} searchHistory={searchHistory} comments={comments} clubs={clubs} publicPlaces={publicPlaces}>
        {children}
      </SocialProvider>
    </PhoneFrame>
  );
}
