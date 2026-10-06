export function Logo({ size = "md", tone = "dark" }: { size?: "sm" | "md" | "xl"; tone?: "dark" | "light" }) {
  const sizes = { sm: "text-2xl", md: "text-4xl", xl: "text-7xl" };
  return (
    <span
      className={`font-display font-extrabold uppercase italic leading-none tracking-tight ${sizes[size]} ${tone === "light" ? "text-white" : "text-brand-600"}`}
    >
      Waylo
    </span>
  );
}
