"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, BookOpen, ChevronRight, Download, FileText, History, KeyRound, LifeBuoy, LocateFixed, Lock, LogOut, MapPin, Route, ShieldAlert, ShieldOff, Trash2, UserRound, WifiOff } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { ConfirmSheet } from "@/components/domain/ConfirmSheet";
import { Segmented } from "@/components/ui/Segmented";
import { Toggle } from "@/components/ui/Toggle";
import { useSocial } from "@/lib/social";
import { Input } from "@/components/ui/Input";
import { api, errorText } from "@/lib/api";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 pt-6">
      <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{title}</h2>
      <div className="mt-2 divide-y divide-line rounded-card border border-line">{children}</div>
    </section>
  );
}

function LinkRow({ href, icon, label, detail }: { href: string; icon: React.ReactNode; label: string; detail?: string }) {
  return (
    <Link href={href} className="flex min-h-[56px] items-center gap-3 px-4">
      <span className="text-muted">{icon}</span>
      <span className="flex-1 text-[15px] font-semibold">{label}</span>
      {detail && <span className="text-sm text-muted">{detail}</span>}
      <ChevronRight size={18} className="text-muted" />
    </Link>
  );
}

export default function ConfiguracionPage() {
  const router = useRouter();
  const { me, subscription, settings, savePrivacy } = useSocial();
  const privacy = settings.privacidad;
  const [delPass, setDelPass] = useState("");
  const [confirm, setConfirm] = useState<"salir" | "eliminar" | null>(null);

  return (
    <>
      <ScreenHeader title="Configuración" back="/perfil" />
      <div className="flex-1 overflow-y-auto bg-white pb-6">
        <Section title="Cuenta">
          <LinkRow href="/perfil/editar" icon={<UserRound size={20} />} label="Editar perfil" detail={me.name.split(" ")[0]} />
          <LinkRow href="/configuracion/contrasena" icon={<KeyRound size={20} />} label="Cambiar contraseña" />
          <LinkRow href="/lugares" icon={<MapPin size={20} />} label="Lugares guardados" />
          <LinkRow href="/rutas-guardadas" icon={<Route size={20} />} label="Rutas guardadas" />
        </Section>

        <Section title="Rutas y avisos">
          <LinkRow href="/configuracion/rutas" icon={<Route size={20} />} label="Preferencias de ruta" />
          <LinkRow href="/configuracion/notificaciones" icon={<Bell size={20} />} label="Notificaciones" />
          <LinkRow href="/configuracion/emergencia" icon={<ShieldAlert size={20} />} label="Emergencia y caídas" />
          <LinkRow href="/compartir-ubicacion" icon={<MapPin size={20} />} label="Compartir ubicación en vivo" />
        </Section>

        <Section title="Premium">
          <LinkRow href="/mapas-sin-conexion" icon={<WifiOff size={20} />} label="Mapas sin conexión" detail={subscription.active ? "Incluido" : "Premium"} />
          <LinkRow href="/zonas" icon={<History size={20} />} label="Historial de seguridad por zona" detail={subscription.active ? "Incluido" : "Premium"} />
          <LinkRow href="/premium/suscripcion" icon={<Lock size={20} />} label="Mi suscripción" />
        </Section>

        <section className="px-4 pt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Quién ve mis rodadas</h2>
          <div className="mt-2"><Segmented label="Visibilidad de mis rodadas" value={privacy.visibilidadRodadas} onChange={(v) => savePrivacy({ ...privacy, visibilidadRodadas: v })} options={[{ value: "todos", label: "Todos" }, { value: "amigos", label: "Amigos" }, { value: "yo", label: "Solo yo" }]} /></div>
        </section>

        <Section title="Privacidad">
          <div className="flex min-h-[56px] items-center justify-between gap-3 pl-4">
            <span><span className="block text-[15px] font-semibold">Perfil visible</span><span className="block text-xs text-muted">Otras personas pueden encontrarte en la búsqueda</span></span>
            <Toggle label="Perfil visible" checked={privacy.perfilVisible} onChange={(v) => savePrivacy({ ...privacy, perfilVisible: v })} />
          </div>
          <div className="flex min-h-[56px] items-center justify-between gap-3 pl-4">
            <span><span className="block text-[15px] font-semibold">Reportes anónimos</span><span className="block text-xs text-muted">Ocultar tu nombre en reportes de la comunidad</span></span>
            <Toggle label="Reportes anónimos" checked={privacy.reportesAnonimos} onChange={(v) => savePrivacy({ ...privacy, reportesAnonimos: v })} />
          </div>
          <LinkRow href="/permisos/ubicacion" icon={<LocateFixed size={20} />} label="Permiso de ubicación" />
          <LinkRow href="/configuracion/bloqueados" icon={<ShieldOff size={20} />} label="Usuarios bloqueados" />
        </Section>

        <Section title="Ayuda y legal">
          <LinkRow href="/ayuda" icon={<BookOpen size={20} />} label="Centro de ayuda" />
          <LinkRow href="/ayuda/contacto" icon={<LifeBuoy size={20} />} label="Contacto y soporte" />
          <LinkRow href="/legal/terminos" icon={<FileText size={20} />} label="Términos y condiciones" />
          <LinkRow href="/legal/privacidad" icon={<FileText size={20} />} label="Aviso de privacidad" />
          <LinkRow href="/ayuda/comentarios" icon={<LifeBuoy size={20} />} label="Enviar comentarios" />
          <LinkRow href="/acerca-de" icon={<BookOpen size={20} />} label="Acerca de Waylo" />
        </Section>

        <Section title="Tus datos">
          <a href="/api/cuenta/exportar" download className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left">
            <Download size={20} className="text-muted" />
            <span className="flex-1"><span className="block text-[15px] font-semibold">Descargar mis datos</span><span className="block text-xs text-muted">Un archivo con tu perfil, rodadas y reportes</span></span>
          </a>
          <button onClick={() => setConfirm("eliminar")} className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left text-risk-red">
            <Trash2 size={20} /><span className="text-[15px] font-semibold text-[#B02E2E]">Eliminar mi cuenta</span>
          </button>
        </Section>

        <div className="px-4 pt-6">
          <button onClick={() => setConfirm("salir")} className="flex min-h-[56px] w-full items-center gap-3 font-semibold text-[#B02E2E]"><LogOut size={20} />Cerrar sesión</button>
          <p className="pt-2 text-center text-xs text-muted">Waylo 0.1 · Fase de prototipo</p>
        </div>
      </div>

      <ConfirmSheet open={confirm === "salir"} title="¿Cerrar sesión?" text="Podrás volver a entrar con tu correo y contraseña." confirmLabel="Cerrar sesión" onConfirm={() => { api("/api/auth/logout", "POST").finally(() => { router.replace("/login"); router.refresh(); }); }} onClose={() => setConfirm(null)} />
      <ConfirmSheet open={confirm === "eliminar"} danger title="¿Eliminar tu cuenta?" text="Se borrarán tus rodadas, reportes y amistades. Esta acción no se puede deshacer." confirmLabel="Eliminar cuenta" confirmDisabled={!delPass} onConfirm={() => { api("/api/auth/cuenta", "DELETE", { contrasena: delPass }).then(() => { router.replace("/"); router.refresh(); }).catch((e) => alert(errorText(e))); setDelPass(""); }} onClose={() => { setDelPass(""); setConfirm(null); }}>
        <Input className="mt-3" label="Confirma con tu contraseña" type="password" autoComplete="current-password" value={delPass} onChange={(e) => setDelPass(e.target.value)} />
      </ConfirmSheet>
    </>
  );
}
