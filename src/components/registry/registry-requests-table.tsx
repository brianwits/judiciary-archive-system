"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import { updateRegistryRequestStatus } from "@/app/actions/registry";
import { REGISTRY_STATUSES } from "@/contracts/registry";
import { ResponsiveTableShell } from "@/components/shared/responsive-table-shell";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { RegistryRequest } from "@/types/dashboard";

const STATUS_STYLES: Record<RegistryRequest["status"], string> = {
  pending: "bg-warning/15 text-warning",
  in_progress: "bg-primary/15 text-primary",
  completed: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

type RegistryRequestsTableProps = {
  requests: RegistryRequest[];
  canUpdate: boolean;
};

export function RegistryRequestsTable({ requests, canUpdate }: RegistryRequestsTableProps) {
  const [pending, startTransition] = useTransition();

  function handleStatusChange(requestId: string, status: RegistryRequest["status"]) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("requestId", requestId);
      formData.set("status", status);
      const result = await updateRegistryRequestStatus(formData);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Registry request updated.");
    });
  }

  if (requests.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        No registry requests in the queue.
      </p>
    );
  }

  return (
    <ResponsiveTableShell>
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
              <TableCell className="font-medium">
                <Link href={`/cases?q=${encodeURIComponent(req.caseNumber)}`} className="hover:underline">
                  {req.caseNumber}
                </Link>
              </TableCell>
              <TableCell className="text-sm">{req.requestType}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{req.requester}</TableCell>
              <TableCell>
                {canUpdate ? (
                  <Select
                    value={req.status}
                    disabled={pending}
                    onValueChange={(value) =>
                      handleStatusChange(req.id, value as RegistryRequest["status"])
                    }
                  >
                    <SelectTrigger className="h-8 w-[150px] border-0 bg-transparent p-0 shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REGISTRY_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className={cn("capitalize", STATUS_STYLES[req.status])}>
                    {req.status.replace("_", " ")}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(req.createdAt), "d MMM yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ResponsiveTableShell>
  );
}
