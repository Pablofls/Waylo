export type LngLat = [number, number];

export type Vehicle = "bicicleta" | "scooter" | "ambos";
export type MainUse = "transporte" | "recreativo";

export interface User {
  id: string;
  name: string;
  age?: number;
  occupation: string;
  city: string;
  email: string;
  vehicle: Vehicle;
  mainUse: MainUse;
  /** 0 = más rápida, 100 = más segura */
  routePreference: number;
  maxExtraMinutes: number;
  notifications: { alertas: boolean; municipio: boolean; rodadas: boolean };
  memberSince: string;
  bio?: string;
}

export type RiskKey = "trafico" | "robo" | "iluminacion" | "pavimento" | "ciclovia";

export interface RiskFactor {
  key: RiskKey;
  label: string;
  /** 0-100, mayor es mejor */
  score: number;
  explanation: string;
}

export type RouteKind = "rapida" | "segura" | "equilibrada";

export interface RouteOption {
  id: RouteKind;
  /** Id de la opción en la base (para guardar la rodada y abrir el desglose). */
  optionId?: string;
  label: string;
  minutes: number;
  km: number;
  safetyScore: number;
  extraMinutes: number;
  via: string;
  coordinates: LngLat[];
  factors: RiskFactor[];
  summary: string;
}

export interface Place {
  /** Id del lugar en la base; los lugares escritos a mano no lo tienen. */
  id?: string;
  name: string;
  detail: string;
  coordinates: LngLat;
}

export type ReportCategory =
  | "bache"
  | "accidente"
  | "calle_cerrada"
  | "alta_velocidad"
  | "conductor_agresivo"
  | "poca_iluminacion"
  | "robo";

export type ReportStatus = "enviado" | "en_revision" | "atendido";

export interface Report {
  id: string;
  category: ReportCategory;
  coordinates: LngLat;
  street: string;
  colonia: string;
  createdAt: string;
  status: ReportStatus;
  note?: string;
  pendingDetails?: boolean;
  /** Personas que dijeron "sigue ahí" (incluye tu voto si lo diste). */
  confirmations: number;
  timeline: { status: ReportStatus; at: string; text: string }[];
  /** Es un reporte tuyo. */
  mine?: boolean;
  /** Tu respuesta a "¿sigue ahí?" según el servidor. */
  myVote?: "sigue" | "resuelto";
  /** Detalles que ya completaste (gravedad, descripción, referencia y si tiene foto). */
  completion?: ReportCompletion;
  hasPhoto?: boolean;
}

export interface Ride {
  id: string;
  title: string;
  startedAt: string;
  km: number;
  minutes: number;
  avgSpeed: number;
  avgSafetyScore: number;
  coordinates: LngLat[];
}

export interface BadgeInfo {
  id: string;
  name: string;
  description: string;
  progress: number;
  goal: number;
  earned: boolean;
  howTo?: string;
}

export interface RiskPointProps {
  weight: number;
}

export interface FriendActivity {
  id: string;
  friendId: string;
  title: string;
  km: number;
  minutes: number;
  safetyScore: number;
  at: string;
  vehicle: "bicicleta" | "scooter";
  /** Reacciones totales (incluye la tuya) y comentarios. */
  kudos?: number;
  comments?: number;
  gaveKudo?: boolean;
}

export interface CommunityRide {
  id: string;
  personId: string;
  person: string;
  title: string;
  km: number;
  minutes: number;
  safetyScore: number;
  at: string;
  zone: string;
  kudos?: number;
  comments?: number;
  gaveKudo?: boolean;
}

export type Relation = "amigo" | "solicitud_recibida" | "solicitud_enviada" | "ninguna";

export interface Person {
  id: string;
  name: string;
  email: string;
  city: string;
  vehicle: Vehicle;
  bio: string;
  memberSince: string;
  stats: { rides: number; km: number; avgSafetyScore: number };
  badgeIds: string[];
  relation: Relation;
  /** Amigos en común con el usuario. */
  mutual: number;
}

export type RideLevel = "Principiante" | "Intermedio" | "Avanzado";
export type RidePace = "Relajado" | "Moderado" | "Rápido";
export type RidePrivacy = "publica" | "amigos";

/** Rodada grupal: una cita con hora y punto de salida; cada quien registra su rodada individual. */
export interface GroupRide {
  id: string;
  title: string;
  description: string;
  /** ISO con offset de Monterrey, p. ej. 2026-10-24T20:00:00-06:00 */
  date: string;
  meetingPoint: string;
  /** Id del lugar de salida (siempre un lugar público). */
  meetingPlaceId?: string;
  meetingCoordinates: LngLat;
  level: RideLevel;
  pace: RidePace;
  vehicle: Vehicle;
  km: number;
  organizerId: string;
  /** Asistentes cuyo perfil puedes ver (puede haber más: usa `attendeeCount`). */
  attendeeIds: string[];
  attendeeCount: number;
  capacity?: number;
  privacy: RidePrivacy;
  rules: string[];
  status: "programada" | "cancelada" | "finalizada";
}

export type RideDraft = Omit<GroupRide, "id" | "organizerId" | "attendeeIds" | "attendeeCount" | "status">;

export interface SavedPlace {
  id: string;
  label: string;
  kind: "casa" | "escuela" | "trabajo" | "favorito";
  place: Place;
}

export type NotificationKind = "alerta" | "reporte" | "amistad" | "rodada";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  text: string;
  at: string;
  href: string;
  read: boolean;
}

export interface ReportCompletion {
  severity: "leve" | "moderada" | "grave";
  note: string;
  street: string;
  hasPhoto: boolean;
}

export interface SavedRoute {
  id: string;
  name: string;
  fromName: string;
  toName: string;
  destination: LngLat;
  /** Id del lugar de destino (para abrir sus rutas en el mapa). */
  destinationId?: string;
  routeId: RouteKind;
  minutes: number;
  safetyScore: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface Subscription {
  active: boolean;
  /** Fecha de fin cuando ya se canceló pero sigue vigente. */
  until?: string;
  cancelled?: boolean;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  zone: string;
  privacy: "publico" | "privado";
  ownerId: string;
  /** Miembros cuyo perfil puedes ver (en clubes privados, solo si eres miembro). */
  memberIds: string[];
  memberCount: number;
  rideIds: string[];
  /** Ya enviaste tu solicitud de ingreso (club privado). */
  requested?: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  metric: "km" | "rodadas" | "reportes" | "score";
  goal: number;
  progress: number;
  daysLeft: number;
  reward: string;
  participants: number;
}

export interface ActivityComment {
  id: string;
  activityId: string;
  personId: string;
  text: string;
  at: string;
}

export interface Zone {
  id: string;
  name: string;
  detail: string;
  coordinates: LngLat;
  score: number;
  /** Cambio del Safety Score contra el mes anterior. */
  trend: number;
  /** Safety Score promedio de los últimos 6 meses (de más antiguo a más reciente). */
  monthly: number[];
  months: string[];
  reportsByType: { category: ReportCategory; count: number }[];
  /** Riesgo 0-100 por franja horaria. */
  hourly: { label: string; risk: number }[];
  summary: string;
}

// Navegación guiada ----------------------------------------------------------------
export type TurnType = "recto" | "izquierda" | "derecha" | "llegada";

export interface NavStep {
  /** Fracción del recorrido (0-1) donde ocurre la maniobra. */
  at: number;
  turn: TurnType;
  text: string;
}

export interface NavAlert {
  from: number;
  to: number;
  title: string;
  text: string;
  tone: "orange" | "red";
}
