import { Skeleton } from "./States";

/** Esqueleto genérico de pantalla: encabezado y filas. */
export function ScreenSkeleton({ rows = 5, hero = false }: { rows?: number; hero?: boolean }) {
  return (
    <div className="flex-1 bg-white" aria-busy="true" aria-label="Cargando">
      <div className="space-y-2 px-4 pt-6"><Skeleton className="h-7 w-1/2" /><Skeleton className="h-4 w-1/3" /></div>
      {hero && <div className="px-4 pt-5"><Skeleton className="h-36 w-full" /></div>}
      <div className="space-y-3 px-4 pt-5">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3"><Skeleton className="h-12 w-12 shrink-0 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /></div><Skeleton className="h-9 w-12" /></div>
        ))}
      </div>
    </div>
  );
}
