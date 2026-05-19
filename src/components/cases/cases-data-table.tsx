"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ResponsiveTableShell } from "@/components/shared/responsive-table-shell";
import { CaseStatusBadge } from "@/components/shared/status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { CaseFile } from "@/types/case";

type CasesDataTableProps = {
  cases: CaseFile[];
};

export function CasesDataTable({ cases }: CasesDataTableProps) {
  if (cases.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        No cases match your filters. Try adjusting the criteria or register a new case.
      </p>
    );
  }

  return (
    <ResponsiveTableShell>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Case number</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Parties</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Archive code</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((caseFile) => (
            <TableRow key={caseFile.id}>
              <TableCell>
                <Link
                  href={`/cases/${caseFile.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {caseFile.caseNumber}
                </Link>
              </TableCell>
              <TableCell>
                <span className="text-sm">{caseFile.caseType}</span>
              </TableCell>
              <TableCell>
                <div className="max-w-[200px] text-sm">
                  <p className="truncate">{caseFile.plaintiff}</p>
                  <p className="truncate text-muted-foreground">v. {caseFile.defendant}</p>
                </div>
              </TableCell>
              <TableCell>
                <CaseStatusBadge status={caseFile.status} />
              </TableCell>
              <TableCell>
                <span className="font-mono text-xs">{caseFile.archiveCode}</span>
              </TableCell>
              <TableCell>
                <Link
                  href={`/cases/${caseFile.id}`}
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                >
                  View
                  <ExternalLink className="size-3.5" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ResponsiveTableShell>
  );
}
