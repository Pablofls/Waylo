import type { BadgeInfo } from "@/types";

export const mockBadges: BadgeInfo[] = [
  { id: "b_1", name: "Primer reporte", description: "Enviaste tu primer reporte.", progress: 1, goal: 1, earned: true },
  { id: "b_2", name: "Ojo de barrio", description: "10 reportes confirmados por la comunidad.", progress: 10, goal: 10, earned: true },
  { id: "b_3", name: "Vigía nocturno", description: "5 reportes de iluminación.", progress: 3, goal: 5, earned: false },
  { id: "b_4", name: "Calle atendida", description: "3 reportes atendidos por el municipio.", progress: 2, goal: 3, earned: false },
];

export const confirmedReports = 14;
