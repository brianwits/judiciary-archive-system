import {
  AlertTriangle,
  Archive,
  CheckCircle,
  Clock,
  GitBranch,
  type LucideIcon,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CaseStatus } from "@/types/case";
import type { MovementStatus } from "@/types/movement";

const CASE_STATUS_STYLES: Record<CaseStatus, string> = {
  open: "border-success/35 bg-success/10 text-success",
  closed: "border-border bg-muted text-muted-foreground",
  archived: "border-primary/30 bg-primary/10 text-primary",
  missing: "border-destructive/35 bg-destructive/10 text-destructive",
  pending_return: "border-warning/35 bg-warning/10 text-warning",
};

const CASE_STATUS_ICONS: Record<CaseStatus, LucideIcon> = {
  open: CheckCircle,
  closed: XCircle,
  archived: Archive,
  missing: AlertTriangle,
  pending_return: Clock,
};

const MOVEMENT_STATUS_STYLES: Record<MovementStatus, string> = {
  checked_out: "border-primary/30 bg-primary/10 text-primary",
  in_transit: "border-warning/35 bg-warning/10 text-warning",
  returned: "border-success/35 bg-success/10 text-success",
  overdue: "border-destructive/35 bg-destructive/10 text-destructive",
};

const MOVEMENT_STATUS_ICONS: Record<MovementStatus, LucideIcon> = {
  checked_out: GitBranch,
  in_transit: Truck,
  returned: ShieldCheck,
  overdue: AlertTriangle,
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

const badgeClass =
  "inline-flex min-h-7 !h-auto items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize";

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  const Icon = CASE_STATUS_ICONS[status];
  return (
    <Badge variant="outline" className={cn(badgeClass, CASE_STATUS_STYLES[status])}>
      <Icon className="size-3 shrink-0" aria-hidden />
      {CASE_LABELS[status]}
    </Badge>
  );
}

export function MovementStatusBadge({ status }: { status: MovementStatus }) {
  const Icon = MOVEMENT_STATUS_ICONS[status];
  return (
    <Badge variant="outline" className={cn(badgeClass, MOVEMENT_STATUS_STYLES[status])}>
      <Icon className="size-3 shrink-0" aria-hidden />
      {MOVEMENT_LABELS[status]}
    </Badge>
  );
}
