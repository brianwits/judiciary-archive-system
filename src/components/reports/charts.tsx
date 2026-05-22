"use client";

import {
  Activity,
  Archive,
  Clock3,
  FileWarning,
  ScanLine,
  Scale,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
import { cn } from "@/lib/utils";

const COLORS = {
  primary: "var(--primary)",
  secondary: "var(--secondary)",
  accent: "var(--accent)",
  success: "var(--success)",
  warning: "var(--warning)",
  destructive: "var(--destructive)",
  muted: "var(--muted)",
  mutedForeground: "var(--muted-foreground)",
  card: "var(--card)",
  border: "var(--border)",
};

const DIVISION_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.success,
  COLORS.warning,
];

const tooltipStyle = {
  backgroundColor: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: "0.625rem",
  boxShadow: "0 12px 30px rgb(0 0 0 / 0.12)",
  color: "var(--card-foreground)",
};

type ReportData = {
  archiveGrowth: { month: string; count: number }[];
  missingTrend: { month: string; count: number }[];
  movementFrequency: { week: string; checkouts: number; returns: number }[];
  divisionStats: { name: string; value: number }[];
  retrievalPerformance: { division: string; avgHours: number }[];
  scanningPerformance: { day: string; scans: number }[];
};

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  tone?: "primary" | "success" | "warning" | "danger";
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function getLastValue<T>(items: T[], fallback: T): T {
  return items.at(-1) ?? fallback;
}

