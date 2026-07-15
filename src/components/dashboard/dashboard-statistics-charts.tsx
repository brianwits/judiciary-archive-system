"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, ChartColumnIncreasing, LineChart as LineChartIcon, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { computeDerived, formatCompact, formatNumber, type ReportData } from "@/lib/reports-computations";
import { cn } from "@/lib/utils";
import { ChartReady } from "@/components/charts/chart-ready";

const tooltipStyle = {
  backgroundColor: "color-mix(in srgb, var(--card) 96%, white)",
  border: "1px solid color-mix(in srgb, var(--border) 76%, transparent)",
  borderRadius: "1rem",
  boxShadow: "0 24px 60px rgb(1 50 32 / 0.18)",
  color: "var(--card-foreground)",
  padding: "0.85rem 0.95rem",
};

function InsightCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{detail}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-card">
          <Icon className="size-4 text-primary" />
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden border-border/70 shadow-sm">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {action}
      </CardHeader>
      <CardContent className="h-[340px] min-h-0 min-w-0 p-5">{children}</CardContent>
    </Card>
  );
}

export function DashboardStatisticsCharts({ data }: { data: ReportData }) {
  const derived = computeDerived(data);
  const courtLevels = data.courtLevelStats.map((item) => ({
    name: item.name.replace("Environment and Land Court", "ELC"),
    value: item.value,
  }));
  const archiveTrend = data.archiveGrowth.slice(-8);
  const missingTrend = data.missingTrend.slice(-8);
  const caseTypeMix = data.caseTypeStats
    .slice(0, 6)
    .map((item) => ({
      name: item.code || item.name,
      value: item.value,
      fullLabel: item.fullLabel,
    }));

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Statistics Snapshot</h2>
          <p className="text-sm text-muted-foreground">
            Compact archive analytics for High Court, Magistrate Court, and ELC case coverage.
          </p>
        </div>
        <Link href="/reports" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Open full reports
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <InsightCard
          title="Archive Volume"
          value={formatCompact(data.totalCases)}
          detail={`${derived.latestArchive.month} closed at ${formatNumber(derived.latestArchive.count)} files`}
          icon={ChartColumnIncreasing}
        />
        <InsightCard
          title="Top Court"
          value={derived.topDivision.name}
          detail={`${formatNumber(derived.topDivision.value)} files · lead judge ${derived.topJudge.name}`}
          icon={ArrowUpRight}
        />
        <InsightCard
          title="Missing Trend"
          value={formatNumber(derived.latestMissing.count)}
          detail={`${derived.missingDelta > 0 ? "+" : ""}${derived.missingDelta} against previous month`}
          icon={ShieldAlert}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <ChartCard
          title="Archive Growth"
          description="Recent month-by-month file accumulation across all covered courts."
          action={
            <div className="rounded-2xl border border-border/70 bg-background/90 px-4 py-3 text-right shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Growth</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                {derived.archiveGrowthRate >= 0 ? "+" : ""}
                {derived.archiveGrowthRate.toFixed(1)}%
              </p>
            </div>
          }
        >
          <ChartReady>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
            <AreaChart data={archiveTrend} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboardArchiveGrowth" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="color-mix(in srgb, var(--border) 58%, transparent)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatNumber(Number(value)), "Files"]} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--primary)"
                strokeWidth={2.5}
                fill="url(#dashboardArchiveGrowth)"
              />
            </AreaChart>
          </ResponsiveContainer>
          </ChartReady>
        </ChartCard>

        <ChartCard
          title="Court Distribution"
          description="Current file concentration by court level."
          action={
            <div className="rounded-2xl border border-border/70 bg-background/90 px-4 py-3 text-right shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">Coverage</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{courtLevels.length}</p>
            </div>
          }
        >
          <ChartReady>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
            <BarChart data={courtLevels} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="color-mix(in srgb, var(--border) 58%, transparent)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatNumber(Number(value)), "Files"]} />
              <Bar dataKey="value" fill="var(--accent)" radius={[14, 14, 0, 0]} maxBarSize={54} />
            </BarChart>
          </ResponsiveContainer>
          </ChartReady>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <ChartCard
          title="Missing Files Trend"
          description="Latest monthly movement in missing-file counts."
          action={
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
              <LineChartIcon className="size-3.5 text-primary" />
              {missingTrend.at(-1)?.month ?? "N/A"}
            </div>
          }
        >
          <ChartReady>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
            <AreaChart data={missingTrend} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboardMissingTrend" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.26} />
                  <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="color-mix(in srgb, var(--border) 58%, transparent)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatNumber(Number(value)), "Missing"]} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--destructive)"
                strokeWidth={2.5}
                fill="url(#dashboardMissingTrend)"
              />
            </AreaChart>
          </ResponsiveContainer>
          </ChartReady>
        </ChartCard>

        <ChartCard
          title="Top Case Types"
          description="Highest-volume case types in the current archive dataset."
        >
          <ChartReady>
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
            <BarChart data={caseTypeMix} layout="vertical" margin={{ top: 10, right: 8, left: 24, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="color-mix(in srgb, var(--border) 58%, transparent)" />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={84}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, _name, item) => [formatNumber(Number(value)), item.payload.fullLabel]}
              />
              <Bar dataKey="value" fill="#235789" radius={[0, 14, 14, 0]} maxBarSize={34} />
            </BarChart>
          </ResponsiveContainer>
          </ChartReady>
        </ChartCard>
      </div>
    </section>
  );
}
