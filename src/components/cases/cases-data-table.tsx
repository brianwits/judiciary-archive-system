"use client";

import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
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
  docCountByCaseId: Record<string, number>;
  selectedIds: string[];
  onToggleOne: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
};

export function CasesDataTable({
  cases,
  docCountByCaseId,
  selectedIds,
  onToggleOne,
  onToggleAll,
}: CasesDataTableProps) {
  const allSelected = cases.length > 0 && selectedIds.length === cases.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

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
            <TableHead className="w-10">
              <input
                type="checkbox"
                className="size-4 rounded border-input"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={(event) => onToggleAll(event.target.checked)}
                aria-label="Select all cases on this page"
              />
            </TableHead>
            <TableHead>Case number</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Parties</TableHead>
            <TableHead className="text-center">Docs</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Archive code</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((caseFile) => {
            const checked = selectedIds.includes(caseFile.id);
            return (
              <TableRow key={caseFile.id} data-state={checked ? "selected" : undefined}>
                <TableCell>
                  <input
                    type="checkbox"
                    className="size-4 rounded border-input"
                    checked={checked}
                    onChange={(event) => onToggleOne(caseFile.id, event.target.checked)}
                    aria-label={`Select ${caseFile.caseNumber}`}
                  />
                </TableCell>
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
                <TableCell className="text-center">
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <FileText className="size-3.5" />
                    {docCountByCaseId[caseFile.id] ?? 0}
                  </span>
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
            );
          })}
        </TableBody>
      </Table>
    </ResponsiveTableShell>
  );
}
