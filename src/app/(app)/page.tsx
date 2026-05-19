import { format } from "date-fns";
import Link from "next/link";
import { ArchiveStorageMap } from "@/components/dashboard/archive-storage-map";
import { DashboardPanels } from "@/components/dashboard/dashboard-panels";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentMovements } from "@/components/dashboard/recent-movements";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getSessionProfile } from "@/lib/auth";
import {
  getDashboardData,
  getRecentMovements,
  getRoomSummaries,
} from "@/lib/data";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const profile = await getSessionProfile();
  const [dashboard, rooms, movements] = await Promise.all([
    getDashboardData(),
    getRoomSummaries(),
    getRecentMovements(5),
  ]);

  const today = format(new Date(), "EEEE d MMMM yyyy");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Archive Dashboard"
        subtitle={`Welcome back, ${profile?.fullName ?? "User"} • ${today}`}
        actions={
          <>
            <Link href="/audit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              View Audit Dashboard
            </Link>
            <Link href="/cases" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              View File Details
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboard.kpis.map((metric, index) => (
          <KpiCard key={metric.label} metric={metric} index={index} />
        ))}
      </div>

      <ArchiveStorageMap rooms={rooms} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentMovements movements={movements} />
        </div>
        <QuickActions />
      </div>

      <DashboardPanels
        approvals={dashboard.approvals}
        notices={dashboard.notices}
        memos={dashboard.memos}
        broadcasts={dashboard.broadcasts}
        alerts={dashboard.alerts}
      />
    </div>
  );
}
