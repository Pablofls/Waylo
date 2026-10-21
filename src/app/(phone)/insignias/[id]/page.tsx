import { notFound } from "next/navigation";
import { Award, Lock } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Button } from "@/components/ui/Button";
import { getBadges } from "@/lib/data";

export default async function InsigniaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { badges } = await getBadges();
  const b = badges.find((x) => x.id === id);
  if (!b) notFound();
  const pct = Math.round((b.progress / b.goal) * 100);
  return (
    <>
      <ScreenHeader title="Insignia" back="/insignias" />
      <div className="flex-1 overflow-y-auto bg-white px-4 pb-6 pt-4 text-center">
        <span className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full ${b.earned ? "bg-brand-600 text-white" : "border-2 border-dashed border-line bg-canvas text-muted"}`}>{b.earned ? <Award size={52} /> : <Lock size={44} />}</span>
        <h1 className="mt-4 text-2xl font-bold">{b.name}</h1>
        <p className="mt-1 text-muted">{b.description}</p>
        <div className="mt-6 text-left">
          <div className="flex items-baseline justify-between"><span className="text-sm font-semibold">{b.earned ? "Conseguida" : "Tu progreso"}</span><span className="metric text-2xl">{b.progress}/{b.goal}</span></div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} /></div>
        </div>
        <div className="mt-6 rounded-card bg-canvas p-4 text-left"><p className="text-sm font-bold">Cómo conseguirla</p><p className="mt-1 text-[15px]">{b.howTo}</p></div>
        {!b.earned && <Button href="/rodada" full size="lg" className="mt-6">Salir a rodar</Button>}
      </div>
    </>
  );
}
