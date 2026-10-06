interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
}

export function Slider({ value, onChange, min = 0, max = 100, step = 1, label }: Props) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      className="waylo-range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      style={{ ["--fill" as string]: `${fill}%` }}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}
