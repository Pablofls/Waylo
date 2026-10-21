import type { GroupRide } from "@/types";
import { ME_ID } from "./people";

const base = ["Casco puesto", "Luces delantera y trasera", "Respeta los semáforos", "Lleva agua"];

export const mockGroupRides: GroupRide[] = [
  {
    id: "g_1", title: "Rodada nocturna Fundidora", description: "Salida tranquila por el Paseo Santa Lucía y el Parque Fundidora. Vamos juntos hasta el Museo del Acero, con paradas cortas para reagrupar. Ideal para quienes empiezan a rodar de noche.",
    date: "2026-10-24T20:00:00-06:00", meetingPoint: "Paseo Santa Lucía, Museo del Acero", meetingCoordinates: [-100.2845, 25.6786],
    level: "Principiante", pace: "Relajado", vehicle: "bicicleta", km: 18, organizerId: "p_3", attendeeIds: ["p_3", "p_1", "p_7", "p_11", "p_13", "p_5"], capacity: 40, privacy: "publica", rules: [...base, "Chaleco o ropa reflejante"], status: "programada",
  },
  {
    id: "g_2", title: "Sierra Madre al amanecer", description: "Ascenso por la Sierra Madre saliendo de La Pastora. Ritmo exigente con subidas largas; se requiere condición. Regreso por la misma ruta.",
    date: "2026-10-25T06:00:00-06:00", meetingPoint: "Parque La Pastora, Guadalupe", meetingCoordinates: [-100.2588, 25.6705],
    level: "Avanzado", pace: "Rápido", vehicle: "bicicleta", km: 52, organizerId: "p_4", attendeeIds: ["p_4", "p_8", "p_10", "p_12"], capacity: 25, privacy: "publica", rules: [...base, "Kit de reparación", "Bicicleta revisada"], status: "programada",
  },
  {
    id: "g_3", title: "Ciclovía Río Santa Catarina", description: "Recorremos la ciclovía del río de punta a punta. Ritmo moderado con una parada a la mitad.",
    date: "2026-10-26T19:30:00-06:00", meetingPoint: "Puente de la Unidad, Monterrey", meetingCoordinates: [-100.3015, 25.6738],
    level: "Intermedio", pace: "Moderado", vehicle: "ambos", km: 26, organizerId: "p_12", attendeeIds: ["p_12", "p_3", "p_2", "p_9", "p_11", "p_14", "p_6"], capacity: 60, privacy: "publica", rules: base, status: "programada",
  },
  {
    id: "g_4", title: "Rodada universitaria UDEM", description: "Rodada para estudiantes y personal de la UDEM. Salimos de la explanada y damos una vuelta por San Pedro; terminamos con café en el campus.",
    date: "2026-10-29T18:30:00-06:00", meetingPoint: "Explanada de la UDEM, San Pedro Garza García", meetingCoordinates: [-100.417, 25.6605],
    level: "Principiante", pace: "Relajado", vehicle: "ambos", km: 14, organizerId: "p_1", attendeeIds: ["p_1", ME_ID, "p_6", "p_13", "p_7", "p_8"], capacity: 80, privacy: "publica", rules: [...base, "Credencial UDEM opcional"], status: "programada",
  },
  {
    id: "g_5", title: "San Pedro Express", description: "Vuelta rápida por San Pedro con salida y llegada en Plaza Fiesta San Agustín.",
    date: "2026-11-01T07:00:00-06:00", meetingPoint: "Plaza Fiesta San Agustín, San Pedro Garza García", meetingCoordinates: [-100.3555, 25.6575],
    level: "Intermedio", pace: "Moderado", vehicle: "bicicleta", km: 32, organizerId: "p_2", attendeeIds: ["p_2", "p_8", "p_10"], privacy: "publica", rules: base, status: "programada",
  },
  {
    id: "g_6", title: "Cafecito en Valle Oriente", description: "Salida corta solo para amigos. Rodamos tranquilo y desayunamos en Valle Oriente.",
    date: "2026-11-03T08:00:00-06:00", meetingPoint: "Valle Oriente, Av. Lázaro Cárdenas", meetingCoordinates: [-100.3185, 25.6415],
    level: "Principiante", pace: "Relajado", vehicle: "bicicleta", km: 12, organizerId: ME_ID, attendeeIds: [ME_ID, "p_1", "p_3"], capacity: 12, privacy: "amigos", rules: ["Casco puesto", "Luces delantera y trasera"], status: "programada",
  },
  {
    id: "g_7", title: "Domingo familiar en Fundidora", description: "Paseo familiar de ritmo muy tranquilo dentro del parque.",
    date: "2026-10-12T09:00:00-06:00", meetingPoint: "Parque Fundidora, entrada Paseo Santa Lucía", meetingCoordinates: [-100.2855, 25.6795],
    level: "Principiante", pace: "Relajado", vehicle: "bicicleta", km: 8, organizerId: "p_7", attendeeIds: ["p_7", ME_ID, "p_1", "p_5", "p_13"], privacy: "publica", rules: base, status: "finalizada",
  },
  {
    id: "g_8", title: "Ruta nocturna por el Centro", description: "Recorrido nocturno por las calles del Centro con scooters y bicis.",
    date: "2026-10-10T21:00:00-06:00", meetingPoint: "Macroplaza, Centro de Monterrey", meetingCoordinates: [-100.3098, 25.67],
    level: "Intermedio", pace: "Moderado", vehicle: "ambos", km: 15, organizerId: "p_14", attendeeIds: ["p_14", "p_2", "p_10"], privacy: "publica", rules: base, status: "finalizada",
  },
];
