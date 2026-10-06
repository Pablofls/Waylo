import type { Report } from "@/types";

export const mockReports: Report[] = [
  {
    id: "r_1042", category: "bache", coordinates: [-100.4075, 25.6575], street: "Av. Morones Prieto", colonia: "San Pedro Garza García",
    createdAt: "2026-10-05T07:42:00-06:00", status: "en_revision", confirmations: 6, note: "Bache profundo en el carril derecho.",
    timeline: [
      { status: "enviado", at: "2026-10-05T07:42:00-06:00", text: "Reporte enviado desde tu rodada." },
      { status: "en_revision", at: "2026-10-05T11:15:00-06:00", text: "Obras Públicas de San Pedro lo recibió y lo está revisando." },
    ],
  },
  {
    id: "r_1038", category: "poca_iluminacion", coordinates: [-100.4115, 25.6588], street: "Av. Morones Prieto, cerca de la UDEM", colonia: "San Pedro Garza García",
    createdAt: "2026-10-04T20:10:00-06:00", status: "enviado", confirmations: 3, pendingDetails: true,
    timeline: [{ status: "enviado", at: "2026-10-04T20:10:00-06:00", text: "Reporte enviado. Falta completar los detalles." }],
  },
  {
    id: "r_1021", category: "alta_velocidad", coordinates: [-100.4035, 25.6562], street: "Av. Morones Prieto", colonia: "San Pedro Garza García",
    createdAt: "2026-10-02T18:25:00-06:00", status: "atendido", confirmations: 11,
    timeline: [
      { status: "enviado", at: "2026-10-02T18:25:00-06:00", text: "Reporte enviado." },
      { status: "en_revision", at: "2026-10-03T09:00:00-06:00", text: "Tránsito municipal lo tiene en revisión." },
      { status: "atendido", at: "2026-10-04T16:30:00-06:00", text: "Se instaló un reductor de velocidad en el tramo." },
    ],
  },
  {
    id: "r_1009", category: "robo", coordinates: [-100.4142, 25.6598], street: "Entrada principal de la UDEM", colonia: "San Pedro Garza García",
    createdAt: "2026-09-29T21:05:00-06:00", status: "en_revision", confirmations: 4,
    timeline: [
      { status: "enviado", at: "2026-09-29T21:05:00-06:00", text: "Reporte enviado." },
      { status: "en_revision", at: "2026-09-30T10:20:00-06:00", text: "Turnado a Seguridad Pública Municipal." },
    ],
  },
  {
    id: "r_0997", category: "calle_cerrada", coordinates: [-100.4002, 25.6528], street: "Calle junto a la salida de casa", colonia: "San Pedro Garza García",
    createdAt: "2026-09-27T08:15:00-06:00", status: "atendido", confirmations: 2,
    timeline: [
      { status: "enviado", at: "2026-09-27T08:15:00-06:00", text: "Reporte enviado." },
      { status: "atendido", at: "2026-09-28T13:00:00-06:00", text: "La obra concluyó y la calle se reabrió." },
    ],
  },
];

/** Reportes recientes de la comunidad en el AMM (no son del usuario). */
export const communityReports: Report[] = [
  {
    id: "c_501", category: "accidente", coordinates: [-100.3105, 25.6702], street: "Av. Constitución y Zaragoza", colonia: "Centro, Monterrey",
    createdAt: "2026-10-05T18:02:00-06:00", status: "enviado", confirmations: 8, timeline: [],
  },
  {
    id: "c_498", category: "bache", coordinates: [-100.3188, 25.6418], street: "Av. Lázaro Cárdenas", colonia: "Valle Oriente",
    createdAt: "2026-10-05T16:40:00-06:00", status: "en_revision", confirmations: 5, timeline: [],
  },
  {
    id: "c_493", category: "conductor_agresivo", coordinates: [-100.2862, 25.6788], street: "Av. Fundidora", colonia: "Obrera",
    createdAt: "2026-10-05T14:12:00-06:00", status: "enviado", confirmations: 3, timeline: [],
  },
  {
    id: "c_487", category: "poca_iluminacion", coordinates: [-100.2572, 25.6768], street: "Av. Benito Juárez", colonia: "Guadalupe Centro",
    createdAt: "2026-10-04T21:30:00-06:00", status: "en_revision", confirmations: 9, timeline: [],
  },
  {
    id: "c_480", category: "robo", coordinates: [-100.3552, 25.6579], street: "Calzada del Valle", colonia: "Del Valle, San Pedro",
    createdAt: "2026-10-04T19:48:00-06:00", status: "enviado", confirmations: 7, timeline: [],
  },
];
