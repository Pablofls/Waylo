import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  back?: string;
  action?: React.ReactNode;
  dark?: boolean;
}

export function ScreenHeader({ title, subtitle, back, action, dark }: Props) {
  return (
    <header className={`pt-safe shrink-0 px-4 pb-3 ${dark ? "bg-brand-900 text-white" : "bg-white"}`}>
      <div className="flex min-h-[44px] items-center gap-2 pt-2">
        {back && (
          <Link href={back} aria-label="Volver" className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full active:bg-black/5">
            <ChevronLeft size={26} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold leading-tight">{title}</h1>
          {subtitle && <p className={`truncate text-sm ${dark ? "text-white/70" : "text-muted"}`}>{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
