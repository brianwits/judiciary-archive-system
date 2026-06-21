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
import { ReportFilters } from "@/components/reports/report-filters";
import { getReportData } from "@/lib/data";
import type { ReportFilters as ReportFilterValues } from "@/lib/reports-computations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reports & Analytics",
  description:
    "Judiciary archive performance, movement control, and digitization trends.",
};

type ReportsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const filters = parseReportFilters(params);
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
      <Suspense fallback={<div className="h-24 rounded-xl border bg-card" />}>
        <ReportFilters />
      </Suspense>
      <Suspense fallback={<ReportsPageSkeleton />}>
        <ReportsContent filters={filters} />
      </Suspense>
    </div>
  );
}

async function ReportsContent({ filters }: { filters: ReportFilterValues }) {
  const data = await getReportData(filters);

  return <LazyReportCharts data={data} />;
}

function parseReportFilters(params: Record<string, string | string[] | undefined>): ReportFilterValues {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const from = first(params.from);
  const to = first(params.to);
  const courtLevel = first(params.courtLevel);
  const caseFamily = first(params.caseFamily);
  const caseTypeId = Number(first(params.caseTypeId));
  return {
    ...(from && datePattern.test(from) ? { from } : {}),
    ...(to && datePattern.test(to) ? { to } : {}),
    ...(["High Court", "Magistrate Court"].includes(courtLevel ?? "") ? { courtLevel } : {}),
    ...(caseFamily ? { caseFamily } : {}),
    ...(Number.isInteger(caseTypeId) && caseTypeId > 0 ? { caseTypeId } : {}),
  };
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
