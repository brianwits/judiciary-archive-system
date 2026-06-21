"use client";

import Link from "next/link";
import { format } from "date-fns";
import { FileText, Truck } from "lucide-react";
import { CaseStatusBadge, MovementStatusBadge } from "@/components/shared/status-badge";
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
import type { CaseFile } from "@/types/case";
import type { FileMovement } from "@/types/movement";

type SearchResultsProps = {
  query: string;
  cases: CaseFile[];
  movements: FileMovement[];
};

export function SearchResults({ query, cases, movements }: SearchResultsProps) {
  if (!query.trim()) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Enter a case number, party name, or destination office to search across cases and file movements.
      </p>
    );
  }

  const total = cases.length + movements.length;

  if (total === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        No results for &ldquo;{query}&rdquo;. Try a case number, party name, or office name.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {total} result{total === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
      </p>

      {cases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4" />
              Cases ({cases.length})
            </CardTitle>
            <CardDescription>Matching case files in the archive index</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case number</TableHead>
                  <TableHead>Parties</TableHead>
                  <TableHead>Case type</TableHead>
                  <TableHead>Family</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.caseNumber}</TableCell>
                    <TableCell className="text-sm">
                      {item.plaintiff} v. {item.defendant}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.caseTypeFullLabel}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.caseFamily}</TableCell>
                    <TableCell>
                      <CaseStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/cases/${item.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                        Open
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {movements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="size-4" />
              File movements ({movements.length})
            </CardTitle>
            <CardDescription>Checkouts and returns matching your query</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Checked out by</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">{item.caseNumber}</TableCell>
                    <TableCell className="text-sm">{item.destinationOffice}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.checkedOutByName}</TableCell>
                    <TableCell>
                      <MovementStatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(item.createdAt), "d MMM yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
