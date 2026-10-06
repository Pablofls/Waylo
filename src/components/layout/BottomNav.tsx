"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Play, Users, User } from "lucide-react";

const tabs = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/rodada", label: "Comenzar", icon: Play, center: true },
  { href: "/comunidad", label: "Comunidad", icon: Users },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav({ activeOverride }: { activeOverride?: string }) {
  const pathname = usePathname();
  const current = activeOverride ?? pathname;
  return (
    <nav aria-label="Principal" className="pb-safe shrink-0 border-t border-line bg-white">
      <ul className="grid grid-cols-5 items-end px-1">
        {tabs.map(({ href, label, icon: Icon, center }) => {
          const active = current === href || current.startsWith(href + "/") || (href === "/mapa" && current.startsWith("/rutas"));
          if (center) {
            return (
              <li key={href} className="flex justify-center">
                <Link
                  href={href}
                  className="-mt-5 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-brand-600 text-white ring-4 ring-white active:bg-brand-700"
                  aria-label="Comenzar rodada"
                >
                  <Icon size={22} strokeWidth={3} fill="currentColor" />
                  <span className="mt-0.5 text-[10px] font-semibold">Comenzar</span>
                </Link>
              </li>
            );
          }
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${active ? "text-brand-600" : "text-muted"}`}
              >
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
