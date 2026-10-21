import type { BadgeInfo } from "@/types";

export const mockBadges: BadgeInfo[] = [
  { id: "b_1", name: "Primer reporte", description: "Enviaste tu primer reporte.", howTo: "Envía un reporte de cualquier tipo desde una rodada o desde el mapa.", progress: 1, goal: 1, earned: true },
  { id: "b_2", name: "Ojo de barrio", description: "10 reportes confirmados por la comunidad.", howTo: "Consigue que otras personas confirmen 10 de tus reportes con \"Sigue ahí\".", progress: 10, goal: 10, earned: true },
  { id: "b_3", name: "Vigía nocturno", description: "5 reportes de iluminación.", howTo: "Envía 5 reportes de poca iluminación, de preferencia al caer la noche.", progress: 3, goal: 5, earned: false },
  { id: "b_4", name: "Calle atendida", description: "3 reportes atendidos por el municipio.", howTo: "Logra que el municipio marque como Atendidos 3 de tus reportes.", progress: 2, goal: 3, earned: false },
  { id: "b_5", name: "Rodada compartida", description: "Asiste a 3 rodadas grupales.", howTo: "Únete a una rodada grupal y rueda con la comunidad. Cuenta cuando termina.", progress: 1, goal: 3, earned: false },
  { id: "b_6", name: "Ruta segura", description: "10 rodadas con Safety Score de 80 o más.", howTo: "Completa 10 rodadas cuyo Safety Score promedio sea de 80 o más.", progress: 6, goal: 10, earned: false },
  { id: "b_7", name: "Constante", description: "Rueda 4 semanas seguidas.", howTo: "Registra al menos una rodada cada semana durante 4 semanas.", progress: 4, goal: 4, earned: true },
  { id: "b_8", name: "Anfitrión", description: "Organiza una rodada grupal.", howTo: "Crea una rodada desde Comunidad y publícala.", progress: 0, goal: 1, earned: false },
];

export const confirmedReports = 14;
