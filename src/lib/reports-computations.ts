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
  movementFrequency: { week: string; checkouts: number; returns: number }[];
  divisionStats: { name: string; value: number }[];
  retrievalPerformance: { division: string; avgHours: number }[];
  scanningPerformance: { day: string; scans: number }[];
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
  const totalCheckouts = data.movementFrequency.reduce((total, item) => total + item.checkouts, 0);
  const totalReturns = data.movementFrequency.reduce((total, item) => total + item.returns, 0);
  const totalScans = data.scanningPerformance.reduce((total, item) => total + item.scans, 0);
  const archiveGrowthRate = percentChange(latestArchive.count, previousArchive);
  const missingDelta = latestMissing.count - previousMissing;
  const movementRecovery = totalCheckouts === 0 ? 100 : Math.round((totalReturns / totalCheckouts) * 100);
  const peakScanDay = data.scanningPerformance.reduce(
    (best, item) => (item.scans > best.scans ? item : best),
    data.scanningPerformance[0] ?? { day: "N/A", scans: 0 },
  );

  return {
    latestArchive,
    previousArchive,
    latestMissing,
    previousMissing,
    totalCheckouts,
    totalReturns,
    totalScans,
    archiveGrowthRate,
    missingDelta,
    movementRecovery,
    peakScanDay,
  };
}
