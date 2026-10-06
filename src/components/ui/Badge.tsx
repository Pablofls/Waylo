type Tone = "neutral" | "brand" | "yellow" | "orange" | "red";

const tones: Record<Tone, string> = {
  neutral: "bg-canvas text-muted border border-line",
  brand: "bg-brand-100 text-brand-700",
  yellow: "bg-[#FBF1CF] text-[#7A5F0A]",
  orange: "bg-[#FCEBDD] text-[#A8530F]",
  red: "bg-[#F9E1E1] text-[#B02E2E]",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
