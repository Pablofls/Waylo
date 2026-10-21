"use client";

import { useEffect, useRef } from "react";

const IMPACT = 29; // m/s² (≈ 3 g)
const STILL_TOLERANCE = 2; // desviación máxima respecto a 1 g mientras queda inmóvil
const STILL_MS = 2000;
const COOLDOWN_MS = 60_000;

interface MotionPermission {
  requestPermission?: () => Promise<"granted" | "denied">;
}

/** En iOS el acelerómetro pide permiso y debe solicitarse desde un toque de la persona (por ejemplo, al iniciar la rodada). */
export async function requestMotionPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("DeviceMotionEvent" in window)) return false;
  const dm = DeviceMotionEvent as unknown as MotionPermission;
  if (typeof dm.requestPermission === "function") {
    try {
      return (await dm.requestPermission()) === "granted";
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Detecta una posible caída: un golpe fuerte seguido de ~2 s sin movimiento. Es una heurística sencilla;
 * por eso solo abre una cuenta regresiva y nunca avisa a nadie por sí sola.
 */
export function useFallDetection(enabled: boolean, onFall: () => void) {
  const cb = useRef(onFall);
  cb.current = onFall;

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("DeviceMotionEvent" in window)) return;
    let impactAt = 0;
    let stillSince = 0;
    let lastFire = 0;
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity;
      if (!a || a.x === null || a.y === null || a.z === null) return;
      const mag = Math.hypot(a.x, a.y, a.z);
      const now = Date.now();
      if (mag > IMPACT && now - lastFire > COOLDOWN_MS) {
        impactAt = now;
        stillSince = 0;
        return;
      }
      if (!impactAt) return;
      if (now - impactAt > 6000) {
        impactAt = 0;
        return;
      }
      if (Math.abs(mag - 9.81) < STILL_TOLERANCE) {
        stillSince ||= now;
        if (now - stillSince >= STILL_MS) {
          lastFire = now;
          impactAt = 0;
          stillSince = 0;
          cb.current();
        }
      } else {
        stillSince = 0;
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  }, [enabled]);
}
