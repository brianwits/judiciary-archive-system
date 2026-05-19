import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CaseStatus } from "@/types/case";
import type { MovementStatus } from "@/types/movement";

const CASE_STATUS_STYLES: Record<CaseStatus, string> = {
  open: "bg-success/15 text-success border-success/30",
  closed: "bg-muted text-muted-foreground",
  archived: "bg-primary/15 text-primary",
  missing: "bg-destructive/15 text-destructive border-destructive/30",
  pending_return: "bg-warning/15 text-warning border-warning/30",
};

const MOVEMENT_STATUS_STYLES: Record<MovementStatus, string> = {
  checked_out: "bg-primary/15 text-primary",
  in_transit: "bg-warning/15 text-warning border-warning/30",
  returned: "bg-success/15 text-success",
  overdue: "bg-destructive/15 text-destructive",
};

const CASE_LABELS: Record<CaseStatus, string> = {
  open: "Open",
  closed: "Closed",
  archived: "Archived",
  missing: "Missing",
  pending_return: "Pending Return",
};

const MOVEMENT_LABELS: Record<MovementStatus, string> = {
  checked_out: "Checked Out",
  in_transit: "In Transit",
  returned: "Returned",
  overdue: "Overdue",
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", CASE_STATUS_STYLES[status])}>
      {CASE_LABELS[status]}
    </Badge>
  );
}

export function MovementStatusBadge({ status }: { status: MovementStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", MOVEMENT_STATUS_STYLES[status])}>
      {MOVEMENT_LABELS[status]}
    </Badge>
  );
}
