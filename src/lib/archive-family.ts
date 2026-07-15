import type {
  ArchiveCourtLevel,
  ArchiveCourtSection,
  ArchiveFamilyGroup,
  ArchiveStoredCase,
  ArchiveTypeGroup,
} from "@/types/archive";

function normalizeToken(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function normalizeArchiveFamily(input: {
  caseType?: string | null;
  caseFamily?: string | null;
  caseCategoryName?: string | null;
  courtDivision?: string | null;
}): ArchiveFamilyGroup["label"] {
  const caseType = normalizeToken(input.caseType);
  const caseFamily = normalizeToken(input.caseFamily);
  const caseCategoryName = normalizeToken(input.caseCategoryName);
  const courtDivision = normalizeToken(input.courtDivision);

  if (caseType === "civil" || caseFamily === "civil") return "Civil";
  if (caseType === "criminal" || caseFamily === "criminal") return "Criminal";
  if (caseType === "commercial" || caseFamily === "commercial") return "Commercial";
  if (caseType === "constitutional" || caseFamily.includes("constitutional")) return "Constitutional";
  if (caseType === "probate" || caseFamily === "probate") return "Probate";
  if (caseType === "succession" || caseFamily.includes("succession")) return "Succession";
  if (caseType === "traffic" || caseFamily === "traffic") return "Traffic";
  if (caseType === "elc" || caseFamily.includes("environment") || caseCategoryName.includes("land")) {
    return "ELC";
  }
  if (courtDivision.includes("environment") || courtDivision.includes("land")) return "ELC";
  if (caseFamily.includes("commercial")) return "Commercial";
  if (caseFamily.includes("judicial review")) return "Civil";
  if (caseFamily.includes("labour")) return "Civil";
  if (caseFamily.includes("children")) return "Civil";
  if (caseFamily.includes("gender")) return "Civil";
  if (caseFamily.includes("tribunal")) return "Civil";
  if (caseFamily.includes("anti-corruption") || caseFamily.includes("election")) return "Criminal";

  return "Other";
}

function normalizeCourtToken(value: string | null | undefined) {
  return normalizeToken(value).replace(/&/g, "and");
}

export function normalizeArchiveCourtLevel(input: {
  caseTypeCode?: string | null;
  caseTypeFullLabel?: string | null;
  caseCategoryName?: string | null;
  courtDivision?: string | null;
}): ArchiveCourtLevel {
  const code = normalizeToken(input.caseTypeCode);
  const fullLabel = normalizeCourtToken(input.caseTypeFullLabel);
  const categoryName = normalizeCourtToken(input.caseCategoryName);
  const courtDivision = normalizeCourtToken(input.courtDivision);
  const combined = [fullLabel, categoryName, courtDivision].join(" ");

  if (
    code.startsWith("elc") ||
    combined.includes("environment and land") ||
    combined.includes("environment land")
  ) {
    return "ELC";
  }

  if (code.startsWith("mc") || combined.includes("magistrate")) {
    return "Magistrate Court";
  }

  if (
    code.startsWith("hc") ||
    combined.includes("high court") ||
    combined.includes("commercial division") ||
    combined.includes("constitutional")
  ) {
    return "High Court";
  }

  return "Other";
}

function archiveTypeLabel(item: ArchiveStoredCase) {
  if (item.classificationStatus === "canonical" && item.caseTypeFullLabel) {
    return item.caseTypeFullLabel;
  }
  if (item.caseCategoryName && item.caseCategoryName !== "Unknown Category") {
    return item.caseCategoryName;
  }
  if (item.caseTypeName && item.caseTypeName !== "Unknown Category") {
    return item.caseTypeName;
  }
  if (item.caseTypeFullLabel) return item.caseTypeFullLabel;
  if (item.caseTypeName) return item.caseTypeName;
  if (item.caseType) return item.caseType;
  return "Pending review";
}

function normalizeStoragePath(storagePath: string | null) {
  const normalized = storagePath
    ?.split("›")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join(" › ");
  return normalized && normalized.length > 0 ? normalized : null;
}

export function buildArchiveFamilyGroups(
  storedCases: ArchiveStoredCase[],
): ArchiveFamilyGroup[] {
  const grouped = new Map<ArchiveFamilyGroup["label"], ArchiveStoredCase[]>();

  for (const item of storedCases) {
    const family = normalizeArchiveFamily({
      caseType: item.caseType,
      caseFamily: item.caseFamily,
      caseCategoryName: item.caseCategoryName,
      courtDivision: item.courtDivision,
    });
    const existing = grouped.get(family) ?? [];
    existing.push(item);
    grouped.set(family, existing);
  }

  return Array.from(grouped.entries())
    .map(([label, cases]) => {
      const paths = new Set<string>();
      for (const item of cases) {
        const path = normalizeStoragePath(item.storagePath);
        if (path) paths.add(path);
      }

      return {
        key: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        label,
        count: cases.length,
        missingCount: cases.filter((item) => item.status === "missing").length,
        storagePaths: [...paths].sort((a, b) => {
          const depthDelta = a.split("›").length - b.split("›").length;
          return depthDelta !== 0 ? depthDelta : a.localeCompare(b);
        }),
        cases: [...cases].sort((a, b) => {
          const yearDelta = (b.year ?? 0) - (a.year ?? 0);
          return yearDelta !== 0 ? yearDelta : a.caseNumber.localeCompare(b.caseNumber);
        }),
      } satisfies ArchiveFamilyGroup;
    })
    .sort((a, b) => (b.count - a.count) || a.label.localeCompare(b.label));
}

const COURT_SECTION_ORDER: ArchiveCourtLevel[] = [
  "High Court",
  "Magistrate Court",
  "ELC",
  "Other",
];

export function buildArchiveTypeSections(
  storedCases: ArchiveStoredCase[],
): ArchiveCourtSection[] {
  const sectionMap = new Map<ArchiveCourtLevel, Map<string, ArchiveStoredCase[]>>();

  for (const item of storedCases) {
    const courtLevel = normalizeArchiveCourtLevel({
      caseTypeCode: item.caseTypeCode,
      caseTypeFullLabel: item.caseTypeFullLabel,
      caseCategoryName: item.caseCategoryName,
      courtDivision: item.courtDivision,
    });
    const label = archiveTypeLabel(item);
    const code = item.caseTypeCode?.trim() ? item.caseTypeCode.trim() : item.caseCategoryCode?.trim() || "uncoded";
    const groupKey = `${courtLevel}:${code}:${label}`.toLowerCase();
    const groups = sectionMap.get(courtLevel) ?? new Map<string, ArchiveStoredCase[]>();
    const items = groups.get(groupKey) ?? [];
    items.push(item);
    groups.set(groupKey, items);
    sectionMap.set(courtLevel, groups);
  }

  return COURT_SECTION_ORDER
    .map((courtLevel) => {
      const groups = sectionMap.get(courtLevel);
      if (!groups || groups.size === 0) return null;

      const mappedGroups = Array.from(groups.entries())
        .map(([key, cases]) => {
          const paths = new Set<string>();
          for (const item of cases) {
            const path = normalizeStoragePath(item.storagePath);
            if (path) paths.add(path);
          }

          const first = cases[0];
          return {
            key,
            label: archiveTypeLabel(first),
            code: first.caseTypeCode?.trim() || first.caseCategoryCode?.trim() || null,
            courtLevel,
            count: cases.length,
            missingCount: cases.filter((item) => item.status === "missing").length,
            storagePaths: [...paths].sort((a, b) => {
              const depthDelta = a.split("›").length - b.split("›").length;
              return depthDelta !== 0 ? depthDelta : a.localeCompare(b);
            }),
            cases: [...cases].sort((a, b) => {
              const yearDelta = (b.year ?? 0) - (a.year ?? 0);
              return yearDelta !== 0 ? yearDelta : a.caseNumber.localeCompare(b.caseNumber);
            }),
          } satisfies ArchiveTypeGroup;
        })
        .sort((a, b) => (b.count - a.count) || a.label.localeCompare(b.label));

      const sectionPaths = new Set<string>();
      for (const group of mappedGroups) {
        for (const path of group.storagePaths) {
          sectionPaths.add(path);
        }
      }

      return {
        key: courtLevel.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        label: courtLevel,
        count: mappedGroups.reduce((sum, group) => sum + group.count, 0),
        missingCount: mappedGroups.reduce((sum, group) => sum + group.missingCount, 0),
        storagePaths: [...sectionPaths].sort((a, b) => {
          const depthDelta = a.split("›").length - b.split("›").length;
          return depthDelta !== 0 ? depthDelta : a.localeCompare(b);
        }),
        groups: mappedGroups,
      } satisfies ArchiveCourtSection;
    })
    .filter((section): section is ArchiveCourtSection => section !== null);
}
