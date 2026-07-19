import type { DashboardData, RegistryRequest } from "@/types/dashboard";
import type { CaseFile } from "@/types/case";
import type { UserProfile } from "@/types/user";
import type { ReportData, ReportFilters } from "@/lib/reports-computations";

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeCourtLevel(value: string | null | undefined): string {
  if (!value) return "Magistrate Court";
  if (value.includes("Environment")) return "Environment and Land Court";
  if (value.includes("Magistrate")) return "Magistrate Court";
  return "High Court";
}

function reportCaseDate(caseFile: CaseFile): Date | null {
  return toDate(caseFile.filedDate) ?? toDate(caseFile.updatedAt) ?? toDate(caseFile.createdAt);
}

function applyReportFilters(cases: CaseFile[], filters: ReportFilters): CaseFile[] {
  const from = toDate(filters.from);
  const to = toDate(filters.to);

  return cases.filter((caseFile) => {
    const date = reportCaseDate(caseFile);
    if (from && (!date || date < from)) return false;
    if (to && (!date || date > to)) return false;
    if (filters.courtLevel && normalizeCourtLevel(caseFile.courtDivision) !== filters.courtLevel) {
      return false;
    }
    if (filters.caseTypeId && caseFile.caseTypeId !== filters.caseTypeId) {
      return false;
    }
    return true;
  });
}

function countBy<T>(items: T[], keyFn: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function buildAgeBand(year: number): string {
  const age = new Date().getUTCFullYear() - year;
  if (age <= 2) return "0-2 years";
  if (age <= 5) return "3-5 years";
  if (age <= 10) return "6-10 years";
  return "11+ years";
}

export function buildMockReportData(input: {
  cases: CaseFile[];
  filters?: ReportFilters;
}): ReportData {
  const filteredCases = applyReportFilters(input.cases, input.filters ?? {});

  const archiveGrowth = [...countBy(filteredCases, (caseFile) => String(caseFile.year)).entries()]
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([year, count]) => ({ month: year, count }));

  const yearBuckets = [...countBy(filteredCases, (caseFile) => String(caseFile.year)).keys()]
    .sort((left, right) => Number(left) - Number(right))
    .slice(-6);
  const missingTrend = yearBuckets.map((year) => ({
    month: year,
    count: filteredCases.filter(
      (caseFile) =>
        String(caseFile.year) === year && (caseFile.isMissing || caseFile.status === "missing"),
    ).length,
  }));

  const divisionStats = [...countBy(filteredCases, (caseFile) => caseFile.courtDivision).entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, value }));

  const judgeStats = [...countBy(
    filteredCases,
    (caseFile) => caseFile.judge?.trim() || "Not recorded",
  ).entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  const ageBandStats = [...countBy(
    filteredCases,
    (caseFile) => buildAgeBand(caseFile.year),
  ).entries()]
    .sort((left, right) => {
      const order = ["0-2 years", "3-5 years", "6-10 years", "11+ years"];
      return order.indexOf(left[0]) - order.indexOf(right[0]);
    })
    .map(([label, value]) => ({ label, value }));

  const courtLevelStats = [...countBy(
    filteredCases,
    (caseFile) => normalizeCourtLevel(caseFile.courtDivision),
  ).entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([name, value]) => ({ name, value }));

  const caseTypeStats = [...countBy(
    filteredCases,
    (caseFile) =>
      JSON.stringify({
        caseTypeId: caseFile.caseTypeId,
        code: caseFile.caseTypeCode,
        name: caseFile.caseTypeName,
        fullLabel: caseFile.caseTypeFullLabel,
        courtLevel: normalizeCourtLevel(caseFile.courtDivision),
      }),
  ).entries()]
    .map(([raw, value]) => ({ ...JSON.parse(raw), value }))
    .sort((left, right) => right.value - left.value);

  const caseCategoryStats = [...countBy(
    filteredCases,
    (caseFile) =>
      JSON.stringify({
        categoryCode: caseFile.caseCategoryCode,
        categoryName: caseFile.caseCategoryName,
        courtLevel: normalizeCourtLevel(caseFile.courtDivision),
      }),
  ).entries()]
    .map(([raw, value]) => ({ ...JSON.parse(raw), value }))
    .sort((left, right) => right.value - left.value);

  const unclassifiedCount = filteredCases.filter(
    (caseFile) => caseFile.classificationStatus === "pending_review",
  ).length;

  return {
    archiveGrowth,
    missingTrend,
    divisionStats,
    judgeStats,
    ageBandStats,
    courtLevelStats,
    caseTypeStats,
    caseCategoryStats,
    unclassifiedCount,
    totalCases: filteredCases.length,
  };
}

