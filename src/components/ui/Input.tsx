interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function Input({ label, hint, id, className = "", ...rest }: Props) {
  const inputId = id ?? `in-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold">
        {label}
      </label>
      <input
        id={inputId}
        className="min-h-[52px] w-full rounded-xl border border-line bg-white px-4 text-base placeholder:text-[#8A929C] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
        {...rest}
      />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
