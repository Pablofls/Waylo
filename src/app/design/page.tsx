import { Plus, MapPin, Bike, Inbox } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { SafetyScoreBadge } from "@/components/domain/SafetyScoreBadge";
import { StatBlock } from "@/components/domain/StatBlock";
import { RouteOptionCard } from "@/components/domain/RouteOptionCard";
import { AlertBanner } from "@/components/domain/AlertBanner";
import { BottomNav } from "@/components/layout/BottomNav";
import { Logo } from "@/components/layout/Logo";
import { mockRoutes } from "@/mocks/routes";

const brand = [
  { n: "brand-900", h: "#072E28", u: "Fondos oscuros, navegación nocturna" },
  { n: "brand-700", h: "#0B5247", u: "Presionado, encabezados" },
  { n: "brand-600", h: "#0F6B5C", u: "Color principal" },
  { n: "brand-500", h: "#13896F", u: "Hover, acentos" },
  { n: "brand-100", h: "#E3F2EE", u: "Fondos suaves, chips" },
];
const neutral = [
  { n: "ink", h: "#111418" }, { n: "muted", h: "#5B6470" }, { n: "line", h: "#E2E5E8" }, { n: "canvas", h: "#F6F7F7" }, { n: "white", h: "#FFFFFF" },
];
const risk = [
  { n: "brand-500 (riesgo bajo)", h: "#13896F" }, { n: "risk-yellow", h: "#F2C94C" }, { n: "risk-orange", h: "#E8833A" }, { n: "risk-red", h: "#D64545" },
];

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-10">
      <h2 className="text-2xl font-bold">{title}</h2>
      {note && <p className="mt-1 max-w-2xl text-sm text-muted">{note}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Swatch({ n, h, u, border }: { n: string; h: string; u?: string; border?: boolean }) {
  return (
    <div className="w-[150px]">
      <div className={`h-16 rounded-lg ${border ? "border border-line" : ""}`} style={{ background: h }} />
      <p className="mt-2 text-sm font-semibold">{n}</p>
      <p className="font-mono text-xs text-muted">{h}</p>
      {u && <p className="mt-0.5 text-xs text-muted">{u}</p>}
    </div>
  );
}

export default function DesignPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-10 md:px-8">
      <header className="pb-10">
        <Logo size="xl" />
        <p className="mt-3 text-lg font-semibold">Guía de estilo</p>
        <p className="mt-1 max-w-xl text-muted">Un solo color de marca, mucho contraste y números grandes. El verde marino es la marca; el riesgo nunca usa verde.</p>
      </header>

      <Section title="Color de marca">
        <div className="flex flex-wrap gap-4">{brand.map((c) => <Swatch key={c.n} {...c} border={c.n === "brand-100"} />)}</div>
        <h3 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-muted">Neutros</h3>
        <div className="flex flex-wrap gap-4">{neutral.map((c) => <Swatch key={c.n} {...c} border />)}</div>
      </Section>

      <Section title="Escala de riesgo" note="Para el mapa de calor, la ruta y las alertas. Va de verde (riesgo bajo, zona segura) a rojo (riesgo alto), pasando por amarillo y naranja.">
        <div className="flex flex-wrap gap-4">{risk.map((c) => <Swatch key={c.n} {...c} />)}</div>
        <div className="mt-6 h-6 max-w-md rounded-md" style={{ background: "linear-gradient(to right, #13896F, #F2C94C, #E8833A, #D64545)" }} role="img" aria-label="Escala del mapa de calor de menor a mayor riesgo" />
        <div className="mt-1 flex max-w-md justify-between text-xs text-muted"><span>Bajo</span><span>Alto</span></div>
      </Section>

      <Section title="Tipografía" note="Inter para la interfaz. Barlow Condensed en peso grueso para métricas: tiempo, distancia, velocidad y Safety Score.">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <p className="text-3xl font-bold">Llega seguro</p>
            <p className="text-xl font-bold">Rutas pensadas para ti</p>
            <p className="text-base">Texto base de 16 px para lectura rápida antes de salir.</p>
            <p className="text-sm text-muted">Texto secundario de 14 px, para detalles y apoyo.</p>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Etiqueta de métrica</p>
          </div>
          <div className="flex flex-wrap items-end gap-8">
            <StatBlock size="xl" value="27:45" label="Tiempo" />
            <StatBlock size="lg" value="14.2" unit="km/h" label="Velocidad" />
            <StatBlock size="md" value="6.6" unit="km" label="Distancia" />
          </div>
        </div>
      </Section>

      <Section title="Botones" note="Altura mínima de 48 px (56 px en acciones principales).">
        <div className="flex flex-wrap items-center gap-3">
          <Button size="lg">Continuar</Button>
          <Button>Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="outline">Contorno</Button>
          <Button variant="ghost">Texto</Button>
          <Button variant="dark">Oscuro</Button>
          <Button variant="danger">Terminar</Button>
          <Button icon={<Plus size={20} />}>Con ícono</Button>
          <Button disabled>Deshabilitado</Button>
        </div>
      </Section>

      <Section title="Chips y badges">
        <div className="flex flex-wrap gap-2">
          <Chip selected icon={<Bike size={18} />}>Bicicleta</Chip>
          <Chip>Scooter</Chip>
          <Chip icon={<MapPin size={18} />}>San Pedro</Chip>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge tone="neutral">Enviado</Badge>
          <Badge tone="yellow">En revisión por el municipio</Badge>
          <Badge tone="brand">Atendido</Badge>
          <Badge tone="orange">Falta completar</Badge>
          <Badge tone="red">Alerta nueva</Badge>
        </div>
      </Section>

      <Section title="Safety Score" note="80 a 100 usa el verde de marca, 60 a 79 naranja y menos de 60 rojo.">
        <div className="flex flex-wrap items-end gap-8">
          <SafetyScoreBadge size="lg" score={88} showLabel />
          <SafetyScoreBadge size="lg" score={72} showLabel />
          <SafetyScoreBadge size="lg" score={44} showLabel />
          <SafetyScoreBadge score={91} />
          <SafetyScoreBadge score={64} />
          <SafetyScoreBadge size="sm" score={52} />
        </div>
      </Section>

      <Section title="Tarjetas">
        <div className="grid max-w-3xl gap-3 md:grid-cols-2">
          <RouteOptionCard route={mockRoutes[1]} />
          <RouteOptionCard route={mockRoutes[2]} selected recommended />
          <Card>
            <p className="text-sm font-semibold text-muted">Tu mes</p>
            <div className="mt-2 flex gap-8"><StatBlock value="112.4" unit="km" label="Recorridos" /><StatBlock value="18" label="Rodadas" /></div>
          </Card>
          <div className="space-y-2">
            <AlertBanner tone="orange" title="Bache a 150 m" text="Carril derecho, Av. Universidad." />
            <AlertBanner tone="red" title="Accidente adelante" text="Av. Constitución y Zaragoza." />
          </div>
        </div>
      </Section>

      <Section title="Barra inferior" note="Cinco pestañas. Grabar es el botón central destacado.">
        <div className="max-w-[390px] overflow-hidden rounded-card border border-line"><BottomNav activeOverride="/mapa" /></div>
      </Section>

      <Section title="Estados">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-0"><EmptyState icon={<Inbox size={26} />} title="Aún no tienes reportes" text="Cuando reportes algo en el camino aparecerá aquí con su estado." action={<Button variant="secondary">Hacer un reporte</Button>} /></Card>
          <Card className="space-y-3">
            <p className="text-sm font-semibold text-muted">Cargando</p>
            <Skeleton className="h-6 w-2/3" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" />
          </Card>
          <Card className="p-0"><ErrorState onRetry={undefined} /></Card>
        </div>
      </Section>
    </main>
  );
}
