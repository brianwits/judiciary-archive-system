"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import {
  ChartPanelSkeleton,
  StatGridSkeleton,
} from "@/components/shared/page-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

type ReportData = {
  archiveGrowth: { month: string; count: number }[];
  missingTrend: { month: string; count: number }[];
  movementFrequency: { week: string; checkouts: number; returns: number }[];
  divisionStats: { name: string; value: number }[];
  retrievalPerformance: { division: string; avgHours: number }[];
  scanningPerformance: { day: string; scans: number }[];
};

/**
 * Lightweight chunk — only imports lucide icons + Card components, no recharts.
 * Renders immediately so the user sees KPI statistics while the charts load.
 */
const DynamicOverviewStats = dynamic(
  () => import("@/components/reports/sections/reports-overview-stats").then((mod) => mod.ReportsOverviewStats),
  {
    ssr: false,
    loading: () => <StatGridSkeleton />,
  },
);

/**
 * Heavy chunk — imports all of recharts (Area, Bar, Pie, Line charts, etc.)
 * Loads and parses asynchronously after the stats are visible.
 */
const DynamicReportCharts = dynamic(
  () => import("@/components/reports/charts").then((mod) => mod.ReportCharts),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <ChartPanelSkeleton tall />
          <ChartPanelSkeleton tall />
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-[340px] w-full rounded-3xl" />
          <Skeleton className="h-[340px] w-full rounded-3xl" />
        </div>
      </div>
    ),
  },
);

export function LazyReportCharts({ data }: { data: ReportData }) {
  return (
    <div className="space-y-8">
      {/* Stats row loads first — lightweight, no recharts */}
      <Suspense fallback={<StatGridSkeleton />}>
        <DynamicOverviewStats data={data} />
      </Suspense>

      {/* Charts load in separate chunk — heavy recharts bundle */}
      <Suspense fallback={
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <ChartPanelSkeleton tall />
            <ChartPanelSkeleton tall />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <Skeleton className="h-[340px] w-full rounded-3xl" />
            <Skeleton className="h-[340px] w-full rounded-3xl" />
          </div>
        </div>
      }>
        <DynamicReportCharts data={data} />
      </Suspense>
    </div>
  );
}
