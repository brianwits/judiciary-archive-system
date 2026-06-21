import dynamic from "next/dynamic";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/tracking/checkout-form";
import { CheckinForm } from "@/components/tracking/checkin-form";
import { PageHeader } from "@/components/layout/page-header";

const DynamicMovementTable = dynamic(() => import("@/components/tracking/movement-table").then((m) => ({ default: m.MovementTable })));
import { TablePanelSkeleton } from "@/components/shared/page-skeletons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEFAULT_PAGE_SIZE } from "@/contracts/queries";
import { getMovements, getOpenMovements } from "@/lib/data";

export default async function TrackingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="File Tracking"
        subtitle="Checkout, check-in, and monitor physical file movements"
      />
      <Suspense fallback={<TrackingPageSkeleton />}>
        <TrackingPageContent />
      </Suspense>
    </div>
  );
}

async function TrackingPageContent() {
  const [movements, openMovements] = await Promise.all([
    getMovements({ page: 1, pageSize: DEFAULT_PAGE_SIZE }),
    getOpenMovements(),
  ]);

  return (
    <>
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

function TrackingPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <TablePanelSkeleton rows={4} />
        <TablePanelSkeleton rows={4} />
      </div>
      <TablePanelSkeleton rows={7} />
    </div>
  );
}
