import { format } from "date-fns";
import { ResponsiveTableShell } from "@/components/shared/responsive-table-shell";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuditLog } from "@/types/audit";

type AuditTableProps = {
  logs: AuditLog[];
};

export function AuditTable({ logs }: AuditTableProps) {
  if (logs.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        No audit entries recorded.
      </p>
    );
  }

  return (
    <ResponsiveTableShell>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Entity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {format(new Date(log.createdAt), "d MMM yyyy HH:mm")}
              </TableCell>
              <TableCell className="text-sm font-medium">{log.userName}</TableCell>
              <TableCell>
                <Badge variant="outline" className="font-mono text-xs">
                  {log.action}
                </Badge>
              </TableCell>
              <TableCell className="max-w-md text-sm">{log.description}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {log.entityType}/{log.entityId}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ResponsiveTableShell>
  );
}
