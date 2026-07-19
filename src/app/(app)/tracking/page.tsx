import { AlertTriangle, ArchiveRestore, Clock3, Truck } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, type ElementType } from "react";
import { CheckoutForm } from "@/components/tracking/checkout-form";
import { CheckinForm } from "@/components/tracking/checkin-form";
import { PageHeader } from "@/components/layout/page-header";
import { TablePanelSkeleton } from "@/components/shared/page-skeletons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { DEFAULT_PAGE_SIZE } from "@/contracts/queries";
import { getMovementSummary, getMovements, getOpenMovements } from "@/lib/data";
import { MOVEMENT_VIEW_STATUSES } from "@/lib/movement-utils";
import { cn } from "@/lib/utils";
import type { MovementFilters, MovementViewStatus } from "@/types/movement";

const DynamicMovementTable = dynamic(() =>
  import("@/components/tracking/movement-table").then((m) => ({ default: m.MovementTable })),
);

type TrackingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TrackingPage({ searchParams }: TrackingPageProps) {
  const params = await searchParams;
  const filters = parseMovementFilters(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title="File Tracking"
        subtitle="Checkout, check-in, and monitor physical file movements"
      />
      <Suspense fallback={<TrackingPageSkeleton />}>
        <TrackingPageContent filters={filters} />
      </Suspense>
    </div>
  );
}

async function TrackingPageContent({ filters }: { filters: MovementFilters }) {
  const [movements, openMovements, summary] = await Promise.all([
    getMovements({ page: 1, pageSize: DEFAULT_PAGE_SIZE }, filters),
    getOpenMovements(filters),
    getMovementSummary(filters),
  ]);

  const familyOptions = [...new Set([...movements, ...openMovements].map((movement) => movement.caseFamily))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Open files"
          value={summary.openCount}
          icon={ArchiveRestore}
          detail="Checked out, in transit, or overdue"
        />
        <SummaryCard
          title="Overdue"
          value={summary.overdueCount}
          icon={AlertTriangle}
          detail="Require immediate return follow-up"
          tone="danger"
        />
        <SummaryCard
          title="In transit"
          value={summary.inTransitCount}
          icon={Truck}
          detail="Currently moving between offices"
        />
        <SummaryCard
          title="Returned today"
          value={summary.returnedTodayCount}
          icon={Clock3}
          detail="Completed returns recorded today"
        />
      </div>

      <MovementFilterBar filters={filters} families={familyOptions} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Check out file</CardTitle>
            <CardDescription>Record a new file movement from the archive</CardDescription>
          </CardHeader>
          <CardContent>
            <CheckoutForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Check in file</CardTitle>
            <CardDescription>Mark an outstanding checkout as returned</CardDescription>
          </CardHeader>
          <CardContent>
            <CheckinForm openMovements={openMovements} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Movement history</CardTitle>
          <CardDescription>All file checkouts and returns</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<TablePanelSkeleton rows={7} />}>
            <DynamicMovementTable movements={movements} />
          </Suspense>
        </CardContent>
      </Card>
    </>
  );
}

function parseMovementFilters(
  params: Record<string, string | string[] | undefined>,
): MovementFilters {
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const status = first(params.status);
  const family = first(params.family);

  return {
    ...(MOVEMENT_VIEW_STATUSES.includes((status ?? "all") as MovementViewStatus)
      ? { status: status as MovementViewStatus }
      : {}),
    ...(family && family !== "all" ? { family } : {}),
  };
}

function SummaryCard({
  title,
  value,
  detail,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: number;
  detail: string;
  icon: ElementType;
  tone?: "default" | "danger";
}) {
  return (
    <Card className={cn("border-border/70", tone === "danger" ? "border-destructive/30" : "")}>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value.toLocaleString()}</p>
          <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-2xl border bg-muted/40",
            tone === "danger" ? "border-destructive/30 text-destructive" : "border-border/70 text-primary",
          )}
        >
          <Icon className="size-4.5" aria-hidden />
        </div>
      </CardContent>
    </Card>
  );
}

function MovementFilterBar({
  filters,
  families,
}: {
  filters: MovementFilters;
  families: string[];
}) {
  const activeStatus = filters.status ?? "all";
  const activeFamily = filters.family ?? "all";

  function href(next: { status?: string; family?: string }) {
    const params = new URLSearchParams();
    const status = next.status ?? activeStatus;
    const family = next.family ?? activeFamily;
    if (status && status !== "all") params.set("status", status);
    if (family && family !== "all") params.set("family", family);
    const query = params.toString();
    return query ? `/tracking?${query}` : "/tracking";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Operational focus</CardTitle>
        <CardDescription>Filter movement work by status and case family.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {MOVEMENT_VIEW_STATUSES.map((status) => (
            <Link
              key={status}
              href={href({ status })}
              className={cn(buttonVariants({ variant: activeStatus === status ? "default" : "outline", size: "sm" }))}
            >
              {status === "all"
                ? "All"
                : status === "open"
                  ? "Open"
                  : status === "overdue"
                    ? "Overdue"
                    : "Returned"}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={href({ family: "all" })}
            className={cn(buttonVariants({ variant: activeFamily === "all" ? "default" : "outline", size: "sm" }))}
          >
            All families
          </Link>
          {families.map((family) => (
            <Link
              key={family}
              href={href({ family })}
              className={cn(buttonVariants({ variant: activeFamily === family ? "default" : "outline", size: "sm" }))}
            >
              {family}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TrackingPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TablePanelSkeleton rows={2} />
        <TablePanelSkeleton rows={2} />
        <TablePanelSkeleton rows={2} />
        <TablePanelSkeleton rows={2} />
      </div>
      <TablePanelSkeleton rows={4} />
      <div className="grid gap-6 lg:grid-cols-2">
        <TablePanelSkeleton rows={4} />
        <TablePanelSkeleton rows={4} />
      </div>
      <TablePanelSkeleton rows={7} />
    </div>
  );
}
