// Capa de acceso a datos para páginas de servidor: toma la persona de la sesión y delega en src/server/*.
// Lo que aún dice "mock" se migra por áreas (ver README).
import "server-only";
import { redirect } from "next/navigation";
import { currentUserId } from "@/server/session";
import { getUserById } from "@/server/cuenta";
import { historialBusqueda, lugarVisible, lugaresGuardados, lugaresPublicos } from "@/server/lugares";
import { navegacion, opcionPorId, rutasGuardadas, trayectoHabitual } from "@/server/rutas";
import { puntosDeRiesgo } from "@/server/riesgo";
import { estadisticaMes, misRodadas, miRodada, resumenRodada } from "@/server/rodadas";
import { mockReports, communityReports } from "@/mocks/reports";
import { mockRides, monthStats, communityRides } from "@/mocks/rides";
import { mockGroupRides } from "@/mocks/group-rides";
import { mockBadges, confirmedReports } from "@/mocks/badges";
import { riskPoints } from "@/mocks/risk-points";
import { people, friendActivity } from "@/mocks/people";
import { clubs, challenges } from "@/mocks/clubs";
import { comments } from "@/mocks/comments";
import { zones } from "@/mocks/zones";
import { emergencyContacts } from "@/mocks/emergency";
import { notifications } from "@/mocks/notifications";

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

export const getPlaces = () => lugaresPublicos();
export const getPlaceById = async (id: string) => (id ? lugarVisible(await sessionUserId(), id).catch(() => null) : null);
export const getSavedPlaces = async () => lugaresGuardados(await sessionUserId());
export const getSavedRoutes = async () => rutasGuardadas(await sessionUserId());
export const getSearchHistory = async () => historialBusqueda(await sessionUserId());
export const getRiskPoints = () => puntosDeRiesgo();
export const getRoute = async (id: string) => opcionPorId(await sessionUserId(), id);
export const getNavigation = async (routeId: string) => navegacion(await sessionUserId(), routeId);
export const getUsualRoute = async () => trayectoHabitual(await sessionUserId());

export const getRides = async () => misRodadas(await sessionUserId());
export const getRide = async (id: string) => miRodada(await sessionUserId(), id);
export const getMonthStats = async () => estadisticaMes(await sessionUserId());
export const getRideSummary = async (id: string) => resumenRodada(await sessionUserId(), id);

export async function getUser() {
  const u = await getOptionalUser();
  if (!u) redirect("/api/auth/sesion-invalida");
  return u;
}
export const getMyReports = () => wait(mockReports);
export const getMyReport = (id: string) => wait(mockReports.find((r) => r.id === id) ?? null);
export const getCommunityReports = () => wait(communityReports);
export const getRecentReports = () => wait([...mockReports, ...communityReports]);
export const getGroupRides = () => wait(mockGroupRides);
export const getBadges = () => wait({ badges: mockBadges, confirmedReports });
export const getFriendActivity = () => wait(friendActivity);
export const getCommunityRides = () => wait(communityRides);
export const getPeople = () => wait(people);
export const getPerson = (id: string) => wait(people.find((p) => p.id === id) ?? null);
export const getPersonActivity = (id: string) => wait(friendActivity.filter((a) => a.friendId === id));
export const getNotifications = () => wait(notifications);
export const getAnyReport = (id: string) => wait([...mockReports, ...communityReports].find((r) => r.id === id) ?? null);
export const getEmergencyContacts = () => wait(emergencyContacts);
export const getClubs = () => wait(clubs);
export const getChallenges = () => wait(challenges);
export const getComments = () => wait(comments);
export const getZones = () => wait(zones);
export const getZone = (id: string) => wait(zones.find((z) => z.id === id) ?? null);
