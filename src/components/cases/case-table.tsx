import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CaseRow } from "@/types/database";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export function CaseTable({ cases }: { cases: CaseRow[] }) {
  if (cases.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        No cases found. Try a different search or create a new case.
      </p>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Case number</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Court</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Filed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Link
                  href={`/cases/${item.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {item.case_number}
                </Link>
              </TableCell>
              <TableCell>{item.title}</TableCell>
              <TableCell>{item.court || "—"}</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(item.filed_date)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
