import type { FriendActivity, Person } from "@/types";

/** Id del usuario de ejemplo (Daniela Garza). */
export const ME_ID = "u_001";

export const people: Person[] = [
  { id: "p_1", name: "Mariana Rodríguez", email: "mariana.rodriguez@udem.edu", city: "San Pedro Garza García", vehicle: "bicicleta", bio: "Estudio en la UDEM y ruedo todos los días al campus. Fan de las rodadas de domingo.", memberSince: "2026-01-20", stats: { rides: 24, km: 96.3, avgSafetyScore: 84 }, badgeIds: ["b_1", "b_2", "b_3"], relation: "amigo", mutual: 4 },
  { id: "p_2", name: "Luis Treviño", email: "luis.trevino@correo.com", city: "Monterrey", vehicle: "scooter", bio: "Scooter eléctrico para ir al trabajo en el Centro. Reporto cada bache que veo.", memberSince: "2026-02-08", stats: { rides: 31, km: 74.8, avgSafetyScore: 69 }, badgeIds: ["b_1", "b_2"], relation: "amigo", mutual: 2 },
  { id: "p_3", name: "Andrea Salinas", email: "andrea.salinas@correo.com", city: "San Pedro Garza García", vehicle: "bicicleta", bio: "Rodadas nocturnas por Fundidora y la ciclovía del río. Organizo salidas de principiantes.", memberSince: "2025-11-30", stats: { rides: 42, km: 188.5, avgSafetyScore: 88 }, badgeIds: ["b_1", "b_2", "b_3", "b_4"], relation: "amigo", mutual: 7 },
  { id: "p_4", name: "Carlos Villarreal", email: "carlos.villarreal@correo.com", city: "Guadalupe", vehicle: "bicicleta", bio: "Bici de ruta. Salgo temprano a La Pastora y la Sierra Madre.", memberSince: "2026-03-02", stats: { rides: 19, km: 241.1, avgSafetyScore: 63 }, badgeIds: ["b_1"], relation: "amigo", mutual: 1 },
  { id: "p_5", name: "Fernanda Cantú", email: "fernanda.cantu@correo.com", city: "Apodaca", vehicle: "bicicleta", bio: "Empecé a rodar hace dos meses. Busco rutas seguras para llegar a la escuela.", memberSince: "2026-08-14", stats: { rides: 9, km: 31.2, avgSafetyScore: 77 }, badgeIds: ["b_1"], relation: "solicitud_recibida", mutual: 3 },
  { id: "p_6", name: "Diego Garza", email: "diego.garza@udem.edu", city: "San Pedro Garza García", vehicle: "ambos", bio: "Bici entre semana y scooter los fines. Compañero de la UDEM.", memberSince: "2026-05-19", stats: { rides: 15, km: 52.6, avgSafetyScore: 81 }, badgeIds: ["b_1", "b_3"], relation: "solicitud_recibida", mutual: 5 },
  { id: "p_7", name: "Valeria Martínez", email: "valeria.martinez@correo.com", city: "Monterrey", vehicle: "bicicleta", bio: "Paseos familiares de domingo en Fundidora.", memberSince: "2026-04-11", stats: { rides: 12, km: 40.4, avgSafetyScore: 90 }, badgeIds: ["b_1"], relation: "ninguna", mutual: 6 },
  { id: "p_8", name: "Jorge Elizondo", email: "jorge.elizondo@correo.com", city: "San Pedro Garza García", vehicle: "bicicleta", bio: "Ciclista recreativo. Me gustan las rodadas largas de fin de semana.", memberSince: "2025-12-22", stats: { rides: 37, km: 322.9, avgSafetyScore: 74 }, badgeIds: ["b_1", "b_2"], relation: "ninguna", mutual: 2 },
  { id: "p_9", name: "Paola Leal", email: "paola.leal@correo.com", city: "Santa Catarina", vehicle: "scooter", bio: "Scooter para moverme por Santa Catarina y San Pedro.", memberSince: "2026-06-03", stats: { rides: 14, km: 38.7, avgSafetyScore: 71 }, badgeIds: ["b_1"], relation: "ninguna", mutual: 1 },
  { id: "p_10", name: "Ricardo Guerra", email: "ricardo.guerra@correo.com", city: "Guadalupe", vehicle: "bicicleta", bio: "Voy al trabajo en bici por Av. Benito Juárez.", memberSince: "2026-02-27", stats: { rides: 28, km: 101.4, avgSafetyScore: 66 }, badgeIds: ["b_1", "b_2"], relation: "ninguna", mutual: 3 },
  { id: "p_11", name: "Sofía Montemayor", email: "sofia.montemayor@correo.com", city: "Monterrey", vehicle: "bicicleta", bio: "Rodadas por la ciclovía del Río Santa Catarina.", memberSince: "2026-01-09", stats: { rides: 33, km: 144.0, avgSafetyScore: 90 }, badgeIds: ["b_1", "b_2", "b_3"], relation: "solicitud_enviada", mutual: 2 },
  { id: "p_12", name: "Héctor Lozano", email: "hector.lozano@correo.com", city: "San Pedro Garza García", vehicle: "bicicleta", bio: "Organizo rodadas del Río Santa Catarina los lunes por la noche.", memberSince: "2025-10-05", stats: { rides: 58, km: 410.7, avgSafetyScore: 78 }, badgeIds: ["b_1", "b_2", "b_3", "b_4"], relation: "ninguna", mutual: 4 },
  { id: "p_13", name: "Paulina Rangel", email: "paulina.rangel@udem.edu", city: "San Pedro Garza García", vehicle: "bicicleta", bio: "Voy a la UDEM en bici. Siempre con luces.", memberSince: "2026-07-21", stats: { rides: 17, km: 49.5, avgSafetyScore: 86 }, badgeIds: ["b_1"], relation: "ninguna", mutual: 2 },
  { id: "p_14", name: "Emiliano González", email: "emiliano.gonzalez@correo.com", city: "Monterrey", vehicle: "scooter", bio: "Scooter por el Centro. Conozco las calles más tranquilas.", memberSince: "2026-03-30", stats: { rides: 21, km: 60.2, avgSafetyScore: 58 }, badgeIds: ["b_1"], relation: "ninguna", mutual: 1 },
];

