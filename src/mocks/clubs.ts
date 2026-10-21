import type { Challenge, Club } from "@/types";
import { ME_ID } from "./people";

export const clubs: Club[] = [
  { id: "c_1", name: "UDEM en Bici", description: "Comunidad de estudiantes, maestros y personal de la UDEM que van en bici o scooter al campus. Organizamos rodadas semanales y compartimos rutas seguras.", zone: "San Pedro Garza García", privacy: "publico", ownerId: "p_1", memberIds: ["p_1", ME_ID, "p_6", "p_13", "p_7", "p_8"], rideIds: ["g_4"] },
  { id: "c_2", name: "Rodada Nocturna MTY", description: "Rodadas de noche por Fundidora, el Centro y el río. Todos los niveles, siempre con luces y chaleco.", zone: "Monterrey", privacy: "publico", ownerId: "p_3", memberIds: ["p_3", "p_1", "p_11", "p_13", "p_5", "p_14"], rideIds: ["g_1", "g_8"] },
  { id: "c_3", name: "Pedaleando Sierra", description: "Ruta de montaña y carretera hacia la Sierra Madre. Nivel intermedio y avanzado.", zone: "Guadalupe", privacy: "publico", ownerId: "p_4", memberIds: ["p_4", "p_8", "p_10", "p_12"], rideIds: ["g_2"] },
  { id: "c_4", name: "Bici Urbana Monterrey", description: "Ciclismo urbano y movilidad: rodadas por la ciclovía del Río Santa Catarina y propuestas para el municipio.", zone: "Monterrey", privacy: "publico", ownerId: "p_12", memberIds: ["p_12", "p_3", "p_2", "p_9", "p_11"], rideIds: ["g_3"] },
  { id: "c_5", name: "Scooters del Valle", description: "Usuarios de scooter eléctrico en San Pedro y Santa Catarina. Tips de seguridad y recarga.", zone: "San Pedro Garza García", privacy: "privado", ownerId: "p_9", memberIds: ["p_9", "p_2", "p_14"], rideIds: [] },
];

export const challenges: Challenge[] = [
  { id: "ch_1", title: "50 km en octubre", description: "Recorre 50 km con Waylo durante el mes.", metric: "km", goal: 50, progress: 54.6, daysLeft: 11, reward: "Insignia Constante", participants: 312 },
  { id: "ch_2", title: "Rodadas seguras", description: "Completa 5 rodadas con Safety Score de 80 o más.", metric: "score", goal: 5, progress: 3, daysLeft: 11, reward: "Insignia Ruta segura", participants: 187 },
  { id: "ch_3", title: "Ojo de la comunidad", description: "Envía 3 reportes confirmados por otras personas.", metric: "reportes", goal: 3, progress: 1, daysLeft: 11, reward: "Insignia Ojo de barrio", participants: 94 },
  { id: "ch_4", title: "Rueda en grupo", description: "Asiste a 2 rodadas grupales este mes.", metric: "rodadas", goal: 2, progress: 0, daysLeft: 11, reward: "Insignia Rodada compartida", participants: 141 },
];
