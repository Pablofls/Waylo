import { randomInt } from "node:crypto";
import { ApiError, notFound } from "./api";
import { query, queryOne, tx } from "./db";
import type { Subscription } from "@/types";

export interface Recibo {
  folio: string;
  fecha: string;
  cliente: string;
  concepto: string;
  metodo: string;
  ultimos4: string | null;
  subtotal: number;
  iva: number;
  tasaIva: number;
  total: number;
}

export async function miSuscripcion(uid: string): Promise<Subscription> {
  const r = await queryOne<{ activa: boolean; cancelada: boolean; vigente_hasta: Date; last4: string | null }>(
    `SELECT s.activa, s.cancelada, s.vigente_hasta, (SELECT tarjeta_ultimos4 FROM pago WHERE suscripcion_id = s.suscripcion_id ORDER BY pagado_en DESC LIMIT 1) AS last4
     FROM v_suscripcion_actual s WHERE s.usuario_id = $1`,
    [uid],
  );
  if (!r || !r.activa) return { active: false };
  return { active: true, until: r.vigente_hasta.toISOString().slice(0, 10), cancelled: r.cancelada, last4: r.last4 ?? undefined };
}

const folio = () => `WLY-${new Date().getFullYear()}-${String(randomInt(0, 1_000_000)).padStart(6, "0")}`;

/** Pago SIMULADO: no hay cobro ni pasarela. Solo se recibe el nombre del método y los últimos 4 dígitos para el recibo. */
export async function suscribir(uid: string, ultimos4: string): Promise<{ folio: string }> {
  if (!/^\d{4}$/.test(ultimos4)) throw new ApiError(400, "Datos de tarjeta no válidos.");
  return tx(async (c) => {
    // Bloquea a la persona para que dos pagos simultáneos no creen dos suscripciones activas.
    await c.query(`SELECT id FROM usuario WHERE id = $1 FOR UPDATE`, [uid]);
    const vigente = await c.query(`SELECT 1 FROM v_suscripcion_actual WHERE usuario_id = $1 AND activa AND NOT cancelada`, [uid]);
    if (vigente.rowCount) throw new ApiError(409, "Ya tienes una suscripción activa.");
    const plan = await c.query<{ clave: string; precio_total: string; duracion_meses: number }>(`SELECT clave, precio_total, duracion_meses FROM plan ORDER BY precio_total LIMIT 1`);
    const p = plan.rows[0];
    // Si estaba cancelada pero vigente, la nueva suscripción empieza al terminar la anterior.
    const s = await c.query<{ id: string }>(
      `INSERT INTO suscripcion (usuario_id, plan_clave, inicia_en, vigente_hasta)
       SELECT $1, $2, now(), GREATEST(now(), COALESCE((SELECT max(vigente_hasta) FROM suscripcion WHERE usuario_id = $1), now())) + make_interval(months => $3) RETURNING id`,
      [uid, p.clave, p.duracion_meses],
    );
    const f = folio();
    await c.query(`INSERT INTO pago (suscripcion_id, folio, metodo_clave, tarjeta_ultimos4, monto_total) VALUES ($1, $2, 'tarjeta', $3, $4)`, [s.rows[0].id, f, ultimos4, p.precio_total]);
    return { folio: f };
  });
}

export async function cancelarSuscripcion(uid: string): Promise<void> {
  const r = await query(`UPDATE suscripcion SET cancelada_en = now() WHERE id = (SELECT suscripcion_id FROM v_suscripcion_actual WHERE usuario_id = $1 AND activa) AND cancelada_en IS NULL RETURNING id`, [uid]);
  if (r.length === 0) throw notFound("No tienes una suscripción activa.");
}

export async function reactivarSuscripcion(uid: string): Promise<void> {
  const r = await query(`UPDATE suscripcion SET cancelada_en = NULL WHERE id = (SELECT suscripcion_id FROM v_suscripcion_actual WHERE usuario_id = $1 AND activa AND cancelada) RETURNING id`, [uid]);
  if (r.length === 0) throw notFound("No hay una suscripción cancelada que reactivar.");
}

type ReciboRow = { folio: string; pagado_en: Date; cliente: string | null; concepto: string; metodo_pago: string; tarjeta_ultimos4: string | null; subtotal: string; iva: string; tasa_iva: string; total: string };
const aRecibo = (r: ReciboRow): Recibo => ({ folio: r.folio, fecha: r.pagado_en.toISOString(), cliente: r.cliente ?? "", concepto: r.concepto, metodo: r.metodo_pago, ultimos4: r.tarjeta_ultimos4, subtotal: Number(r.subtotal), iva: Number(r.iva), tasaIva: Number(r.tasa_iva), total: Number(r.total) });

export async function misPagos(uid: string): Promise<Recibo[]> {
  return (await query<ReciboRow>(`SELECT folio, pagado_en, cliente, concepto, metodo_pago, tarjeta_ultimos4, subtotal, iva, tasa_iva, total FROM v_pago_recibo WHERE usuario_id = $1 ORDER BY pagado_en DESC`, [uid])).map(aRecibo);
}

export async function miPago(uid: string, folioPago: string): Promise<Recibo | null> {
  const r = await queryOne<ReciboRow>(`SELECT folio, pagado_en, cliente, concepto, metodo_pago, tarjeta_ultimos4, subtotal, iva, tasa_iva, total FROM v_pago_recibo WHERE usuario_id = $1 AND folio = $2`, [uid, folioPago]);
  return r ? aRecibo(r) : null;
}

export async function precioPlan(): Promise<{ nombre: string; total: number }> {
  const r = await queryOne<{ nombre: string; precio_total: string }>(`SELECT nombre, precio_total FROM plan ORDER BY precio_total LIMIT 1`);
  return { nombre: r?.nombre ?? "Waylo Premium", total: Number(r?.precio_total ?? 0) };
}
