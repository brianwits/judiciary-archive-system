import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { LazyDashboardStatistics } from "@/components/dashboard/lazy-dashboard-statistics";
import { PageHeader } from "@/components/layout/page-header";
import { getSessionProfile } from "@/lib/auth";
import { getDashboardData, getReportData } from "@/lib/data";
import { ROLE_LABELS } from "@/types/roles";
import { Suspense } from "react";
import { ChartPanelSkeleton, StatGridSkeleton } from "@/components/shared/page-skeletons";

export default async function DashboardPage() {
  const [profile, dashboard] = await Promise.all([
    getSessionProfile(),
    getDashboardData(),
  ]);

  const today = format(new Date(), "EEEE d MMMM yyyy");

  return (
    <div className="dashboard-page space-y-8">
      <PageHeader
        title="Archive Dashboard"
        subtitle={`Welcome back, ${profile?.fullName ?? "User"}. Court: Kabarnet Law Courts.`}
        meta={
          <>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5 shrink-0" aria-hidden />
              <span className="sr-only">Today: </span>
              {today}
            </span>
            {profile ? (
              <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 font-medium text-foreground/90">
                {ROLE_LABELS[profile.role]}
              </span>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboard.kpis.map((metric, index) => (
          <KpiCard key={metric.label} metric={metric} index={index} />
        ))}
      </div>

      <div className="contain-paint" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 760px" }}>
        <Suspense fallback={<DashboardStatisticsSkeleton />}>
          <DashboardStatistics />
        </Suspense>
      </div>
    </div>
  );
}

async function DashboardStatistics() {
  const reportData = await getReportData();
  return <LazyDashboardStatistics data={reportData} />;
}

function DashboardStatisticsSkeleton() {
  return (
    <div className="space-y-6">
      <StatGridSkeleton cards={3} />
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <ChartPanelSkeleton />
        <ChartPanelSkeleton />
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ChartPanelSkeleton />
        <ChartPanelSkeleton />
      </div>
    </div>
  );
}
