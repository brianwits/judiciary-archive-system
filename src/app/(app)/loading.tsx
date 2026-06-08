import {
  ChartPanelSkeleton,
  PageHeaderSkeleton,
  StatGridSkeleton,
  TablePanelSkeleton,
} from "@/components/shared/page-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="dashboard-page space-y-8">
      <PageHeaderSkeleton />
      <StatGridSkeleton cards={4} />
      <ChartPanelSkeleton tall />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TablePanelSkeleton rows={5} />
        </div>
        <Skeleton className="h-[min(28rem,70vh)] w-full min-h-[220px] rounded-3xl lg:min-h-[320px]" />
      </div>
      <TablePanelSkeleton rows={6} />
    </div>
  );
}
