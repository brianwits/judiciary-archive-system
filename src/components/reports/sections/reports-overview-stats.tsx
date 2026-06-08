"use client";

import {
  Activity,
  Archive,
  ArrowDownRight,
  ArrowUpRight,
  ScanLine,
  ShieldAlert,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { computeDerived, formatCompact, formatNumber, type ReportData } from "@/lib/reports-computations";

type StatTone = "emerald" | "gold" | "danger" | "blue";

function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "emerald",
  trend,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  tone?: StatTone;
  trend?: "up" | "down";
}) {
  const toneClasses = {
    emerald: "from-primary/[0.16] via-primary/[0.08] to-transparent text-primary",
    gold: "from-accent/[0.22] via-accent/[0.08] to-transparent text-accent-foreground",
    danger: "from-destructive/[0.18] via-destructive/[0.06] to-transparent text-destructive",
    blue: "from-[color:#235789]/[0.18] via-[color:#235789]/[0.06] to-transparent text-[color:#235789]",
  } satisfies Record<StatTone, string>;

  return (
    <Card className="overflow-hidden border-border/70 shadow-premium">
      <CardContent className="relative px-5 py-5">
        <div className={cn("absolute inset-x-0 top-0 h-20 bg-gradient-to-br", toneClasses[tone])} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-label">{label}</p>
            <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              {trend === "up" ? <ArrowUpRight className="size-3.5 text-success" /> : null}
              {trend === "down" ? <ArrowDownRight className="size-3.5 text-destructive" /> : null}
              <span>{detail}</span>
            </div>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/40 bg-white/80 shadow-sm backdrop-blur">
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReportsOverviewStats({ data }: { data: ReportData }) {
  const d = computeDerived(data);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Archived files"
        value={formatCompact(d.latestArchive.count)}
        detail={`Through ${d.latestArchive.month} · ${d.archiveGrowthRate >= 0 ? "+" : ""}${d.archiveGrowthRate.toFixed(1)}% vs prev`}
        icon={Archive}
        tone="emerald"
        trend={d.archiveGrowthRate >= 0 ? "up" : "down"}
      />
      <StatCard
        label="Missing risk"
        value={formatNumber(d.latestMissing.count)}
        detail={`${d.missingDelta > 0 ? "+" : ""}${d.missingDelta} vs previous month`}
        icon={ShieldAlert}
        tone="danger"
        trend={d.missingDelta <= 0 ? "down" : "up"}
      />
      <StatCard
        label="Movement recovery"
        value={`${d.movementRecovery}%`}
        detail={`${formatNumber(d.totalReturns)} returns / ${formatNumber(d.totalCheckouts)} checkouts`}
        icon={Activity}
        tone="blue"
      />
      <StatCard
        label="Weekly scans"
        value={formatNumber(d.totalScans)}
        detail={`Peak: ${d.peakScanDay.day} · ${formatNumber(d.peakScanDay.scans)} scans`}
        icon={ScanLine}
        tone="gold"
        trend="up"
      />
    </div>
  );
}
