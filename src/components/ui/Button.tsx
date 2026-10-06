import Link from "next/link";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "dark" | "danger";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white active:bg-brand-700 hover:bg-brand-500",
  secondary: "bg-brand-100 text-brand-700 active:bg-[#CFE7E0]",
  outline: "border border-line bg-white text-ink active:bg-canvas",
  ghost: "text-brand-600 active:bg-brand-100",
  dark: "bg-brand-900 text-white active:bg-brand-700",
  danger: "bg-risk-red text-white active:bg-[#B93A3A]",
};
const sizes: Record<Size, string> = { md: "min-h-[48px] px-5 text-base", lg: "min-h-[56px] px-6 text-lg" };

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  href?: string;
  icon?: React.ReactNode;
}

export function Button({ variant = "primary", size = "md", full, href, icon, className = "", children, ...rest }: Props) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${full ? "w-full" : ""} ${className}`;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {icon}
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {icon}
      {children}
    </button>
  );
}
