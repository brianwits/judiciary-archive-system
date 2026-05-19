import { format } from "date-fns";
import Link from "next/link";
import { ResponsiveTableShell } from "@/components/shared/responsive-table-shell";
import { MovementStatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FileMovement } from "@/types/movement";

type MovementTableProps = {
  movements: FileMovement[];
};

export function MovementTable({ movements }: MovementTableProps) {
  if (movements.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        No file movements recorded yet.
      </p>
    );
  }

  return (
    <ResponsiveTableShell>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Case</TableHead>
            <TableHead>Checked out by</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead>Purpose</TableHead>
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
              <TableCell className="text-sm">{movement.checkedOutByName}</TableCell>
              <TableCell className="text-sm">{movement.destinationOffice}</TableCell>
              <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                {movement.purpose}
              </TableCell>
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
    </ResponsiveTableShell>
  );
}
