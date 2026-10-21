import { Avatar } from "./Avatar";

export function AttendeeStack({ names, total, size = 32 }: { names: string[]; total: number; size?: number }) {
  const shown = names.slice(0, 4);
  const extra = total - shown.length;
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((n) => (
          <span key={n} className="rounded-full ring-2 ring-white"><Avatar name={n} size={size} /></span>
        ))}
      </div>
      {extra > 0 && <span className="ml-2 text-sm font-semibold text-muted">+{extra}</span>}
    </div>
  );
}
