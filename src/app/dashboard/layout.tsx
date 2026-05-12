import { BottomNav } from "@/components/producer/bottom-nav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="min-h-screen bg-[#F6F6F6] pb-20">
        {children}
      </div>
      <BottomNav />
    </>
  );
}
