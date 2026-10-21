"use client";

import { api } from "@/lib/api";

/** Una lectura aceptada del GPS (precisión ya filtrada) lista para publicar. */
export interface GpsSample {
  latitude: number;
  longitude: number;
  /** km/h */
  speed: number;
  /** 0 a 359 */
  heading: number;
  /** metros */
  accuracy: number;
  ts: string;
}

export interface LivePosition {
  user_id: string;
  ride_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  ts: string;
}

export type RealtimeStatus = "connecting" | "open" | "closed";

type ServerMessage =
  | { type: "snapshot"; positions: LivePosition[] }
  | { type: "update"; position: LivePosition }
  | { type: "offline"; user_id: string }
  | { type: "error"; code: string; message: string };

interface Options {
  role: "gps" | "map";
  onMessage?: (m: ServerMessage) => void;
  onStatus?: (s: RealtimeStatus) => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL;
const RENEW_MARGIN_MS = 60_000;
const MAX_BUFFER = 30;

/**
 * Conexión WebSocket con el servicio en tiempo real (contrato en docs/arquitectura.md).
 * Pide un JWT corto a /api/ws-token, reconecta con espera creciente y renueva el token antes de que venza
 * abriendo una conexión nueva (el servicio cierra con 4401 las conexiones cuyo token venció).
 */
export class RealtimeClient {
  private ws: WebSocket | null = null;
  private retry = 0;
  private stopped = false;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private buffer: string[] = [];

  constructor(private opts: Options) {}

  start() {
    this.stopped = false;
    void this.connect();
  }

  stop() {
    this.stopped = true;
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.ws?.close(1000);
    this.ws = null;
    this.opts.onStatus?.("closed");
  }

  /** Envía un mensaje; si no hay conexión lo guarda un momento (máx. 30) y lo manda al reconectar. */
  send(msg: object) {
    const text = JSON.stringify(msg);
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(text);
    else {
      this.buffer.push(text);
      if (this.buffer.length > MAX_BUFFER) this.buffer.shift();
    }
  }

  private later(fn: () => void, ms: number) {
    const t = setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
  }

  private async connect(replacing?: WebSocket) {
    if (this.stopped) return;
    if (!WS_URL) {
      console.error("Falta NEXT_PUBLIC_WS_URL: no hay tiempo real.");
      this.opts.onStatus?.("closed");
      return;
    }
    if (!replacing) this.opts.onStatus?.("connecting");
    let token: string;
    let expiresAt: number;
    try {
      ({ token, expiresAt } = await api<{ token: string; expiresAt: number }>("/api/ws-token", "POST", { role: this.opts.role }));
    } catch {
      return this.scheduleRetry();
    }
    if (this.stopped) return;
    const ws = new WebSocket(`${WS_URL}?role=${this.opts.role}&token=${encodeURIComponent(token)}`);
    ws.onopen = () => {
      this.retry = 0;
      const old = this.ws;
      this.ws = ws;
      if (old && old !== ws) old.close(1000);
      this.opts.onStatus?.("open");
      for (const m of this.buffer.splice(0)) ws.send(m);
      this.later(() => void this.connect(ws), Math.max(5_000, expiresAt - Date.now() - RENEW_MARGIN_MS));
    };
    ws.onmessage = (e) => {
      try {
        this.opts.onMessage?.(JSON.parse(String(e.data)) as ServerMessage);
      } catch {
        /* mensaje que no es JSON: se ignora */
      }
    };
    ws.onclose = () => {
      if (this.ws !== ws) return; // conexión reemplazada por la renovación
      this.ws = null;
      this.opts.onStatus?.("closed");
      this.scheduleRetry();
    };
    ws.onerror = () => ws.close();
  }

  private scheduleRetry() {
    if (this.stopped) return;
    const wait = Math.min(30_000, 1_000 * 2 ** this.retry++);
    this.later(() => void this.connect(), wait);
  }
}
