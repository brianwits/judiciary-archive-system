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
    <Card className="group/card min-h-[132px] border-border/50 bg-gradient-to-br from-card to-muted/35 shadow-[var(--shadow-premium)] ring-1 ring-border/45 transition-[box-shadow] duration-300 hover:shadow-[0_14px_28px_-8px_rgb(0_0_0/0.14)]">
      <CardContent className="flex items-start justify-between pt-4">
        <div className="space-y-2">
          <p className="text-label">{metric.label}</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{metric.value}</p>
          {metric.trend && (
            <p className={cn("text-xs font-medium", trendColor)}>{metric.trend}</p>
          )}
          {metric.progress !== undefined && (
            <Progress value={metric.progress} className="mt-2 h-2 w-full max-w-[140px]" />
          )}
        </div>
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 will-change-transform group-hover/card:scale-105",
            metric.variant === "danger" && "bg-destructive/10 text-destructive",
            metric.variant === "warning" && "bg-warning/10 text-warning",
            metric.variant === "success" && "bg-success/10 text-success",
            (!metric.variant || metric.variant === "default") && "bg-accent/10 text-accent",
          )}
        >
          <Icon className="size-6" />
        </div>
      </CardContent>
    </Card>
  );
}
