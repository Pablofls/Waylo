"use client";

import Link from "next/link";
import { Bell, CalendarDays, ClipboardList, TriangleAlert, UserPlus, type LucideIcon } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { EmptyState } from "@/components/ui/States";
import { useSocial } from "@/lib/social";
import { formatDateTime } from "@/lib/format";
import type { NotificationKind } from "@/types";

const icons: Record<NotificationKind, LucideIcon> = { alerta: TriangleAlert, reporte: ClipboardList, amistad: UserPlus, rodada: CalendarDays };

export default function NotificacionesPage() {
  const { notifications, unreadCount, markRead, markAllRead } = useSocial();
  const sorted = [...notifications].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <>
      <ScreenHeader
        title="Notificaciones"
        subtitle={unreadCount > 0 ? `${unreadCount} sin leer` : "Estás al día"}
        back="/inicio"
        action={unreadCount > 0 ? <button onClick={markAllRead} className="min-h-[44px] px-2 text-sm font-semibold text-brand-600">Marcar todo</button> : undefined}
      />
      <div className="flex-1 overflow-y-auto bg-white">
        {sorted.length === 0 ? (
          <EmptyState icon={<Bell size={26} />} title="Sin notificaciones" text="Aquí verás alertas de tu ruta, el estado de tus reportes y novedades de tus amigos." />
        ) : (
          <ul>
            {sorted.map((n) => {
              const Icon = icons[n.kind];
              return (
                <li key={n.id}>
                  <Link href={n.href} onClick={() => markRead(n.id)} className={`flex min-h-[80px] items-start gap-3 border-b border-line px-4 py-3.5 ${n.read ? "bg-white" : "bg-brand-100/50"}`}>
                    <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${n.kind === "alerta" ? "bg-[#FCEBDD] text-[#A8530F]" : "bg-brand-100 text-brand-600"}`}><Icon size={20} /></span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[15px] leading-tight ${n.read ? "font-semibold" : "font-bold"}`}>{n.title}</span>
                      <span className="mt-0.5 block text-sm text-muted">{n.text}</span>
                      <span className="mt-1 block text-xs text-muted">{formatDateTime(n.at)}</span>
                    </span>
                    {!n.read && <span aria-label="Sin leer" className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
