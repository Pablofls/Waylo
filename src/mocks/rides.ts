import type { Ride } from "@/types";
import { mockRoutes } from "./routes";

const safe = mockRoutes.find((r) => r.id === "segura")!;

export const mockRides: Ride[] = [
  { id: "ride_88", title: "Casa a UANL", startedAt: "2026-10-05T07:20:00-06:00", km: 7.4, minutes: 34, avgSpeed: 13.1, avgSafetyScore: 87, coordinates: safe.coordinates },
  { id: "ride_87", title: "UANL a casa", startedAt: "2026-10-04T18:05:00-06:00", km: 7.3, minutes: 36, avgSpeed: 12.2, avgSafetyScore: 84, coordinates: [...safe.coordinates].reverse() },
  { id: "ride_85", title: "Casa a UANL", startedAt: "2026-10-03T07:25:00-06:00", km: 6.1, minutes: 25, avgSpeed: 14.6, avgSafetyScore: 58, coordinates: mockRoutes[0].coordinates },
  { id: "ride_83", title: "Rodada a Fundidora", startedAt: "2026-10-01T17:40:00-06:00", km: 11.8, minutes: 52, avgSpeed: 13.6, avgSafetyScore: 79, coordinates: mockRoutes[1].coordinates },
];

export const monthStats = { rides: 18, km: 112.4, minutes: 521, avgSafetyScore: 81 };
