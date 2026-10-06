import { BottomNav } from "@/components/layout/BottomNav";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
      <BottomNav />
    </>
  );
}
