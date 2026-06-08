import { Skeleton } from "@/components/ui/skeleton";

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-4 w-full max-w-2xl" />
    </div>
  );
}

export function StatGridSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: cards }).map((_, index) => (
        <Skeleton key={index} className="h-32 w-full rounded-3xl" />
      ))}
    </div>
  );
}

export function ChartPanelSkeleton({ tall = false }: { tall?: boolean }) {
  return <Skeleton className={tall ? "h-[440px] w-full rounded-3xl" : "h-[320px] w-full rounded-3xl"} />;
}

export function TablePanelSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
      <div className="space-y-3">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
