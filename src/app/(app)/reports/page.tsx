import type { Metadata } from "next";
import { format } from "date-fns";
import { Suspense } from "react";
import { BarChart3, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  ChartPanelSkeleton,
  PageHeaderSkeleton,
  StatGridSkeleton,
  TablePanelSkeleton,
} from "@/components/shared/page-skeletons";
import { LazyReportCharts } from "@/components/reports/lazy-report-charts";
import { getReportData } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reports & Analytics",
  description:
    "Judiciary archive performance, movement control, and digitization trends.",
};

export default async function ReportsPage() {
  return (
    <div className="reports-analytics-page space-y-8">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Judiciary archive performance, movement control, and digitization trends."
        meta={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-0.5 font-medium">
              <BarChart3 className="size-3.5 text-primary" aria-hidden />
              Operational dashboard
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              <span className="sr-only">Snapshot generated </span>
              {format(new Date(), "EEEE d MMMM yyyy · HH:mm")}
            </span>
          </>
        }
      />
      <Suspense fallback={<ReportsPageSkeleton />}>
        <ReportsContent />
      </Suspense>
    </div>
  );
}

async function ReportsContent() {
  const data = await getReportData();

  return <LazyReportCharts data={data} />;
}

function ReportsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatGridSkeleton />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <ChartPanelSkeleton tall />
        <ChartPanelSkeleton tall />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <TablePanelSkeleton rows={5} />
        <TablePanelSkeleton rows={5} />
      </div>
    </div>
  );
}
