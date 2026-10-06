interface Props {
  value: string | number;
  unit?: string;
  label: string;
  size?: "md" | "lg" | "xl";
  invert?: boolean;
}

const sizes = { md: "text-4xl", lg: "text-6xl", xl: "text-8xl" };

export function StatBlock({ value, unit, label, size = "md", invert }: Props) {
  return (
    <div>
      <div className="flex items-baseline gap-1">
        <span className={`metric ${sizes[size]} ${invert ? "text-white" : "text-ink"}`}>{value}</span>
        {unit && <span className={`font-display text-xl font-semibold ${invert ? "text-white/70" : "text-muted"}`}>{unit}</span>}
      </div>
      <p className={`mt-1 text-xs font-semibold uppercase tracking-wide ${invert ? "text-white/70" : "text-muted"}`}>{label}</p>
    </div>
  );
}
