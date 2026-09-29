import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import Link from "next/link";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSessionProfile } from "@/lib/auth";
import {
  getArchiveStoredCases,
  getDashboardData,
  getRecentMovements,
  getRoomSummaries,
} from "@/lib/data";
import { ROLE_LABELS } from "@/types/roles";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const DynamicStorageMap = dynamic(() => import("@/components/dashboard/archive-storage-map").then((m) => ({ default: m.ArchiveStorageMap })));
const DynamicRecentMovements = dynamic(() => import("@/components/dashboard/recent-movements").then((m) => ({ default: m.RecentMovements })));
const DynamicQuickActions = dynamic(() => import("@/components/dashboard/quick-actions").then((m) => ({ default: m.QuickActions })));
const DynamicDashboardPanels = dynamic(() => import("@/components/dashboard/dashboard-panels").then((m) => ({ default: m.DashboardPanels })));

/** Skeleton for the archive storage map area. */
function StorageMapSkeleton() {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-5 w-44" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Skeleton for the recent movements table. */
function TableSkeleton() {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-3 p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-60" />
        <div className="rounded-xl border border-border/60">
          <div className="flex gap-4 border-b border-border/60 px-4 py-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 border-b border-border/40 px-4 py-3 last:border-0">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Skeleton for the quick actions card. */
function QuickActionsSkeleton() {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-3 p-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-40" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Skeleton for the dashboard panels (tabs). */
function PanelsSkeleton() {
  return (
    <Card className="rounded-2xl">
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-4 w-72" />
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 shrink-0 rounded-lg" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start justify-between gap-3 border-b border-border/40 py-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const profile = await getSessionProfile();
  const [dashboard, rooms, archiveInventory, movements] = await Promise.all([
    getDashboardData(),
    getRoomSummaries(),
    getArchiveStoredCases({ limit: 36 }),
    getRecentMovements(5),
  ]);

  const today = format(new Date(), "EEEE d MMMM yyyy");

  return (
    <div className="dashboard-page space-y-8">
      <PageHeader
        title="Archive Dashboard"
        subtitle={`Welcome back, ${profile?.fullName ?? "User"}.`}
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
        actions={
          <>
            <Link href="/audit" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              View Audit Dashboard
            </Link>
            <Link href="/cases" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              View File Details
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {dashboard.kpis.map((metric, index) => (
          <KpiCard key={metric.label} metric={metric} index={index} />
        ))}
      </div>

      <div className="contain-paint" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 480px" }}>
        <Suspense fallback={<StorageMapSkeleton />}>
          <DynamicStorageMap
            rooms={rooms}
            storedCases={archiveInventory.items}
            matchingTotal={archiveInventory.total}
            from="dashboard"
          />
        </Suspense>
      </div>

      <div
        className="grid gap-6 lg:grid-cols-3"
        style={{ contentVisibility: "auto", containIntrinsicSize: "auto 320px" }}
      >
        <div className="lg:col-span-2">
          <Suspense fallback={<TableSkeleton />}>
            <DynamicRecentMovements movements={movements} />
          </Suspense>
        </div>
        <Suspense fallback={<QuickActionsSkeleton />}>
          <DynamicQuickActions />
        </Suspense>
      </div>

      <div className="contain-paint" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 380px" }}>
        <Suspense fallback={<PanelsSkeleton />}>
          <DynamicDashboardPanels
            approvals={dashboard.approvals}
            notices={dashboard.notices}
            memos={dashboard.memos}
            broadcasts={dashboard.broadcasts}
            alerts={dashboard.alerts}
          />
        </Suspense>
      </div>
    </div>
  );
}
