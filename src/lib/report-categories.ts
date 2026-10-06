import { Construction, Siren, Ban, Gauge, CarFront, LightbulbOff, ShieldAlert, type LucideIcon } from "lucide-react";
import type { ReportCategory, ReportStatus } from "@/types";

export const reportCategories: { id: ReportCategory; label: string; icon: LucideIcon }[] = [
  { id: "bache", label: "Bache u obra", icon: Construction },
  { id: "accidente", label: "Accidente", icon: Siren },
  { id: "calle_cerrada", label: "Calle cerrada", icon: Ban },
  { id: "alta_velocidad", label: "Autos a alta velocidad", icon: Gauge },
  { id: "conductor_agresivo", label: "Conductor agresivo", icon: CarFront },
  { id: "poca_iluminacion", label: "Poca iluminación", icon: LightbulbOff },
  { id: "robo", label: "Robo o asalto", icon: ShieldAlert },
];

export const categoryById = (id: ReportCategory) => reportCategories.find((c) => c.id === id)!;

export const statusLabels: Record<ReportStatus, string> = {
  enviado: "Enviado",
  en_revision: "En revisión por el municipio",
  atendido: "Atendido",
};
