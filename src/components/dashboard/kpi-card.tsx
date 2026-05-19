import {
  AlertTriangle,
  Archive,
  Clock,
  FileText,
  Flag,
  FolderOpen,
  ScanLine,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { KpiMetric } from "@/types/dashboard";

const ICONS = [FolderOpen, Archive, AlertTriangle, Clock, ScanLine, FileText, Flag, Users];

type KpiCardProps = {
  metric: KpiMetric;
  index: number;
};

export function KpiCard({ metric, index }: KpiCardProps) {
  const Icon = ICONS[index % ICONS.length];

  const trendColor =
    metric.trendDirection === "up"
      ? "text-success"
      : metric.trendDirection === "down"
        ? metric.variant === "danger"
          ? "text-success"
          : "text-destructive"
        : "text-muted-foreground";

  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-start justify-between pt-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{metric.label}</p>
          <p className="text-2xl font-bold tracking-tight">{metric.value}</p>
          {metric.trend && (
            <p className={cn("text-xs font-medium", trendColor)}>{metric.trend}</p>
          )}
          {metric.progress !== undefined && (
            <Progress value={metric.progress} className="mt-2 h-2 w-full max-w-[140px]" />
          )}
        </div>
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            metric.variant === "danger" && "bg-destructive/10 text-destructive",
            metric.variant === "warning" && "bg-warning/10 text-warning",
            metric.variant === "success" && "bg-success/10 text-success",
            (!metric.variant || metric.variant === "default") && "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
