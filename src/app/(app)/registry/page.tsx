import { format } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getRegistryRequests } from "@/lib/data";
import type { RegistryRequest } from "@/types/dashboard";

const STATUS_STYLES: Record<RegistryRequest["status"], string> = {
  pending: "bg-warning/15 text-warning",
  in_progress: "bg-primary/15 text-primary",
  completed: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

export default async function RegistryPage() {
  const requests = await getRegistryRequests();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registry Operations"
        subtitle={`${requests.length} active registry service requests`}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case number</TableHead>
              <TableHead>Request type</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-medium">{req.caseNumber}</TableCell>
                <TableCell className="text-sm">{req.requestType}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{req.requester}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[req.status])}>
                    {req.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(req.createdAt), "d MMM yyyy")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