export const friendActivity: FriendActivity[] = [
  { id: "a_1", friendId: "p_1", title: "Casa a la UDEM", km: 3.1, minutes: 14, safetyScore: 84, at: "2026-10-19T07:20:00-06:00", vehicle: "bicicleta" },
  { id: "a_2", friendId: "p_3", title: "Rodada a Fundidora", km: 12.4, minutes: 55, safetyScore: 79, at: "2026-10-18T07:15:00-06:00", vehicle: "bicicleta" },
  { id: "a_3", friendId: "p_2", title: "Centro a Macroplaza", km: 4.1, minutes: 19, safetyScore: 66, at: "2026-10-17T20:40:00-06:00", vehicle: "scooter" },
  { id: "a_4", friendId: "p_4", title: "Guadalupe a La Pastora", km: 17.8, minutes: 58, safetyScore: 58, at: "2026-10-17T06:05:00-06:00", vehicle: "bicicleta" },
  { id: "a_5", friendId: "p_1", title: "La UDEM a Plaza Fiesta San Agustín", km: 5.6, minutes: 24, safetyScore: 91, at: "2026-10-15T19:30:00-06:00", vehicle: "bicicleta" },
  { id: "a_6", friendId: "p_3", title: "Ciclovía Río Santa Catarina", km: 20.1, minutes: 71, safetyScore: 92, at: "2026-10-13T19:00:00-06:00", vehicle: "bicicleta" },
  { id: "a_7", friendId: "p_12", title: "Valle Oriente al Centro", km: 11.2, minutes: 47, safetyScore: 76, at: "2026-10-16T08:10:00-06:00", vehicle: "bicicleta" },
  { id: "a_8", friendId: "p_13", title: "Casa a la UDEM", km: 2.9, minutes: 13, safetyScore: 85, at: "2026-10-16T07:25:00-06:00", vehicle: "bicicleta" },
];
