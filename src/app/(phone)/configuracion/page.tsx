"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, BookOpen, ChevronRight, Download, FileText, History, KeyRound, LifeBuoy, LocateFixed, Lock, LogOut, MapPin, Route, ShieldAlert, ShieldOff, Trash2, UserRound, WifiOff } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { PremiumGate } from "@/components/domain/PremiumGate";
import { ConfirmSheet } from "@/components/domain/ConfirmSheet";
import { Segmented } from "@/components/ui/Segmented";
import { Toggle } from "@/components/ui/Toggle";
import { useSocial } from "@/lib/social";

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
  const { me, subscription } = useSocial();
  const [gate, setGate] = useState<string | null>(null);
  const [units, setUnits] = useState<"km" | "mi">("km");
  const [visibility, setVisibility] = useState<"todos" | "amigos" | "yo">("amigos");
  const [profilePublic, setProfilePublic] = useState(true);
  const [anonymousReports, setAnonymousReports] = useState(false);
  const [confirm, setConfirm] = useState<"salir" | "eliminar" | null>(null);
  const [exported, setExported] = useState(false);

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
        </Section>

        <Section title="Premium">
          {[{ k: "Los mapas sin conexión", l: "Mapas sin conexión", i: <WifiOff size={20} /> }, { k: "El historial de seguridad por zona", l: "Historial de seguridad por zona", i: <History size={20} /> }].map((f) => (
            <button key={f.k} onClick={() => (subscription.active ? undefined : setGate(f.k))} className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left">
              <span className="text-muted">{f.i}</span><span className="flex-1 text-[15px] font-semibold">{f.l}</span>
              {subscription.active ? <span className="text-sm text-brand-700">Incluido</span> : <Lock size={18} className="text-muted" />}
            </button>
          ))}
        </Section>

        <section className="px-4 pt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Unidades</h2>
          <div className="mt-2"><Segmented label="Unidades" value={units} onChange={setUnits} options={[{ value: "km", label: "Kilómetros" }, { value: "mi", label: "Millas" }]} /></div>
        </section>

        <section className="px-4 pt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Quién ve mis rodadas</h2>
          <div className="mt-2"><Segmented label="Visibilidad de mis rodadas" value={visibility} onChange={setVisibility} options={[{ value: "todos", label: "Todos" }, { value: "amigos", label: "Amigos" }, { value: "yo", label: "Solo yo" }]} /></div>
        </section>

        <Section title="Privacidad">
          <div className="flex min-h-[56px] items-center justify-between gap-3 pl-4">
            <span><span className="block text-[15px] font-semibold">Perfil visible</span><span className="block text-xs text-muted">Otras personas pueden encontrarte en la búsqueda</span></span>
            <Toggle label="Perfil visible" checked={profilePublic} onChange={setProfilePublic} />
          </div>
          <div className="flex min-h-[56px] items-center justify-between gap-3 pl-4">
            <span><span className="block text-[15px] font-semibold">Reportes anónimos</span><span className="block text-xs text-muted">Ocultar tu nombre en reportes de la comunidad</span></span>
            <Toggle label="Reportes anónimos" checked={anonymousReports} onChange={setAnonymousReports} />
          </div>
          <LinkRow href="/permisos/ubicacion" icon={<LocateFixed size={20} />} label="Permiso de ubicación" />
          <LinkRow href="/configuracion/bloqueados" icon={<ShieldOff size={20} />} label="Usuarios bloqueados" />
        </Section>

        <Section title="Ayuda y legal">
          <LinkRow href="/ayuda" icon={<BookOpen size={20} />} label="Centro de ayuda" />
          <LinkRow href="/ayuda/contacto" icon={<LifeBuoy size={20} />} label="Contacto y soporte" />
          <LinkRow href="/legal/terminos" icon={<FileText size={20} />} label="Términos y condiciones" />
          <LinkRow href="/legal/privacidad" icon={<FileText size={20} />} label="Aviso de privacidad" />
        </Section>

        <Section title="Tus datos">
          <button onClick={() => setExported(true)} className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left">
            <Download size={20} className="text-muted" />
            <span className="flex-1"><span className="block text-[15px] font-semibold">Descargar mis datos</span>{exported && <span className="block text-xs text-brand-700">Te enviaremos un archivo a {me.email}</span>}</span>
          </button>
          <button onClick={() => setConfirm("eliminar")} className="flex min-h-[56px] w-full items-center gap-3 px-4 text-left text-risk-red">
            <Trash2 size={20} /><span className="text-[15px] font-semibold text-[#B02E2E]">Eliminar mi cuenta</span>
          </button>
        </Section>

        <div className="px-4 pt-6">
          <button onClick={() => setConfirm("salir")} className="flex min-h-[56px] w-full items-center gap-3 font-semibold text-[#B02E2E]"><LogOut size={20} />Cerrar sesión</button>
          <p className="pt-2 text-center text-xs text-muted">Waylo 0.1 · Fase de prototipo</p>
        </div>
      </div>

      <PremiumGate open={gate !== null} feature={gate ?? ""} onClose={() => setGate(null)} />
      <ConfirmSheet open={confirm === "salir"} title="¿Cerrar sesión?" text="Podrás volver a entrar con tu correo y contraseña." confirmLabel="Cerrar sesión" onConfirm={() => router.push("/login")} onClose={() => setConfirm(null)} />
      <ConfirmSheet open={confirm === "eliminar"} danger title="¿Eliminar tu cuenta?" text="Se borrarán tus rodadas, reportes y amistades. Esta acción no se puede deshacer." confirmLabel="Eliminar cuenta" onConfirm={() => router.push("/")} onClose={() => setConfirm(null)} />
    </>
  );
}
