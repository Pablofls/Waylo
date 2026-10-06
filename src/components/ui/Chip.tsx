interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: React.ReactNode;
}

export function Chip({ selected, icon, className = "", children, ...rest }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
        selected ? "border-brand-600 bg-brand-100 text-brand-700" : "border-line bg-white text-ink active:bg-canvas"
      } ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}
