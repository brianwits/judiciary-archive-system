import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { buildArchiveCode } from "@/lib/archive-code";
import { getCaseCategoryCode, getCaseCategoryLabel } from "@/lib/case-category";
import { getCaseTypeFromCategoryCode } from "@/lib/case-category";
import { getCaseTypeDefinition, CASE_TYPE_DEFINITIONS } from "@/data/case-types";
import type { CaseFile, CourtDivision } from "@/types/case";
import { CSV_SOURCE_DIRS } from "@/data/csv-source";

// ─── Raw CTS row type ──────────────────────────────────────────────────────

type CtsRawRow = {
  case_number: string;
  case_type_code: string;
  case_category: string;
  case_title_parties: string;
  filing_date: string;
  date_closed: string;
  final_status_outcome: string;
  judicial_officer: string;
  registry_court: string;
  is_appeal: string;
  age_and_filing_date_raw: string;
  number_of_activities: string;
  last_date: string;
  source_year_filter: string;
};

// ─── Simple CSV parser (handles quoted fields) ──────────────────────────────

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function parseCsvFile(filePath: string): CtsRawRow[] {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]);
  const rows: CtsRawRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < header.length && j < values.length; j++) {
      row[header[j]] = values[j].trim();
    }
    if (row.case_number) {
      rows.push(row as unknown as CtsRawRow);
    }
  }

  return rows;
}

// ─── Court station mapping ──────────────────────────────────────────────────

const STATION_ALIASES: Record<string, string> = {
  kabarnet: "KBT",
  nairobi: "NRB",
  mombasa: "MSA",
  kisumu: "KSM",
  nakuru: "NKR",
};

function inferCourtStation(registryCourt: string): string {
  const lower = (registryCourt ?? "").toLowerCase();
  for (const [alias, code] of Object.entries(STATION_ALIASES)) {
    if (lower.includes(alias)) return code;
  }
  return "KBT"; // default to Kabarnet
}

function inferCourtLevel(registryCourt: string): string {
  const lower = (registryCourt ?? "").toLowerCase();
  if (lower.includes("high court")) return "High Court";
  if (lower.includes("magistrate")) return "Magistrate Court";
  if (lower.includes("environment") || lower.includes("land")) return "Environment and Land Court";
  return "Magistrate Court"; // default
}

// ─── Status mapping ─────────────────────────────────────────────────────────

function mapStatus(outcome: string): CaseFile["status"] {
  const s = (outcome ?? "").trim().toLowerCase();
  if (s === "closed") return "closed";
  if (s === "open") return "open";
  if (s === "archived") return "archived";
  if (s.includes("missing")) return "missing";
  if (s.includes("pending")) return "pending_return";
  return "closed"; // most CTS cases are closed
}

// ─── Party parsing ──────────────────────────────────────────────────────────

function parseParties(titleParties: string | undefined): { plaintiff: string; defendant: string } {
  const text = titleParties ?? "";
  const parts = text.split(/\s+VS\s+/i);
  if (parts.length >= 2) {
    return {
      plaintiff: parts[0].trim(),
      defendant: parts.slice(1).join(" VS ").trim(),
    };
  }
  return { plaintiff: text.trim() || "Unknown", defendant: "N/A" };
}

// ─── Case type ID mapping by prefix ─────────────────────────────────────────

const CASE_TYPE_ID_BY_CODE: Record<string, number> = {
  // Magistrate Court
  MCCC: 31,
  MCCCMISC: 32,
  MCCR: 33,
  MCCRMISC: 34,
  MCTR: 35,
  MCSUCC: 37,
  MCCHCR: 84,
  MCSO: 72,
  MCINQ: 71,
  MCPCR: 116,
  MCCGCR: 288,
  MCCGCRMISC: 289,
  MGJCCR: 296,
  // High Court
  HCCRC: 9,
  HCCRMISCAPPL: 10,
};

// ─── Explicit case category code mapping for CTS prefixes ───────────────────
// These prefixes may not be in the research JSON alias map.
const CASE_CATEGORY_BY_CTS_CODE: Record<string, string> = {
  // Magistrate Court
  MCCC: "MC_CIVIL",
  MCCCMISC: "MC_CIVIL",
  MCCR: "MC_CRIMINAL",
  MCCRMISC: "MC_CRIMINAL",
  MCTR: "MC_TRAFFIC",
  MCSUCC: "MC_SUCCESSION",
  MCCHCR: "MC_CHILDREN_PROTECTION",
  MCSO: "MC_SEXUAL_OFFENCE",
  MCINQ: "MC_CRIMINAL",
  MCPCR: "MC_CRIMINAL",
  MCCGCR: "MC_CRIMINAL",
  MCCGCRMISC: "MC_CRIMINAL",
  MGJCCR: "MC_GENDER_JUSTICE",
  // High Court
  HCCRC: "HC_CRIMINAL",
  HCCRMISCAPPL: "HC_CRIMINAL",
};

function lookupCaseTypeId(caseTypeCode: string): number | null {
  const normalized = caseTypeCode.trim().toUpperCase();
  const id = CASE_TYPE_ID_BY_CODE[normalized];
  if (id != null) return id;

  // Fallback: try to find by code in definitions
  const found = CASE_TYPE_DEFINITIONS.find(
    (d) => d.code === normalized,
  );
  return found?.caseTypeId ?? null;
}

// ─── Archive code builder ───────────────────────────────────────────────────

function extractCaseNo(caseNumber: string): string {
  // Extract the middle part between prefix and year
  // e.g., "MCCR/811/2009" → "811", "MCCC/E071/2024" → "E071"
  const parts = caseNumber.split("/");
  if (parts.length >= 3) {
    return parts.slice(1, -1).join("/");
  }
  return caseNumber.replace(/[^a-zA-Z0-9]/g, "");
}

