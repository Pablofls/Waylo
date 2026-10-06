import { AlertCircle } from "lucide-react";
import { Button } from "./Button";

export function EmptyState({ icon, title, text, action }: { icon?: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {icon && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">{icon}</div>}
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-[280px] text-sm text-muted">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "No pudimos cargar esto", text = "Revisa tu conexión e inténtalo de nuevo.", onRetry }: { title?: string; text?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F9E1E1] text-risk-red">
        <AlertCircle size={28} />
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-[280px] text-sm text-muted">{text}</p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-line ${className}`} />;
}
