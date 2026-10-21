import type { AppNotification } from "@/types";

export const notifications: AppNotification[] = [
  { id: "n_1", kind: "alerta", title: "2 alertas nuevas en tu ruta a la UDEM", text: "Un bache en Av. Morones Prieto y poca iluminación cerca del campus.", at: "2026-10-20T07:05:00-06:00", href: "/mapa", read: false },
  { id: "n_2", kind: "amistad", title: "Fernanda Cantú quiere ser tu amiga", text: "Tienen 3 amigos en común.", at: "2026-10-20T06:40:00-06:00", href: "/personas/p_5", read: false },
  { id: "n_3", kind: "reporte", title: "Tu reporte pasó a En revisión", text: "Bache en Av. Morones Prieto. Obras Públicas de San Pedro lo está revisando.", at: "2026-10-19T11:15:00-06:00", href: "/reportes/r_1042", read: false },
  { id: "n_4", kind: "rodada", title: "Mañana: Rodada universitaria UDEM", text: "Salida a las 18:30 en la explanada de la UDEM.", at: "2026-10-19T09:00:00-06:00", href: "/rodadas/g_4", read: true },
  { id: "n_5", kind: "reporte", title: "Tu reporte fue atendido", text: "Se instaló un reductor de velocidad en el tramo que reportaste.", at: "2026-10-16T16:30:00-06:00", href: "/reportes/r_1021", read: true },
  { id: "n_6", kind: "amistad", title: "Diego Garza quiere ser tu amigo", text: "Tienen 5 amigos en común.", at: "2026-10-15T13:20:00-06:00", href: "/personas/p_6", read: true },
  { id: "n_7", kind: "rodada", title: "Mariana Rodríguez va a la Rodada universitaria UDEM", text: "Mariana es tu amiga y también va.", at: "2026-10-14T18:45:00-06:00", href: "/rodadas/g_4", read: true },
];
