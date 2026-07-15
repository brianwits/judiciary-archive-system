/**
 * Shared computation utilities for the Reports & Analytics page.
 *
 * Both the lightweight overview-stats chunk and the heavy charts chunk
 * need the same derived values — keeping them here avoids duplicating
 * the arithmetic (and the bundle bytes) across both chunks.
 */

export type ReportData = {
  archiveGrowth: { month: string; count: number }[];
  missingTrend: { month: string; count: number }[];
  divisionStats: { name: string; value: number }[];
  judgeStats: { name: string; value: number }[];
  ageBandStats: { label: string; value: number }[];
  courtLevelStats: { name: string; value: number }[];
  caseTypeStats: {
    caseTypeId: number | null;
    code: string;
    name: string;
    fullLabel: string;
    courtLevel: string;
    value: number;
  }[];
  caseCategoryStats: {
    categoryCode: string;
    categoryName: string;
    courtLevel: string;
    value: number;
  }[];
  unclassifiedCount: number;
  totalCases: number;
};

export type ReportFilters = {
  from?: string;
  to?: string;
  courtLevel?: string;
  caseTypeId?: number;
};

export function getLastValue<T>(items: T[], fallback: T): T {
  return items.at(-1) ?? fallback;
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

/** Pre-computed values shared by stat cards and chart widgets. */
export function computeDerived(data: ReportData) {
  const latestArchive = getLastValue(data.archiveGrowth, { month: "N/A", count: 0 });
  const previousArchive = data.archiveGrowth.at(-2)?.count ?? latestArchive.count;
  const latestMissing = getLastValue(data.missingTrend, { month: "N/A", count: 0 });
  const previousMissing = data.missingTrend.at(-2)?.count ?? latestMissing.count;
  const archiveGrowthRate = percentChange(latestArchive.count, previousArchive);
  const missingDelta = latestMissing.count - previousMissing;
  const yearsCovered = data.archiveGrowth.length;
  const topDivision = data.divisionStats[0] ?? { name: "N/A", value: 0 };
  const topJudge = data.judgeStats[0] ?? { name: "Not recorded", value: 0 };
  const topCaseCategory = data.caseCategoryStats[0] ?? {
    categoryCode: "UNKNOWN",
    categoryName: "Unknown Category",
    courtLevel: "N/A",
    value: 0,
  };
  const topAgeBand = data.ageBandStats.reduce(
    (largest, band) => (band.value > largest.value ? band : largest),
    { label: "N/A", value: 0 },
  );

  return {
    latestArchive,
    previousArchive,
    latestMissing,
    previousMissing,
    archiveGrowthRate,
    missingDelta,
    yearsCovered,
    topDivision,
    topJudge,
    topCaseCategory,
    topAgeBand,
  };
}
