import {
  ChartPanelSkeleton,
  PageHeaderSkeleton,
  StatGridSkeleton,
  TablePanelSkeleton,
} from "@/components/shared/page-skeletons";

export default function Loading() {
  return (
    <div className="reports-analytics-page space-y-8">
      <PageHeaderSkeleton />
      <div className="space-y-6">
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
    </div>
  );
}
