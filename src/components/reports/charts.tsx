"use client";

import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Clock3,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  computeDerived,
  formatCompact,
  formatNumber,
  type ReportData,
} from "@/lib/reports-computations";



const PALETTE = {
  ink: "var(--foreground)",
  card: "var(--card)",
  cardForeground: "var(--card-foreground)",
  border: "color-mix(in srgb, var(--border) 76%, transparent)",
  grid: "color-mix(in srgb, var(--border) 58%, transparent)",
  muted: "var(--muted)",
  mutedForeground: "var(--muted-foreground)",
  emerald: "var(--primary)",
  emeraldSoft: "color-mix(in srgb, var(--primary) 12%, white)",
  emeraldGlow: "color-mix(in srgb, var(--primary) 28%, transparent)",
  teal: "var(--secondary)",
  tealSoft: "color-mix(in srgb, var(--secondary) 16%, white)",
  gold: "var(--accent)",
  goldSoft: "color-mix(in srgb, var(--accent) 18%, white)",
  danger: "var(--destructive)",
  dangerSoft: "color-mix(in srgb, var(--destructive) 14%, white)",
  success: "var(--success)",
  successSoft: "color-mix(in srgb, var(--success) 14%, white)",
  warning: "var(--warning)",
  warningSoft: "color-mix(in srgb, var(--warning) 18%, white)",
  blue: "#235789",
  blueSoft: "color-mix(in srgb, #235789 16%, white)",
};

const DIVISION_COLORS = [
  PALETTE.emerald,
  PALETTE.gold,
  PALETTE.teal,
  PALETTE.success,
  PALETTE.blue,
  PALETTE.warning,
];

const tooltipStyle = {
  backgroundColor: "color-mix(in srgb, var(--card) 96%, white)",
  border: `1px solid ${PALETTE.border}`,
  borderRadius: "1rem",
  boxShadow: "0 24px 60px rgb(1 50 32 / 0.18)",
  color: PALETTE.cardForeground,
  padding: "0.85rem 0.95rem",
};

function numberFromChartValue(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

/**
 * Defers chart rendering until the container has positive dimensions.
 * Prevents Recharts' ResponsiveContainer from logging "width/height should be greater than 0"
 * when it mounts before the card layout is settled (common with next/dynamic + Suspense).
 */
function ChartReady({
  children,
  className,
  fallback,
}: {
  children: ReactNode;
  className?: string;
  /** Custom skeleton shown while the container dimensions are still zero. */
  fallback?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setReady(true);
        return true;
      }
      return false;
    };

    // Try immediately in case layout is already settled
    if (measure()) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setReady(true);
          observer.disconnect();
          break;
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("size-full", className)}>
      {ready ? children : (fallback ?? <ChartSkeletonDefault />)}
    </div>
  );
}

