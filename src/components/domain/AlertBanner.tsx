import { TriangleAlert } from "lucide-react";

interface Props {
  title: string;
  text: string;
  tone?: "orange" | "red";
}

export function AlertBanner({ title, text, tone = "orange" }: Props) {
  const bg = tone === "red" ? "bg-risk-red text-white" : "bg-risk-orange text-ink";
  return (
    <div role="alert" className={`flex items-center gap-3 rounded-xl ${bg} px-4 py-3`}>
      <TriangleAlert size={26} className="shrink-0" />
      <div className="min-w-0">
        <p className="text-[15px] font-bold leading-tight">{title}</p>
        <p className="text-sm">{text}</p>
      </div>
    </div>
  );
}