// ─── Main loader ────────────────────────────────────────────────────────────

interface CsvLoadResult {
  cases: CaseFile[];
  stats: {
    totalFiles: number;
    totalRows: number;
    categories: Record<string, number>;
    years: Record<string, number>;
  };
}

let cachedResult: CsvLoadResult | null = null;

/**
 * Load all case CSV files from the configured source directory.
 * Results are cached after the first call.
 */
export function loadCasesFromCsv(): CsvLoadResult {
  if (cachedResult) return cachedResult;

  if (typeof process === "undefined") {
    cachedResult = { cases: [], stats: { totalFiles: 0, totalRows: 0, categories: {}, years: {} } };
    return cachedResult;
  }

  const categoryCounts: Record<string, number> = {};
  const yearCounts: Record<string, number> = {};
  const allCases: CaseFile[] = [];
  let fileCount = 0;
  let totalRows = 0;

  try {
    for (const sourceDir of CSV_SOURCE_DIRS) {
      const files = readdirSync(sourceDir.path)
        .filter(
          (f) =>
            extname(f).toLowerCase() === ".csv" &&
            !f.includes("-summary") &&
            statSync(join(sourceDir.path, f)).isFile(),
        )
        .sort();
      fileCount += files.length;

      for (const file of files) {
        const filePath = join(sourceDir.path, file);
        const rawRows = parseCsvFile(filePath);
        totalRows += rawRows.length;

        for (const row of rawRows) {
          const caseFile = mapRowToCaseFile(row, categoryCounts, yearCounts);
          allCases.push(caseFile);
        }
      }
    }
  } catch (err) {
    console.warn(`[csv-loader] Failed to load CSV files from source directories:`, err);
    cachedResult = { cases: [], stats: { totalFiles: 0, totalRows: 0, categories: {}, years: {} } };
    return cachedResult;
  }

  cachedResult = {
    cases: allCases,
    stats: {
      totalFiles: fileCount,
      totalRows,
      categories: categoryCounts,
      years: yearCounts,
    },
  };

  return cachedResult;
}

function mapRowToCaseFile(
  row: CtsRawRow,
  categoryCounts: Record<string, number>,
  yearCounts: Record<string, number>,
): CaseFile {
  const { plaintiff, defendant } = parseParties(row.case_title_parties);
  const courtStation = inferCourtStation(row.registry_court ?? "");
  const courtLevel = inferCourtLevel(row.registry_court ?? "");
  const year = parseInt(row.source_year_filter, 10) || 0;
  const caseNo = extractCaseNo(row.case_number);
  const caseTypeCode = ((row.case_type_code ?? row.case_number.split("/")[0]) ?? "MCCR").trim().toUpperCase();

  // Track stats
  categoryCounts[caseTypeCode] = (categoryCounts[caseTypeCode] || 0) + 1;
  const yearKey = String(year);
  yearCounts[yearKey] = (yearCounts[yearKey] || 0) + 1;

  // Category resolution — use explicit map first, fall back to prefix lookup
  const caseCategoryCode = CASE_CATEGORY_BY_CTS_CODE[caseTypeCode]
    ?? getCaseCategoryCode(null, row.case_number, {
        caseType: null,
        courtDivision: courtLevel,
      });

  // Case type resolution
  const caseType = getCaseTypeFromCategoryCode(caseCategoryCode, {
    caseType: null,
    courtDivision: courtLevel,
  });

  // Authoritative case type ID
  const caseTypeId = lookupCaseTypeId(caseTypeCode);
  const definition = getCaseTypeDefinition(caseTypeId);

  return {
    id: `csv-${row.case_number.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`,
    caseNumber: row.case_number,
    caseNumberRaw: row.case_number,
    caseNumberNormalized: row.case_number.toLowerCase(),
    trackingNumber: null,
    sourceCaseId: null,
    sourceSystem: "CTS-Kabarnet",
    sourceUpdatedAt: null,
    caseType,
    caseTypeId: definition?.caseTypeId ?? caseTypeId,
    caseTypeCode: definition?.code ?? caseTypeCode,
    caseTypeName: definition?.caseType ?? getCaseCategoryLabel(caseCategoryCode),
    caseTypeFullLabel: definition?.fullLabel ?? getCaseCategoryLabel(caseCategoryCode),
    caseFamily: definition?.caseFamily ?? caseType,
    caseCourtLevel: definition?.courtLevel ?? courtLevel,
    classificationStatus: definition ? "canonical" : "legacy",
    caseCategoryCode,
    caseCategoryName: getCaseCategoryLabel(caseCategoryCode),
    courtStation: courtStation as CaseFile["courtStation"],
    courtDivision: courtLevel as CourtDivision,
    year,
    plaintiff,
    defendant,
    judge: row.judicial_officer || "Not recorded",
    status: mapStatus(row.final_status_outcome),
    archiveCode: buildArchiveCode({
      court: courtStation,
      caseType,
      year,
      caseNo,
    }),
    shelfLocation: null,
    locationId: null,
    qrBarcode: null,
    filedDate: row.filing_date || null,
    closedDate: row.date_closed || null,
    notes: `CTS Kabarnet | ${row.case_category ?? ""}${row.is_appeal && row.is_appeal !== "- Original" ? ` | ${row.is_appeal}` : ""}`,
    isMissing: false,
    createdBy: "system-cts-import",
    createdAt: `${year}-01-01T00:00:00Z`,
    updatedAt: row.last_date ? `${row.last_date}T00:00:00Z` : `${year}-01-01T00:00:00Z`,
  };
}