/** Skeleton for area / bar / line charts — subtle grid + wave pattern. */
function ChartSkeletonDefault() {
  return (
    <div className="flex size-full flex-col gap-2 p-2">
      {/* Simulated Y-axis labels */}
      <div className="flex items-end gap-3 flex-1">
        <div className="flex h-full flex-col justify-between py-1">
          <Skeleton className="h-2 w-6 rounded" />
          <Skeleton className="h-2 w-4 rounded" />
          <Skeleton className="h-2 w-3 rounded" />
        </div>
        {/* Chart area with subtle grid lines and a wave shape */}
        <div className="relative flex-1 h-full rounded-lg overflow-hidden">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between px-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-px w-full bg-border/30" />
            ))}
          </div>
          {/* Wave-like bars */}
          <div className="absolute inset-x-2 bottom-0 flex items-end gap-1.5">
            {[35, 55, 45, 65, 50, 40].map((h, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-t-sm"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          {/* X-axis skeleton bar */}
          <div className="absolute bottom-0 inset-x-2 h-px bg-border/40" />
        </div>
      </div>
      {/* Simulated X-axis labels */}
      <div className="flex justify-between px-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-2 w-7 rounded" />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for pie charts — circular placeholder + legend text lines. */
function ChartSkeletonPie() {
  return (
    <div className="flex size-full items-center gap-4 p-2">
      {/* Circle placeholder */}
      <div className="relative shrink-0 flex items-center justify-center">
        <Skeleton className="size-28 rounded-full" />
        <div className="absolute inset-3 rounded-full bg-background" />
      </div>
      {/* Legend lines */}
      <div className="flex flex-col gap-3 flex-1 min-w-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="size-2.5 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PremiumChartCard({
  title,
  description,
  value,
  insight,
  className,
  chartClassName,
  children,
}: {
  title: string;
  description: string;
  value?: string;
  insight?: string;
  className?: string;
  chartClassName?: string;
  children: ReactNode;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-border/70 shadow-sm",
        className,
      )}
    >
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {value ? (
            <div className="rounded-2xl border border-border/70 bg-background/90 px-4 py-3 text-right shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Snapshot
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
              {insight ? <p className="mt-1 text-xs text-muted-foreground">{insight}</p> : null}
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent
        className={cn(
          "min-h-0 min-w-0 p-5",
          chartClassName ?? "flex h-[340px] flex-col",
        )}
      >
        {children}
      </CardContent>
    </Card>
  );
}

function ReportChartsInner({ data }: { data: ReportData }) {
  const d = computeDerived(data);
  const averageRetrieval =
    data.retrievalPerformance.reduce((total, item) => total + item.avgHours, 0) /
    Math.max(data.retrievalPerformance.length, 1);
  const topDivision = data.divisionStats.reduce(
    (best, item) => (item.value > best.value ? item : best),
    data.divisionStats[0] ?? { name: "N/A", value: 0 },
  );
  const retrievalRanking = [...data.retrievalPerformance].sort((a, b) => a.avgHours - b.avgHours);
  const throughputSeries = data.scanningPerformance.map((item, index) => ({
    ...item,
    pace: index === 0 ? item.scans : Math.round((item.scans + data.scanningPerformance[index - 1].scans) / 2),
  }));
  const operationalRisk = [
    { name: "Missing files", value: d.latestMissing.count, fill: PALETTE.danger },
    { name: "Open returns gap", value: Math.max(d.totalCheckouts - d.totalReturns, 0), fill: PALETTE.warning },
    { name: "Slow retrieval load", value: Math.round(averageRetrieval * 3), fill: PALETTE.blue },
    { name: "Stable flow", value: Math.max(d.totalReturns, 1), fill: PALETTE.success },
  ];

  return (
    <div className="space-y-8">
      {/* Section 1: Archive growth + Division mix — rendered immediately */}
      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <PremiumChartCard
          title="Archive growth trajectory"
          description="Cumulative archival volume with recent acceleration highlighted across the latest reporting months."
          value={formatCompact(d.latestArchive.count)}
          insight={`+${Math.max(d.latestArchive.count - d.previousArchive, 0)} over the previous period`}
          chartClassName="flex h-[380px] flex-col"
        >
          <ChartReady>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
            <AreaChart data={data.archiveGrowth} margin={{ top: 12, right: 16, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id="executiveArchiveFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={PALETTE.emerald} stopOpacity={0.34} />
                  <stop offset="70%" stopColor={PALETTE.teal} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={PALETTE.teal} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={PALETTE.grid} strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: PALETTE.mutedForeground, fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: PALETTE.mutedForeground, fontSize: 12 }} tickLine={false} axisLine={false} width={52} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ stroke: PALETTE.gold, strokeWidth: 1, strokeDasharray: "4 4" }}
                formatter={(value) => [formatNumber(numberFromChartValue(value)), "Archived files"]}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={PALETTE.emerald}
                strokeWidth={3}
                fill="url(#executiveArchiveFill)"
                activeDot={{ r: 5, fill: PALETTE.gold, stroke: "white", strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={PALETTE.gold}
                strokeWidth={1.4}
                dot={false}
                strokeOpacity={0.9}
              />
            </AreaChart>
          </ResponsiveContainer>
          </ChartReady>
        </PremiumChartCard>

        <PremiumChartCard
          title="Division mix"
          description="Where archival volume is concentrated across the court system."
          value={topDivision.name}
          insight={`${formatNumber(topDivision.value)} files lead concentration`}
          chartClassName="flex h-[380px] flex-col gap-5"
        >
          <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[1fr_190px]">
            <div className="relative h-[260px] min-w-0 flex-1">
              <ChartReady fallback={<ChartSkeletonPie />}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                <PieChart>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, _name, item) => [
                      formatNumber(numberFromChartValue(value)),
                      String(item.payload.name),
                    ]}
                  />
                  <Pie
                    data={data.divisionStats}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={112}
                    paddingAngle={3}
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth={3}
                  >
                    {data.divisionStats.map((item, index) => (
                      <Cell key={item.name} fill={DIVISION_COLORS[index % DIVISION_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              </ChartReady>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Lead division
                </p>
                <p className="mt-1 text-center text-xl font-semibold text-foreground">{topDivision.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatNumber(topDivision.value)} indexed files</p>
              </div>
            </div>

            <div className="space-y-3">
              {data.divisionStats.map((item, index) => (
                <div key={item.name} className="rounded-2xl border border-border/70 bg-background/75 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: DIVISION_COLORS[index % DIVISION_COLORS.length] }}
                    />
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <span className="text-2xl font-semibold tracking-tight text-foreground">
                      {formatNumber(item.value)}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {Math.round((item.value / Math.max(d.latestArchive.count, 1)) * 100)}% share
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PremiumChartCard>
      </section>

      {/* Section 2: Movement health + Operational risk — rendered immediately */}
      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <PremiumChartCard
          title="Movement health"
          description="Weekly custody flow comparing outbound file movement against confirmed returns."
          value={`${d.movementRecovery}%`}
          insight="Return recovery across the current reporting window"
          chartClassName="flex h-[340px] flex-col"
        >
          <ChartReady>
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
            <BarChart data={data.movementFrequency} margin={{ top: 12, right: 16, left: 4, bottom: 0 }} barGap={12}>
              <CartesianGrid stroke={PALETTE.grid} strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: PALETTE.mutedForeground, fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: PALETTE.mutedForeground, fontSize: 12 }} tickLine={false} axisLine={false} width={48} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: PALETTE.emeraldGlow, opacity: 0.3 }} />
              <Bar dataKey="checkouts" name="Checkouts" fill={PALETTE.emerald} radius={[10, 10, 0, 0]} />
              <Bar dataKey="returns" name="Returns" fill={PALETTE.gold} radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </ChartReady>
        </PremiumChartCard>

        <PremiumChartCard
          title="Operational risk mix"
          description="A pie view of the current pressure points affecting custody, retrieval, and throughput."
          value={formatNumber(operationalRisk.reduce((sum, item) => sum + item.value, 0))}
          insight="Composite exception load"
          chartClassName="flex h-[340px] flex-col gap-5"
        >
          <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[1fr_180px]">
            <div className="relative h-[220px] min-w-0 flex-1">
              <ChartReady fallback={<ChartSkeletonPie />}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                <PieChart>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value, _name, item) => [
                      formatNumber(numberFromChartValue(value)),
                      String(item.payload.name),
                    ]}
                  />
                  <Pie
                    data={operationalRisk}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={100}
                    paddingAngle={3}
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth={3}
                  >
                    {operationalRisk.map((item) => (
                      <Cell key={item.name} fill={item.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              </ChartReady>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Risk view</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{d.movementRecovery}%</p>
                <p className="text-xs text-muted-foreground">recovery confidence</p>
              </div>
            </div>

            <div className="space-y-3">
              {operationalRisk.map((item) => (
                <div key={item.name} className="rounded-2xl border border-border/70 bg-background/75 px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                  </div>
                  <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">{formatNumber(item.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </PremiumChartCard>
      </section>

      {/* Section 3 + 4: Missing-file trend, Retrieval latency, Scanning cadence, Summary */}
        <section className="grid gap-6 xl:grid-cols-3">
          <PremiumChartCard
            title="Missing-file trend"
            description="Monthly unresolved exception count, styled as a compact risk signal."
            value={formatNumber(d.latestMissing.count)}
            insight="Current unresolved count"
            chartClassName="flex h-[320px] flex-col"
          >
            <ChartReady>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <LineChart data={data.missingTrend} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={PALETTE.grid} strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: PALETTE.mutedForeground, fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: PALETTE.mutedForeground, fontSize: 12 }} tickLine={false} axisLine={false} width={36} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ stroke: PALETTE.danger, strokeWidth: 1, strokeDasharray: "4 4" }}
                  formatter={(value) => [formatNumber(numberFromChartValue(value)), "Missing files"]}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={PALETTE.danger}
                  strokeWidth={3}
                  dot={{ r: 3, fill: PALETTE.danger, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: PALETTE.gold, stroke: "white", strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
            </ChartReady>
          </PremiumChartCard>

          <PremiumChartCard
            title="Retrieval latency"
            description="Fastest divisions appear first to make service leaders easy to spot."
            value={`${averageRetrieval.toFixed(1)}h`}
            insight="Cross-division average"
            className="xl:col-span-2"
            chartClassName="flex h-[320px] flex-col"
          >
            <ChartReady>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <BarChart data={retrievalRanking} layout="vertical" margin={{ top: 12, right: 22, left: 18, bottom: 0 }}>
                <CartesianGrid stroke={PALETTE.grid} strokeDasharray="4 4" horizontal={false} />
                <XAxis type="number" tick={{ fill: PALETTE.mutedForeground, fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="division"
                  type="category"
                  width={120}
                  tick={{ fill: PALETTE.mutedForeground, fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: PALETTE.goldSoft, opacity: 0.25 }}
                  formatter={(value) => [`${numberFromChartValue(value).toFixed(1)}h`, "Average retrieval"]}
                />
                <Bar dataKey="avgHours" fill={PALETTE.warning} radius={[0, 12, 12, 0]}>
                  <LabelList
                    dataKey="avgHours"
                    position="right"
                    formatter={(value) => `${numberFromChartValue(value).toFixed(1)}h`}
                    className="fill-muted-foreground text-xs"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </ChartReady>
          </PremiumChartCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <PremiumChartCard
            title="Scanning cadence"
            description="Daily throughput with a smoothed pace line to reveal consistency, not just spikes."
            value={formatNumber(d.totalScans)}
            insight={`${d.peakScanDay.day} leads weekly throughput`}
            chartClassName="flex h-[320px] flex-col"
          >
            <ChartReady>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
              <AreaChart data={throughputSeries} margin={{ top: 12, right: 16, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="scanThroughputFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={PALETTE.gold} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={PALETTE.gold} stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={PALETTE.grid} strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: PALETTE.mutedForeground, fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: PALETTE.mutedForeground, fontSize: 12 }} tickLine={false} axisLine={false} width={42} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="scans"
                  name="Scans"
                  stroke={PALETTE.gold}
                  strokeWidth={3}
                  fill="url(#scanThroughputFill)"
                  activeDot={{ r: 5, fill: PALETTE.emerald, stroke: "white", strokeWidth: 2 }}
                />
                <Line type="monotone" dataKey="pace" name="Pace line" stroke={PALETTE.emerald} strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
            </ChartReady>
          </PremiumChartCard>

          <Card className="overflow-hidden border-border/70 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Clock3 className="size-4" />
                <span className="font-medium">Summary</span>
              </div>
              <p className="text-base text-foreground leading-relaxed">
                The archive is expanding steadily (+{d.archiveGrowthRate.toFixed(1)}% growth). {" "}
                Retrieval latency averages {averageRetrieval.toFixed(1)}h across divisions, with {" "}
                <strong>{retrievalRanking[0]?.division ?? "N/A"}</strong> performing fastest. {" "}
                {d.movementRecovery < 90
                  ? `Movement recovery is at ${d.movementRecovery}% — closing the returns gap improves custody tracking.`
                  : `Movement recovery is strong at ${d.movementRecovery}%.`
                }
              </p>
            </CardContent>
          </Card>
        </section>
    </div>
  );
}

export const ReportCharts = memo(ReportChartsInner);
