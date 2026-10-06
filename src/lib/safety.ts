export type SafetyTone = "brand" | "orange" | "red";

export function safetyTone(score: number): SafetyTone {
  if (score >= 80) return "brand";
  if (score >= 60) return "orange";
  return "red";
}

export function safetyLabel(score: number): string {
  if (score >= 80) return "Segura";
  if (score >= 60) return "Con precaución";
  return "Riesgosa";
}

export const toneClasses: Record<SafetyTone, { text: string; bg: string; soft: string; hex: string }> = {
  brand: { text: "text-brand-600", bg: "bg-brand-600", soft: "bg-brand-100", hex: "#0F6B5C" },
  orange: { text: "text-[#A8530F]", bg: "bg-risk-orange", soft: "bg-[#FCEBDD]", hex: "#E8833A" },
  red: { text: "text-[#B02E2E]", bg: "bg-risk-red", soft: "bg-[#F9E1E1]", hex: "#D64545" },
};
