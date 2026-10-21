"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RealtimeClient, type GpsSample, type LivePosition, type RealtimeStatus } from "./client";

/** Publica las lecturas del GPS de una rodada (`role=gps`). `publish` no hace nada si no hay rodada. */
export function useGpsPublisher(rideId: string | null) {
  const client = useRef<RealtimeClient | null>(null);
  const [status, setStatus] = useState<RealtimeStatus>("closed");

  useEffect(() => {
    if (!rideId) return;
    const c = new RealtimeClient({ role: "gps", onStatus: setStatus });
    client.current = c;
    c.start();
    return () => {
      c.send({ type: "stop", ride_id: rideId });
      // Deja salir el último mensaje antes de cerrar.
      setTimeout(() => c.stop(), 300);
      client.current = null;
    };
  }, [rideId]);

  const publish = useCallback(
    (s: GpsSample) => {
      if (rideId) client.current?.send({ type: "position", ride_id: rideId, ...s });
    },
    [rideId],
  );
  return { publish, status };
}

/** Escucha las posiciones de quienes comparten contigo (`role=map`), por id de usuario. */
export function useLivePositions(enabled = true) {
  const [positions, setPositions] = useState<Record<string, LivePosition>>({});
  const [status, setStatus] = useState<RealtimeStatus>("closed");

  useEffect(() => {
    if (!enabled) return;
    const c = new RealtimeClient({
      role: "map",
      onStatus: setStatus,
      onMessage: (m) => {
        if (m.type === "snapshot") setPositions(Object.fromEntries(m.positions.map((p) => [p.user_id, p])));
        else if (m.type === "update") setPositions((cur) => ({ ...cur, [m.position.user_id]: m.position }));
        else if (m.type === "offline")
          setPositions((cur) => {
            const { [m.user_id]: _gone, ...rest } = cur;
            return rest;
          });
      },
    });
    c.start();
    return () => c.stop();
  }, [enabled]);

  return { positions, status };
}
