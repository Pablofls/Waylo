export function Stepper({ step, total }: { step: number; total: number }) {
  return (
    <div role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} aria-label={`Paso ${step} de ${total}`}>
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-brand-600" : "bg-line"}`} />
        ))}
      </div>
      <p className="mt-2 text-xs font-semibold text-muted">
        Paso {step} de {total}
      </p>
    </div>
  );
}
