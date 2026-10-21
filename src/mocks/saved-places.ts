import type { SavedPlace } from "@/types";
import { HOME, UNIVERSITY } from "./places";

export const savedPlaces: SavedPlace[] = [
  { id: "sp_1", label: "Casa", kind: "casa", place: HOME },
  { id: "sp_2", label: "UDEM", kind: "escuela", place: UNIVERSITY },
  { id: "sp_3", label: "Plaza Fiesta San Agustín", kind: "favorito", place: { name: "Plaza Fiesta San Agustín", detail: "San Pedro Garza García", coordinates: [-100.3555, 25.6575] } },
];
