"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { ChartPanelSkeleton, StatGridSkeleton } from "@/components/shared/page-skeletons";
import type { ReportData } from "@/lib/reports-computations";

const DynamicDashboardStatisticsCharts = dynamic(
  () => import("@/components/dashboard/dashboard-statistics-charts").then((mod) => mod.DashboardStatisticsCharts),
  {
    ssr: false,
    loading: () => (
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
    ),
  },
);

export function LazyDashboardStatistics({ data }: { data: ReportData }) {
  return (
    <Suspense
      fallback={
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
      }
    >
      <DynamicDashboardStatisticsCharts data={data} />
    </Suspense>
  );
}
