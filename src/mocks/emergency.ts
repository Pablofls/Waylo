import type { EmergencyContact, SavedRoute } from "@/types";
import { UNIVERSITY } from "./places";

export const emergencyContacts: EmergencyContact[] = [
  { id: "ec_1", name: "Rosa Garza", phone: "81 1234 5678", relation: "Mamá" },
  { id: "ec_2", name: "Mariana Rodríguez", phone: "81 8765 4321", relation: "Amiga" },
];

export const savedRoutes: SavedRoute[] = [
  { id: "sr_1", name: "Casa a la UDEM", fromName: "Casa", toName: "UDEM", destination: UNIVERSITY.coordinates, routeId: "segura", minutes: 15, safetyScore: 88 },
  { id: "sr_2", name: "La UDEM a casa", fromName: "UDEM", toName: "Casa", destination: [-100.399, 25.654], routeId: "segura", minutes: 16, safetyScore: 86 },
];
