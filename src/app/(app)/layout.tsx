import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// All authenticated pages fetch live data — skip static prerendering
export const dynamic = "force-dynamic";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <AppShell>{children}</AppShell>
      <Toaster />
    </TooltipProvider>
  );
}
