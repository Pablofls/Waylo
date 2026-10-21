// Capa de acceso a datos para páginas de servidor: toma la persona de la sesión y delega en src/server/*.
// Lo que aún dice "mock" se migra por áreas (ver README).
import "server-only";
import { redirect } from "next/navigation";
import { currentUserId } from "@/server/session";
import { getUserById } from "@/server/cuenta";
import { mockRoutes } from "@/mocks/routes";
import { mockReports, communityReports } from "@/mocks/reports";
import { mockRides, monthStats, communityRides } from "@/mocks/rides";
import { mockGroupRides } from "@/mocks/group-rides";
import { mockBadges, confirmedReports } from "@/mocks/badges";
import { riskPoints } from "@/mocks/risk-points";
import { people, friendActivity } from "@/mocks/people";
import { navSteps, navAlerts } from "@/mocks/navigation";
import { clubs, challenges } from "@/mocks/clubs";
import { comments } from "@/mocks/comments";
import { zones } from "@/mocks/zones";
import { emergencyContacts, savedRoutes } from "@/mocks/emergency";
import { savedPlaces } from "@/mocks/saved-places";
import { notifications } from "@/mocks/notifications";
import { SEARCH_HISTORY, PLACES, HOME, UNIVERSITY, MONTERREY_CENTER } from "@/mocks/places";

const wait = <T,>(v: T) => Promise.resolve(v);

/** Id de la persona con sesión; si no hay, manda a iniciar sesión. */
export async function sessionUserId(): Promise<string> {
  const id = await currentUserId();
  if (!id) redirect("/api/auth/sesion-invalida");
  return id;
}

export async function getOptionalUser() {
  const id = await currentUserId();
  return id ? getUserById(id) : null;
}

export async function getUser() {
  const u = await getOptionalUser();
  if (!u) redirect("/api/auth/sesion-invalida");
  return u;
}
export const getRoutes = () => wait(mockRoutes);
export const getRoute = (id: string) => wait(mockRoutes.find((r) => r.id === id) ?? null);
export const getUsualRoute = () => wait({ origin: HOME, destination: UNIVERSITY, route: mockRoutes.find((r) => r.id === "segura")!, newAlerts: 2 });
export const getMyReports = () => wait(mockReports);
export const getMyReport = (id: string) => wait(mockReports.find((r) => r.id === id) ?? null);
export const getCommunityReports = () => wait(communityReports);
export const getRecentReports = () => wait([...mockReports, ...communityReports]);
export const getRides = () => wait(mockRides);
export const getMonthStats = () => wait(monthStats);
export const getGroupRides = () => wait(mockGroupRides);
export const getBadges = () => wait({ badges: mockBadges, confirmedReports });
export const getRiskPoints = () => wait(riskPoints);
export const getPlaces = () => wait(PLACES);
export const getMapCenter = () => MONTERREY_CENTER;
export const getNavigation = (_routeId: string) => wait({ steps: navSteps, alerts: navAlerts });
export const getFriendActivity = () => wait(friendActivity);
export const getCommunityRides = () => wait(communityRides);
export const getPeople = () => wait(people);
export const getPerson = (id: string) => wait(people.find((p) => p.id === id) ?? null);
export const getPersonActivity = (id: string) => wait(friendActivity.filter((a) => a.friendId === id));
export const getSavedPlaces = () => wait(savedPlaces);
export const getNotifications = () => wait(notifications);
export const getAnyReport = (id: string) => wait([...mockReports, ...communityReports].find((r) => r.id === id) ?? null);
export const getEmergencyContacts = () => wait(emergencyContacts);
export const getSavedRoutes = () => wait(savedRoutes);
export const getClubs = () => wait(clubs);
export const getChallenges = () => wait(challenges);
export const getComments = () => wait(comments);
export const getSearchHistory = () => wait(SEARCH_HISTORY);
export const getZones = () => wait(zones);
export const getZone = (id: string) => wait(zones.find((z) => z.id === id) ?? null);
