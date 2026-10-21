"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WifiOff } from "lucide-react";

/** Aviso cuando el dispositivo pierde conexión. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (!offline) return null;
  return (
    <Link href="/sin-conexion" role="status" className="pt-safe z-[70] flex min-h-[40px] shrink-0 items-center justify-center gap-2 bg-ink px-4 pb-2 pt-2 text-sm font-semibold text-white">
      <WifiOff size={16} />Sin conexión. Mostrando datos guardados.
    </Link>
  );
}
