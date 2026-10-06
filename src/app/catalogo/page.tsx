import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

const groups = [
  {
    title: "Acceso",
    items: [
      { n: "1", t: "Bienvenida", href: "/" },
      { n: "2", t: "Inicio de sesión", href: "/login" },
      { n: "3", t: "Registro y onboarding (5 pasos)", href: "/registro" },
    ],
  },
  {
    title: "Rutas y mapa",
    items: [
      { n: "4", t: "Mapa (inicio)", href: "/mapa" },
      { n: "5", t: "Planificar ruta", href: "/rutas" },
      { n: "5b", t: "Desglose del Safety Score: Más segura", href: "/rutas/segura" },
      { n: "5c", t: "Desglose del Safety Score: Más rápida", href: "/rutas/rapida" },
    ],
  },
  {
    title: "Rodada",
    items: [
      { n: "6", t: "Rodada en vivo / navegación", href: "/rodada?ruta=segura" },
      { n: "7", t: "Reporte rápido (botón rojo dentro de la rodada)", href: "/rodada?ruta=segura" },
      { n: "8", t: "Resumen de la rodada", href: "/rodada/resumen?ruta=segura" },
    ],
  },
  {
    title: "Comunidad y cuenta",
    items: [
      { n: "9", t: "Mis reportes", href: "/reportes" },
      { n: "9b", t: "Detalle de reporte con línea de tiempo", href: "/reportes/r_1042" },
      { n: "10", t: "Comunidad", href: "/comunidad" },
      { n: "11", t: "Perfil", href: "/perfil" },
      { n: "12", t: "Waylo Premium", href: "/premium" },
    ],
  },
  { title: "Sistema", items: [{ n: "·", t: "Guía de estilo", href: "/design" }] },
];

export default function Catalogo() {
  return (
    <main className="mx-auto max-w-xl px-4 pb-16 pt-10">
      <Logo size="md" />
      <h1 className="mt-4 text-2xl font-bold">Catálogo de pantallas</h1>
      <p className="mt-1 text-muted">Todas las pantallas de la fase 1 con datos simulados.</p>
      {groups.map((g) => (
        <section key={g.title} className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{g.title}</h2>
          <ul className="mt-2 divide-y divide-line rounded-card border border-line bg-white">
            {g.items.map((i) => (
              <li key={i.href + i.t}>
                <Link href={i.href} className="flex min-h-[56px] items-center gap-4 px-4">
                  <span className="metric w-8 text-2xl text-brand-600">{i.n}</span>
                  <span className="flex-1 text-[15px] font-semibold">{i.t}</span>
                  <ChevronRight size={18} className="text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
