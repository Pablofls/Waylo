import type { Friend, FriendActivity } from "@/types";

export const friends: Friend[] = [
  { id: "f_1", name: "Mariana Rodríguez", city: "San Pedro Garza García", mutual: 4 },
  { id: "f_2", name: "Luis Treviño", city: "Monterrey", mutual: 2 },
  { id: "f_3", name: "Andrea Salinas", city: "San Pedro Garza García", mutual: 7 },
  { id: "f_4", name: "Carlos Villarreal", city: "Guadalupe", mutual: 1 },
];

export const friendRequests: Friend[] = [
  { id: "f_5", name: "Fernanda Cantú", city: "Apodaca", mutual: 3 },
  { id: "f_6", name: "Diego Garza", city: "San Pedro Garza García", mutual: 5 },
];

export const friendSuggestions: Friend[] = [
  { id: "f_7", name: "Valeria Martínez", city: "Monterrey", mutual: 6 },
  { id: "f_8", name: "Jorge Elizondo", city: "San Pedro Garza García", mutual: 2 },
  { id: "f_9", name: "Paola Leal", city: "Santa Catarina", mutual: 1 },
  { id: "f_10", name: "Ricardo Guerra", city: "Guadalupe", mutual: 3 },
];

export const friendActivity: FriendActivity[] = [
  { id: "a_1", friendId: "f_1", title: "Casa a Valle Oriente", km: 9.2, minutes: 41, safetyScore: 84, at: "2026-10-05T18:10:00-06:00", vehicle: "bicicleta" },
  { id: "a_2", friendId: "f_3", title: "Rodada a Fundidora", km: 12.4, minutes: 55, safetyScore: 79, at: "2026-10-05T07:15:00-06:00", vehicle: "bicicleta" },
  { id: "a_3", friendId: "f_2", title: "Centro a Macroplaza", km: 4.1, minutes: 19, safetyScore: 66, at: "2026-10-04T20:40:00-06:00", vehicle: "scooter" },
  { id: "a_4", friendId: "f_4", title: "Guadalupe a La Pastora", km: 7.8, minutes: 33, safetyScore: 58, at: "2026-10-04T08:05:00-06:00", vehicle: "bicicleta" },
  { id: "a_5", friendId: "f_1", title: "Plaza Fiesta San Agustín a casa", km: 5.6, minutes: 24, safetyScore: 91, at: "2026-10-03T19:30:00-06:00", vehicle: "scooter" },
];
