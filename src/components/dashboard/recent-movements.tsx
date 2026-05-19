import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { MovementStatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { FileMovement } from "@/types/movement";

type RecentMovementsProps = {
  movements: FileMovement[];
};

export function RecentMovements({ movements }: RecentMovementsProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Recent File Movements</CardTitle>
          <CardDescription>Latest checkouts and returns across the archive</CardDescription>
        </div>
        <Link href="/tracking" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          View all
          <ArrowRight className="size-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {movements.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No recent movements recorded.
          </p>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Expected return</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      <Link
                        href={`/cases/${movement.caseId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {movement.caseNumber}
                      </Link>
                      <p className="text-xs text-muted-foreground">{movement.caseTitle}</p>
                    </TableCell>
                    <TableCell className="text-sm">{movement.destinationOffice}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(movement.expectedReturnDate), "d MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <MovementStatusBadge status={movement.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
