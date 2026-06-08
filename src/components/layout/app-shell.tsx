import { getSessionProfile } from "@/lib/auth";
import { getNavSnapshot } from "@/lib/data";
import { type NavCounts } from "@/config/navigation";
import { redirect } from "next/navigation";
import { AppSidebar } from "./app-sidebar";
import { AppTopbar } from "./app-topbar";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");

  const navSnapshot = await getNavSnapshot();
  const navCounts: NavCounts = {
    openCases: navSnapshot.openCases,
    pendingRegistry: navSnapshot.pendingRegistry,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar role={profile.role} navCounts={navCounts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar profile={profile} navCounts={navCounts} alerts={navSnapshot.alerts} />
        <main className="flex-1 overflow-y-auto bg-background p-4 pb-10 md:p-6 md:pb-12 lg:p-8 print:p-6 print:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
