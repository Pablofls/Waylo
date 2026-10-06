export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name.split(" ").slice(0, 2).map((p) => p[0]).join("");
  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-display text-lg font-bold text-brand-700"
    >
      {initials}
    </span>
  );
}
