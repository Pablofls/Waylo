import type { EmergencyContact, LngLat } from "@/types";

/**
 * Enlace `sms:` con el mensaje de ayuda y la ubicación. Aún no hay un proveedor de SMS en el servidor:
 * la persona envía el mensaje desde su app de mensajes.
 */
export function smsHref(contacts: EmergencyContact[], at: LngLat | null, motivo: string): string {
  const phones = contacts.map((c) => c.phone.replace(/[^\d+]/g, "")).join(",");
  const lugar = at ? ` Mi ubicación: https://www.google.com/maps?q=${at[1].toFixed(6)},${at[0].toFixed(6)}` : "";
  return `sms:${phones}?&body=${encodeURIComponent(`${motivo} Necesito ayuda.${lugar} (enviado desde Waylo)`)}`;
}
