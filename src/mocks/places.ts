import type { Place } from "@/types";

export const MONTERREY_CENTER: [number, number] = [-100.3161, 25.6866];

export const HOME: Place = {
  name: "Casa",
  detail: "Col. Anáhuac, San Nicolás de los Garza",
  coordinates: [-100.286, 25.7475],
};

export const UNIVERSITY: Place = {
  name: "UANL Ciudad Universitaria",
  detail: "Av. Universidad, San Nicolás de los Garza",
  coordinates: [-100.311, 25.7245],
};

export const PLACES: Place[] = [
  UNIVERSITY,
  { name: "Fundidora", detail: "Parque Fundidora, Monterrey", coordinates: [-100.2855, 25.6795] },
  { name: "Valle Oriente", detail: "Av. Lázaro Cárdenas, San Pedro Garza García", coordinates: [-100.3185, 25.6415] },
  { name: "Macroplaza", detail: "Centro de Monterrey", coordinates: [-100.3098, 25.6700] },
  { name: "Plaza Fiesta San Agustín", detail: "San Pedro Garza García", coordinates: [-100.3555, 25.6575] },
];
