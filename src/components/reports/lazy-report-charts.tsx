"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import {
  ChartPanelSkeleton,
} from "@/components/shared/page-skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReportData } from "@/lib/reports-computations";

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
  );
}
