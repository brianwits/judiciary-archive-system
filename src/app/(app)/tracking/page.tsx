import { MovementTable } from "@/components/tracking/movement-table";
import { CheckoutForm } from "@/components/tracking/checkout-form";
import { CheckinForm } from "@/components/tracking/checkin-form";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMovements } from "@/lib/data";

export default async function TrackingPage() {
  const movements = await getMovements();
  const openMovements = movements.filter(
    (m) => m.status === "checked_out" || m.status === "in_transit" || m.status === "overdue",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="File Tracking"
        subtitle="Checkout, check-in, and monitor physical file movements"
      />

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
          <MovementTable movements={movements} />
        </CardContent>
      </Card>
    </div>
  );
}
