interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}

export function Segmented<T extends string>({ options, value, onChange, label }: Props<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl bg-canvas p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-[44px] flex-1 rounded-lg px-2 text-sm font-semibold ${value === o.value ? "bg-white text-brand-700 shadow-sm" : "text-muted"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
