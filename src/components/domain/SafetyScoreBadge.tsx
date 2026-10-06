import { safetyTone, safetyLabel, toneClasses } from "@/lib/safety";

interface Props {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const sizes = {
  sm: { box: "h-9 min-w-[44px] px-2", num: "text-xl" },
  md: { box: "h-12 min-w-[56px] px-3", num: "text-3xl" },
  lg: { box: "h-20 min-w-[96px] px-4", num: "text-6xl" },
};

export function SafetyScoreBadge({ score, size = "md", showLabel }: Props) {
  const tone = toneClasses[safetyTone(score)];
  const s = sizes[size];
  return (
    <div className="inline-flex flex-col items-start" aria-label={`Safety Score ${score} de 100, ${safetyLabel(score)}`}>
      <div className={`inline-flex items-baseline justify-center gap-0.5 rounded-lg ${tone.soft} ${s.box} items-center`}>
        <span className={`metric ${tone.text} ${s.num}`}>{score}</span>
        {size === "lg" && <span className={`metric text-xl ${tone.text} opacity-70`}>/100</span>}
      </div>
      {showLabel && <span className={`mt-1 text-xs font-semibold ${tone.text}`}>{safetyLabel(score)}</span>}
    </div>
  );
}
