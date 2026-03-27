import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <MobileNav />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
