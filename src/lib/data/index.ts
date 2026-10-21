// Capa de acceso a datos para páginas de servidor: toma la persona de la sesión y delega en src/server/*.
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { currentUserId } from "@/server/session";
import { getUserById } from "@/server/cuenta";
import { historialBusqueda, lugarVisible, lugaresGuardados, lugaresPublicos } from "@/server/lugares";
import { navegacion, opcionPorId, rutasGuardadas, trayectoHabitual } from "@/server/rutas";
import { misReportes, miReporte, misVotos, reportesComunidad, reporteVisible } from "@/server/reportes";
import { misAjustes, municipios } from "@/server/ajustes";
import { actividadAmigos, actividadComunidad, misBloqueados, misReacciones, persona, personasConocidas, publicacion, sugerencias } from "@/server/social";
import { rodadasGrupales } from "@/server/grupales";
import { clubes } from "@/server/clubes";
import { misInsignias, rankingAmigos, retos } from "@/server/logros";
import { notificaciones } from "@/server/notificaciones";
import { configCaidas, misContactos } from "@/server/seguridad";
import { areasMapa, miComparticion, misMapas, quienComparteConmigo } from "@/server/mapas";
import { miPago, misPagos, miSuscripcion, precioPlan } from "@/server/premium";
import { zona, zonas } from "@/server/zonas";
import { puntosDeRiesgo } from "@/server/riesgo";
import { estadisticaMes, misRodadas, miRodada, resumenRodada } from "@/server/rodadas";

// Una sola consulta de sesión por petición, aunque el layout y la página pidan muchos datos.
const currentUser = cache(() => currentUserId());

/** Id de la persona con sesión; si no hay, manda a iniciar sesión. */
export async function sessionUserId(): Promise<string> {
  const id = await currentUser();
  if (!id) redirect("/api/auth/sesion-invalida");
  return id;
}

export async function getOptionalUser() {
  const id = await currentUser();
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

export const getMyReports = async () => misReportes(await sessionUserId());
export const getMyReport = async (id: string) => miReporte(await sessionUserId(), id);
export const getCommunityReports = async () => reportesComunidad(await sessionUserId());
export const getAnyReport = async (id: string) => reporteVisible(await sessionUserId(), id);
export const getMyVotes = async () => misVotos(await sessionUserId());
export async function getRecentReports() {
  const uid = await sessionUserId();
  const [mine, community] = await Promise.all([misReportes(uid), reportesComunidad(uid)]);
  return [...mine, ...community];
}

export const getPeople = async () => personasConocidas(await sessionUserId());
export const getPerson = async (id: string) => persona(await sessionUserId(), id);
export const getSuggestions = async () => sugerencias(await sessionUserId());
export const getBlocked = async () => misBloqueados(await sessionUserId());
export const getMyKudos = async () => misReacciones(await sessionUserId());
export const getSettings = async () => misAjustes(await sessionUserId());
export const getMunicipalities = () => municipios();
export const getFriendActivity = async () => actividadAmigos(await sessionUserId());
export const getCommunityRides = async () => actividadComunidad(await sessionUserId());
export const getPersonActivity = async (id: string) => actividadAmigos(await sessionUserId(), id);
export const getPost = async (id: string) => publicacion(await sessionUserId(), id);

export const getGroupRides = async () => rodadasGrupales(await sessionUserId());
export const getClubs = async () => clubes(await sessionUserId());

export const getBadges = async () => misInsignias(await sessionUserId());
export const getChallenges = async () => retos(await sessionUserId());
export const getRanking = async () => rankingAmigos(await sessionUserId());
export const getNotifications = async () => notificaciones(await sessionUserId());
export const getEmergencyContacts = async () => misContactos(await sessionUserId());
export const getFallConfig = async () => configCaidas(await sessionUserId());
export const getSubscription = async () => miSuscripcion(await sessionUserId());
export const getPayments = async () => misPagos(await sessionUserId());
export const getPayment = async (folio: string) => miPago(await sessionUserId(), folio);
export const getPlan = () => precioPlan();
export const getOfflineAreas = () => areasMapa();
export const getMyOfflineMaps = async () => misMapas(await sessionUserId());
export const getLiveShare = async () => miComparticion(await sessionUserId());
export const getSharers = async () => quienComparteConmigo(await sessionUserId());
export const getZones = () => zonas();
export const getZone = (id: string) => zona(id);

export async function getUser() {
  const u = await getOptionalUser();
  if (!u) redirect("/api/auth/sesion-invalida");
  return u;
}
