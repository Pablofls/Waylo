import type { Ride } from "@/types";
import { mockRoutes } from "./routes";

const safe = mockRoutes.find((r) => r.id === "segura")!;

export const mockRides: Ride[] = [
  { id: "ride_88", title: "Casa a UDEM", startedAt: "2026-10-05T07:20:00-06:00", km: 3.2, minutes: 15, avgSpeed: 13.1, avgSafetyScore: 87, coordinates: safe.coordinates },
  { id: "ride_87", title: "UDEM a casa", startedAt: "2026-10-04T18:05:00-06:00", km: 3.2, minutes: 16, avgSpeed: 12.2, avgSafetyScore: 84, coordinates: [...safe.coordinates].reverse() },
  { id: "ride_85", title: "Casa a UDEM", startedAt: "2026-10-03T07:25:00-06:00", km: 2.4, minutes: 11, avgSpeed: 14.6, avgSafetyScore: 58, coordinates: mockRoutes[0].coordinates },
  { id: "ride_83", title: "Casa a UDEM por calles locales", startedAt: "2026-10-01T17:40:00-06:00", km: 2.7, minutes: 13, avgSpeed: 13.6, avgSafetyScore: 79, coordinates: mockRoutes[1].coordinates },
];

export const monthStats = { rides: 18, km: 54.6, minutes: 262, avgSafetyScore: 81 };

export const communityRides: import("@/types").CommunityRide[] = [
  { id: "cr_1", person: "Sofía M.", title: "Ciclovía Río Santa Catarina", km: 18.3, minutes: 66, safetyScore: 90, at: "2026-10-05T17:30:00-06:00", zone: "Monterrey" },
  { id: "cr_2", person: "Héctor L.", title: "Valle Oriente a Centro", km: 10.7, minutes: 44, safetyScore: 72, at: "2026-10-05T08:20:00-06:00", zone: "San Pedro" },
  { id: "cr_3", person: "Paulina R.", title: "Valle de San Ángel a UDEM", km: 2.9, minutes: 14, safetyScore: 85, at: "2026-10-05T07:10:00-06:00", zone: "San Pedro" },
  { id: "cr_4", person: "Emiliano G.", title: "Av. Constitución a Fundidora", km: 5.2, minutes: 21, safetyScore: 54, at: "2026-10-04T21:00:00-06:00", zone: "Monterrey" },
];