export function buildMockDashboardData(input: {
  cases: CaseFile[];
  users: UserProfile[];
  registryRequests: RegistryRequest[];
  baseDashboard: DashboardData;
}): DashboardData {
  const archivedCases = input.cases.length;
  const highCourtCases = input.cases.filter((caseFile) =>
    normalizeCourtLevel(caseFile.courtDivision) === "High Court").length;
  const magistrateCases = input.cases.filter((caseFile) =>
    normalizeCourtLevel(caseFile.courtDivision) === "Magistrate Court").length;
  const elcCases = input.cases.filter((caseFile) =>
    normalizeCourtLevel(caseFile.courtDivision) === "Environment and Land Court").length;
  const missingCases = input.cases.filter(
    (caseFile) => caseFile.isMissing || caseFile.status === "missing",
  ).length;
  const registryPending = input.registryRequests.filter(
    (request) => request.status === "pending" || request.status === "in_progress",
  ).length;
  const activeUsers = input.users.filter((user) => user.isActive).length;
  const categoryCount = new Set(input.cases.map((caseFile) => caseFile.caseCategoryCode)).size;
  const yearsCovered = new Set(input.cases.map((caseFile) => caseFile.year)).size;

  return {
    ...input.baseDashboard,
    activeCasesCount: 0,
    registryRequestsCount: registryPending,
    kpis: [
      {
        label: "Archived Files",
        value: archivedCases.toLocaleString(),
        trend: "CTS mock dataset",
        trendDirection: "up",
        variant: "default",
      },
      {
        label: "High Court Files",
        value: highCourtCases.toLocaleString(),
        variant: "success",
      },
      {
        label: "Magistrate Files",
        value: magistrateCases.toLocaleString(),
        variant: "default",
      },
      {
        label: "ELC Files",
        value: elcCases.toLocaleString(),
        variant: elcCases > 0 ? "default" : "warning",
      },
      {
        label: "Missing Files",
        value: String(missingCases),
        trend: `${missingCases} reported`,
        trendDirection: missingCases > 0 ? "down" : "up",
        variant: missingCases > 0 ? "danger" : "success",
      },
      { label: "Years Covered", value: String(yearsCovered), variant: "default" },
      { label: "Case Categories", value: String(categoryCount), variant: "default" },
      { label: "Active Users", value: String(activeUsers), variant: "default" },
    ],
    notices: [
      {
        id: "cts-mock-notice-1",
        title: "CTS Mock Mode Active",
        body: `The app is using a local Kabarnet CTS mock dataset with ${input.cases.length.toLocaleString()} closed-case records.`,
        author: "System",
        priority: "high",
        createdAt: "2026-07-13T07:00:00Z",
      },
      {
        id: "cts-mock-notice-2",
        title: "Dataset Scope",
        body: "Mock coverage includes Kabarnet Magistrate Court and Kabarnet High Court closed-case exports.",
        author: "ICT Department",
        priority: "normal",
        createdAt: "2026-07-13T06:30:00Z",
      },
      {
        id: "cts-mock-notice-3",
        title: "Supabase Bypassed",
        body: "Dashboard, reports, and case views are reading the local CTS mock dataset instead of Supabase.",
        author: "System",
        priority: "normal",
        createdAt: "2026-07-13T06:00:00Z",
      },
    ],
    alerts: [
      {
        id: "cts-mock-alert-1",
        title: "Mock dataset in use",
        message: "CTS-backed mock mode is enabled for this app session.",
        severity: "info",
        createdAt: "2026-07-13T08:00:00Z",
      },
      {
        id: "cts-mock-alert-2",
        title: "ELC subset is empty",
        message: "The validated Kabarnet ELC closed-case export returned zero records.",
        severity: "warning",
        createdAt: "2026-07-13T08:05:00Z",
      },
      {
        id: "cts-mock-alert-3",
        title: "Archive metadata incomplete",
        message: "CTS mock cases do not include physical shelf assignments by default.",
        severity: "warning",
        createdAt: "2026-07-13T08:10:00Z",
      },
    ],
  };
}
