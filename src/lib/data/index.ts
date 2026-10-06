// Capa de acceso a datos. Hoy devuelve mocks; en fase 2/3 se reemplaza por Supabase y API Routes.
import { mockUser } from "@/mocks/user";
import { mockRoutes } from "@/mocks/routes";
import { mockReports, communityReports } from "@/mocks/reports";
import { mockRides, monthStats, communityRides } from "@/mocks/rides";
import { mockGroupRides } from "@/mocks/group-rides";
import { mockBadges, confirmedReports } from "@/mocks/badges";
import { riskPoints } from "@/mocks/risk-points";
import { friends, friendRequests, friendSuggestions, friendActivity } from "@/mocks/friends";
import { navSteps, navAlerts } from "@/mocks/navigation";
import { PLACES, HOME, UNIVERSITY, MONTERREY_CENTER } from "@/mocks/places";

const wait = <T,>(v: T) => Promise.resolve(v);

export const getUser = () => wait(mockUser);
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
export const getFriends = () => wait(friends);
export const getFriendRequests = () => wait(friendRequests);
export const getFriendSuggestions = () => wait(friendSuggestions);
export const getFriendActivity = () => wait(friendActivity);
export const getCommunityRides = () => wait(communityRides);
