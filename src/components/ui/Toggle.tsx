interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: Props) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex h-11 w-[60px] shrink-0 items-center justify-center"
    >
      <span className={`relative h-8 w-[52px] rounded-full transition-colors ${checked ? "bg-brand-600" : "bg-[#C9CED3]"}`}>
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${checked ? "left-[24px]" : "left-1"}`} />
      </span>
    </button>
  );
}
