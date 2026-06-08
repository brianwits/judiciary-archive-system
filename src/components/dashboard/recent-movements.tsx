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

const cardElevated =
  "border-border/50 shadow-[var(--shadow-premium)] ring-1 ring-border/45 transition-shadow duration-300 hover:shadow-[0_14px_28px_-8px_rgb(0_0_0/0.12)]";

export function RecentMovements({ movements }: RecentMovementsProps) {
  return (
    <Card className={cn("rounded-2xl", cardElevated)}>
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
          <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center">
            <p className="max-w-sm text-sm text-muted-foreground">
              No recent movements recorded. Open tracking to check files in and out, or browse cases.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/tracking" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
                Open tracking
              </Link>
              <Link href="/cases" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                Browse cases
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <Table className="min-w-[36rem]">
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
