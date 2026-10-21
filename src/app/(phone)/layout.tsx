import { PhoneFrame } from "@/components/layout/PhoneFrame";
import { SocialProvider } from "@/lib/social";
import { getOptionalUser, getPeople, getGroupRides, getRides, getSavedPlaces, getNotifications, getSavedRoutes, getEmergencyContacts, getSearchHistory, getClubs, getPlaces, getMyVotes, getSuggestions, getBlocked, getMyKudos, getSettings, getMunicipalities } from "@/lib/data";

export default async function PhoneLayout({ children }: { children: React.ReactNode }) {
  const me = await getOptionalUser();
  // Pantallas públicas (login, registro, recuperar...): sin sesión no hay datos que cargar.
  if (!me) return <PhoneFrame>{children}</PhoneFrame>;
  const [confirmations, publicPlaces, people, suggestions, blocked, kudos, settings, municipalities, rides, myRides, savedPlaces, notifications, savedRoutes, emergencyContacts, searchHistory, clubs] = await Promise.all([
    getMyVotes(), getPlaces(), getPeople(), getSuggestions(), getBlocked(), getMyKudos(), getSettings(), getMunicipalities(),
    getGroupRides(), getRides(), getSavedPlaces(), getNotifications(), getSavedRoutes(), getEmergencyContacts(), getSearchHistory(), getClubs(),
  ]);
  return (
    <PhoneFrame>
      <SocialProvider me={me} people={people} rides={rides} myRides={myRides} savedPlaces={savedPlaces} notifications={notifications} savedRoutes={savedRoutes} emergencyContacts={emergencyContacts} searchHistory={searchHistory} clubs={clubs} publicPlaces={publicPlaces} confirmations={confirmations} suggestions={suggestions} blocked={blocked} kudos={kudos} settings={settings} municipalities={municipalities}>
        {children}
      </SocialProvider>
    </PhoneFrame>
  );
}
