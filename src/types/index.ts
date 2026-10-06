export type LngLat = [number, number];

export type Vehicle = "bicicleta" | "scooter" | "ambos";
export type MainUse = "transporte" | "recreativo";

export interface User {
  id: string;
  name: string;
  age: number;
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
  confirmations: number;
  timeline: { status: ReportStatus; at: string; text: string }[];
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

export interface GroupRide {
  id: string;
  title: string;
  date: string;
  meetingPoint: string;
  level: "Principiante" | "Intermedio" | "Avanzado";
  km: number;
  attendees: number;
  organizer: string;
}

export interface BadgeInfo {
  id: string;
  name: string;
  description: string;
  progress: number;
  goal: number;
  earned: boolean;
}

export interface RiskPointProps {
  weight: number;
}
