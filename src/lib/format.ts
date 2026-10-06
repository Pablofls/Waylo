const TZ = "America/Monterrey";

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: TZ }).format(new Date(iso)).replace(".", "");

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ })
    .format(new Date(iso))
    .replace(".", "");

export const formatWeekday = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: TZ }).format(new Date(iso));

export const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }).format(new Date(iso));

export const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};