function StatCard({ label, value, detail, icon: Icon, tone = "primary" }: StatCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-start justify-between gap-4 pt-4">
        <div className="min-w-0 space-y-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs font-medium text-muted-foreground">{detail}</p>
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            tone === "primary" && "bg-primary/10 text-primary",
            tone === "success" && "bg-success/10 text-success",
            tone === "warning" && "bg-warning/10 text-warning",
            tone === "danger" && "bg-destructive/10 text-destructive",
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  description,
  value,
  className,
  children,
}: {
  title: string;
  description: string;
  value?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="gap-2 sm:grid-cols-[1fr_auto]">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {value ? (
          <div className="rounded-lg bg-muted px-3 py-2 text-right">
            <p className="text-lg font-semibold leading-none">{value}</p>
            <p className="mt-1 text-[11px] font-medium uppercase text-muted-foreground">
              Current
            </p>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="h-[300px]">{children}</CardContent>
    </Card>
  );
}

export function ReportCharts({ data }: { data: ReportData }) {
  const latestArchive = getLastValue(data.archiveGrowth, { month: "N/A", count: 0 });
  const latestMissing = getLastValue(data.missingTrend, { month: "N/A", count: 0 });
  const totalCheckouts = data.movementFrequency.reduce(
    (total, item) => total + item.checkouts,
    0,
  );
  const totalReturns = data.movementFrequency.reduce((total, item) => total + item.returns, 0);
  const totalScans = data.scanningPerformance.reduce((total, item) => total + item.scans, 0);
  const averageRetrieval =
    data.retrievalPerformance.reduce((total, item) => total + item.avgHours, 0) /
    Math.max(data.retrievalPerformance.length, 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Archived files"
          value={formatNumber(latestArchive.count)}
          detail={`Total through ${latestArchive.month}`}
          icon={Archive}
        />
        <StatCard
          label="Missing files"
          value={formatNumber(latestMissing.count)}
          detail="Open location exceptions"
          icon={FileWarning}
          tone="danger"
        />
        <StatCard
          label="Movement balance"
          value={`${formatNumber(totalReturns)}/${formatNumber(totalCheckouts)}`}
          detail="Returns against checkouts"
          icon={Activity}
          tone={totalReturns >= totalCheckouts ? "success" : "warning"}
        />
        <StatCard
          label="Scans this week"
          value={formatNumber(totalScans)}
          detail="Digitized document volume"
          icon={ScanLine}
          tone="success"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard
          title="Archive growth"
          description="Total archived files by month"
          value={formatNumber(latestArchive.count)}
          className="xl:col-span-2"
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={data.archiveGrowth} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="archiveGrowthFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: COLORS.mutedForeground, fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fill: COLORS.mutedForeground, fontSize: 12 }} tickLine={false} width={54} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: COLORS.accent, strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="count"
                name="Archived files"
                stroke={COLORS.primary}
                strokeWidth={3}
                fill="url(#archiveGrowthFill)"
                activeDot={{ r: 5, strokeWidth: 0, fill: COLORS.accent }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Cases by division"
          description="Distribution across court divisions"
          value={`${data.divisionStats.length} divisions`}
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={data.divisionStats}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="48%"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={2}
              >
                {data.divisionStats.map((item, index) => (
                  <Cell key={item.name} fill={DIVISION_COLORS[index % DIVISION_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                iconType="circle"
                layout="horizontal"
                verticalAlign="bottom"
                wrapperStyle={{ color: COLORS.mutedForeground, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Movement frequency"
          description="Weekly checkouts compared with returns"
          value={`${formatNumber(totalCheckouts)} moves`}
          className="xl:col-span-2"
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data.movementFrequency} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: COLORS.mutedForeground, fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fill: COLORS.mutedForeground, fontSize: 12 }} tickLine={false} width={42} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: COLORS.muted, opacity: 0.45 }} />
              <Legend wrapperStyle={{ color: COLORS.mutedForeground, fontSize: 12 }} />
              <Bar dataKey="checkouts" name="Checkouts" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
              <Bar dataKey="returns" name="Returns" fill={COLORS.success} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Missing files trend"
          description="Unresolved missing file count"
          value={formatNumber(latestMissing.count)}
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart data={data.missingTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: COLORS.mutedForeground, fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fill: COLORS.mutedForeground, fontSize: 12 }} tickLine={false} width={36} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: COLORS.destructive, strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="count"
                name="Missing files"
                stroke={COLORS.destructive}
                strokeWidth={3}
                dot={{ r: 3, fill: COLORS.destructive, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: COLORS.destructive, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Retrieval performance"
          description="Average hours to retrieve files by division"
          value={`${averageRetrieval.toFixed(1)}h avg`}
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart
              data={data.retrievalPerformance}
              layout="vertical"
              margin={{ top: 8, right: 12, left: 10, bottom: 0 }}
            >
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fill: COLORS.mutedForeground, fontSize: 12 }} tickLine={false} />
              <YAxis
                dataKey="division"
                type="category"
                width={92}
                tick={{ fill: COLORS.mutedForeground, fontSize: 11 }}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: COLORS.muted, opacity: 0.45 }} />
              <Bar dataKey="avgHours" name="Avg hours" fill={COLORS.warning} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Scanning performance"
          description="Daily document scans this week"
          value={formatNumber(totalScans)}
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data.scanningPerformance} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: COLORS.mutedForeground, fontSize: 12 }} tickLine={false} />
              <YAxis tick={{ fill: COLORS.mutedForeground, fontSize: 12 }} tickLine={false} width={42} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: COLORS.muted, opacity: 0.45 }} />
              <Bar dataKey="scans" name="Scans" fill={COLORS.accent} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="bg-primary text-primary-foreground shadow-sm xl:col-span-3">
          <CardContent className="grid gap-4 pt-4 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <Scale className="mt-0.5 size-5 text-accent" />
              <div>
                <p className="font-medium">Judiciary reporting palette</p>
                <p className="mt-1 text-sm text-primary-foreground/75">
                  Green tracks custody and archive growth, gold highlights throughput, and red is reserved for exceptions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 size-5 text-accent" />
              <div>
                <p className="font-medium">Average retrieval</p>
                <p className="mt-1 text-sm text-primary-foreground/75">
                  Current cross-division average is {averageRetrieval.toFixed(1)} hours.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Activity className="mt-0.5 size-5 text-accent" />
              <div>
                <p className="font-medium">Movement control</p>
                <p className="mt-1 text-sm text-primary-foreground/75">
                  Returns are at {Math.round((totalReturns / Math.max(totalCheckouts, 1)) * 100)}% of weekly checkouts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
