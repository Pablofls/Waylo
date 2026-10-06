import type { Place } from "@/types";

export const MONTERREY_CENTER: [number, number] = [-100.3161, 25.6866];
/** Centro del mapa en la ruta demo (zona de la UDEM). */
export const DEMO_CENTER: [number, number] = [-100.408, 25.6575];

export const HOME: Place = {
  name: "Casa",
  detail: "Cerca de la UDEM, San Pedro Garza García",
  coordinates: [-100.399, 25.654],
};

export const UNIVERSITY: Place = {
  name: "UDEM",
  detail: "Av. Ignacio Morones Prieto 4500 Pte., San Pedro Garza García",
  coordinates: [-100.417, 25.6605],
};

export const PLACES: Place[] = [
  UNIVERSITY,
  { name: "Fundidora", detail: "Parque Fundidora, Monterrey", coordinates: [-100.2855, 25.6795] },
  { name: "Valle Oriente", detail: "Av. Lázaro Cárdenas, San Pedro Garza García", coordinates: [-100.3185, 25.6415] },
  { name: "Macroplaza", detail: "Centro de Monterrey", coordinates: [-100.3098, 25.67] },
  { name: "Plaza Fiesta San Agustín", detail: "San Pedro Garza García", coordinates: [-100.3555, 25.6575] },
];
