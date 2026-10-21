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
      { n: "3b", t: "Recuperar contraseña", href: "/recuperar" },
      { n: "3d", t: "Verificar correo", href: "/verificar" },
      { n: "3e", t: "Permiso de notificaciones", href: "/permisos/notificaciones" },
      { n: "3c", t: "Ubicación desactivada: cómo activarla", href: "/permisos/ubicacion" },
    ],
  },
  {
    title: "Inicio y amigos",
    items: [
      { n: "4", t: "Inicio: mis rodadas, comunidad y amigos", href: "/inicio" },
      { n: "4b", t: "Amigos: lista, solicitudes y búsqueda", href: "/amigos" },
      { n: "4c", t: "Perfil de un amigo", href: "/personas/p_1" },
      { n: "4d", t: "Perfil de una persona que no es amiga", href: "/personas/p_7" },
    ],
  },
  {
    title: "Mapa y rutas",
    items: [
      { n: "5", t: "Mapa: riesgo, destino y 3 opciones de ruta", href: "/mapa" },
      { n: "5a", t: "Lugares guardados", href: "/lugares" },
      { n: "5d", t: "Rutas guardadas", href: "/rutas-guardadas" },
      { n: "5e", t: "Cómo se calcula el Safety Score", href: "/ayuda/safety-score" },
      { n: "5b", t: "Desglose del Safety Score: Más segura", href: "/rutas/segura" },
      { n: "5c", t: "Desglose del Safety Score: Más rápida", href: "/rutas/rapida" },
    ],
  },
  {
    title: "Rodada",
    items: [
      { n: "6", t: "Comenzar: rodada libre sin ruta", href: "/rodada" },
      { n: "6b", t: "Rodada guiada con ruta", href: "/rodada?ruta=segura" },
      { n: "7", t: "Reporte rápido (botón rojo dentro de la rodada)", href: "/rodada?ruta=segura" },
      { n: "8", t: "Resumen de la rodada", href: "/rodada/resumen?ruta=segura" },
      { n: "8b", t: "Detalle de una rodada pasada", href: "/actividad/ride_88" },
    ],
  },
  {
    title: "Comunidad y cuenta",
    items: [
      { n: "9", t: "Mis reportes", href: "/reportes" },
      { n: "9b", t: "Detalle de reporte con línea de tiempo", href: "/reportes/r_1042" },
      { n: "9c", t: "Completar un reporte pendiente", href: "/reportes/r_1038/completar" },
      { n: "9d", t: "Reporte de la comunidad: confirmar o ya no está", href: "/reportes-comunidad/c_498" },
      { n: "10", t: "Comunidad: reportes y rodadas grupales", href: "/comunidad" },
      { n: "10b", t: "Detalle de rodada grupal", href: "/rodadas/g_4" },
      { n: "10c", t: "Quiénes van a una rodada", href: "/rodadas/g_4/asistentes" },
      { n: "10d", t: "Crear rodada", href: "/rodadas/nueva" },
      { n: "10e", t: "Editar rodada propia", href: "/rodadas/g_6/editar" },
      { n: "11", t: "Perfil", href: "/perfil" },
      { n: "11b", t: "Editar perfil", href: "/perfil/editar" },
      { n: "11c", t: "Configuración y privacidad", href: "/configuracion" },
      { n: "11d", t: "Notificaciones", href: "/notificaciones" },
      { n: "11e", t: "Preferencias de notificaciones", href: "/configuracion/notificaciones" },
      { n: "11f", t: "Preferencias de ruta", href: "/configuracion/rutas" },
      { n: "11g", t: "Emergencia: contactos y caídas", href: "/configuracion/emergencia" },
      { n: "11h", t: "Cambiar contraseña", href: "/configuracion/contrasena" },
      { n: "11i", t: "Usuarios bloqueados", href: "/configuracion/bloqueados" },
      { n: "11j", t: "Insignias", href: "/insignias" },
      { n: "11k", t: "Detalle de una insignia", href: "/insignias/b_3" },
      { n: "12", t: "Waylo Premium", href: "/premium" },
      { n: "12b", t: "Pago de Premium (simulado)", href: "/premium/pago" },
      { n: "12c", t: "Confirmación de Premium", href: "/premium/confirmacion" },
      { n: "12d", t: "Administrar suscripción", href: "/premium/suscripcion" },
    ],
  },
  {
    title: "Ayuda y legal",
    items: [
      { n: "13", t: "Centro de ayuda y preguntas frecuentes", href: "/ayuda" },
      { n: "13b", t: "Contacto y soporte", href: "/ayuda/contacto" },
      { n: "13c", t: "Términos y condiciones", href: "/legal/terminos" },
      { n: "13d", t: "Aviso de privacidad", href: "/legal/privacidad" },
    ],
  },
  { title: "Sistema", items: [{ n: "·", t: "Sin conexión", href: "/sin-conexion" },{ n: "·", t: "Guía de estilo", href: "/design" }, { n: "·", t: "Página no encontrada", href: "/esta-pagina-no-existe" }] },
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
