import {
  ChartPanelSkeleton,
  PageHeaderSkeleton,
  StatGridSkeleton,
} from "@/components/shared/page-skeletons";

export default function AppLoading() {
  return (
    <div className="dashboard-page space-y-8">
      <PageHeaderSkeleton />
      <StatGridSkeleton cards={4} />
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
