import Link from "next/link";
import { Award, Lock } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { getBadges } from "@/lib/data";

export default async function InsigniasPage() {
  const { badges } = await getBadges();
  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);
  const Grid = ({ list }: { list: typeof badges }) => (
    <ul className="grid grid-cols-3 gap-3 px-4 pt-3">
      {list.map((b) => (
        <li key={b.id}>
          <Link href={`/insignias/${b.id}`} className="flex min-h-[132px] flex-col items-center text-center">
            <span className={`flex h-16 w-16 items-center justify-center rounded-full ${b.earned ? "bg-brand-600 text-white" : "border-2 border-dashed border-line bg-canvas text-muted"}`}>{b.earned ? <Award size={30} /> : <Lock size={24} />}</span>
            <span className="mt-2 text-[13px] font-semibold leading-tight">{b.name}</span>
            <span className="text-xs text-muted">{b.progress}/{b.goal}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
  return (
    <>
      <ScreenHeader title="Insignias" subtitle={`${earned.length} de ${badges.length} conseguidas`} back="/perfil" />
      <div className="flex-1 overflow-y-auto bg-white pb-6">
        <h2 className="px-4 pt-3 text-sm font-bold uppercase tracking-wide text-muted">Conseguidas</h2>
        <Grid list={earned} />
        <h2 className="px-4 pt-6 text-sm font-bold uppercase tracking-wide text-muted">Por conseguir</h2>
        <Grid list={locked} />
      </div>
    </>
  );
}
