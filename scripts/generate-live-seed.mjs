import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const PROJECT_ROOT = process.cwd();
const DEFAULT_PLAYGROUND_ROOT =
  "/mnt/c/Users/User/OneDrive - The Judiciary of Kenya/Documents/Playground";
const SOURCE_ROOT = process.env.CTS_PLAYGROUND_ROOT || DEFAULT_PLAYGROUND_ROOT;
const OUTPUT_PATH = resolve(PROJECT_ROOT, "supabase/seed.sql");

const SOURCE_GROUPS = [
  {
    name: "kabarnet-magistrate",
    directory: "cts-kabarnet-closed-cases-subsets",
    files: [
      "2000-2024-MCCR-MCCRMISC-closed.csv",
      "2024-MCCC.csv",
      "2024-MCCCMISC.csv",
      "2024-MCTR.csv",
      "2024-MCINQ.csv",
      "2024-MCSO.csv",
      "2024-MCCHCR.csv",
      "2024-MCPCR.csv",
      "2024-MCCGCR.csv",
      "2024-MCCGCRMISC.csv",
      "2024-MGJCCR.csv",
    ],
  },
  {
    name: "kabarnet-high-court-criminal",
    directory: "cts-kabarnet-highcourt-closed-cases-subsets",
    files: ["2000-2024-HCCRC-HCCRMISCAPPL-closed.csv"],
  },
  {
    name: "kabarnet-elc",
    directory: "cts-kabarnet-elc-closed-cases-subsets",
    files: ["2000-2024-ELCC-ELCMISC-closed.csv"],
  },
];

const BUSINESS_TABLES_TO_CLEAR = [
  "case_number_aliases",
  "registry_requests",
  "audit_logs",
  "file_movements",
  "documents",
  "case_activities",
  "case_parties",
  "case_special_metadata",
  "notices",
  "memos",
  "broadcasts",
  "archive_locations",
  "cases",
];

const CASE_TYPE_MAP = {
  MCCC: {
    caseTypeId: 31,
    caseType: "Civil",
    caseFamily: "Civil",
    caseCategoryCode: "MC_CIVIL",
    courtDivision: "Magistrate Court",
  },
  MCCCMISC: {
    caseTypeId: 32,
    caseType: "Civil",
    caseFamily: "Civil",
    caseCategoryCode: "MC_CIVIL",
    courtDivision: "Magistrate Court",
  },
  MCCR: {
    caseTypeId: 33,
    caseType: "Criminal",
    caseFamily: "Criminal",
    caseCategoryCode: "MC_CRIMINAL",
    courtDivision: "Magistrate Court",
  },
  MCCRMISC: {
    caseTypeId: 34,
    caseType: "Criminal",
    caseFamily: "Criminal",
    caseCategoryCode: "MC_CRIMINAL",
    courtDivision: "Magistrate Court",
  },
  MCTR: {
    caseTypeId: 35,
    caseType: "Traffic",
    caseFamily: "Traffic",
    caseCategoryCode: "MC_TRAFFIC",
    courtDivision: "Magistrate Court",
  },
  MCINQ: {
    caseTypeId: 71,
    caseType: "Criminal",
    caseFamily: "Criminal",
    caseCategoryCode: "MC_CRIMINAL",
    courtDivision: "Magistrate Court",
  },
  MCSO: {
    caseTypeId: 72,
    caseType: "Criminal",
    caseFamily: "Criminal",
    caseCategoryCode: "MC_SEXUAL_OFFENCE",
    courtDivision: "Magistrate Court",
  },
  MCCHCR: {
    caseTypeId: 84,
    caseType: "Criminal",
    caseFamily: "Children & Protection",
    caseCategoryCode: "MC_CRIMINAL",
    courtDivision: "Magistrate Court",
  },
  MCPCR: {
    caseTypeId: 116,
    caseType: "Criminal",
    caseFamily: "Criminal",
    caseCategoryCode: "MC_CRIMINAL",
    courtDivision: "Magistrate Court",
  },
  MCCGCR: {
    caseTypeId: 288,
    caseType: "Criminal",
    caseFamily: "Criminal",
    caseCategoryCode: "MC_CRIMINAL",
    courtDivision: "Magistrate Court",
  },
  MCCGCRMISC: {
    caseTypeId: 289,
    caseType: "Criminal",
    caseFamily: "Criminal",
    caseCategoryCode: "MC_CRIMINAL",
    courtDivision: "Magistrate Court",
  },
  MGJCCR: {
    caseTypeId: 296,
    caseType: "Criminal",
    caseFamily: "Gender Justice",
    caseCategoryCode: "MC_CRIMINAL",
    courtDivision: "Magistrate Court",
  },
  HCCRC: {
    caseTypeId: 9,
    caseType: "Criminal",
    caseFamily: "Criminal",
    caseCategoryCode: "HC_CRIMINAL",
    courtDivision: "High Court",
  },
  HCCRMISCAPPL: {
    caseTypeId: 10,
    caseType: "Criminal",
    caseFamily: "Criminal",
    caseCategoryCode: "HC_CRIMINAL",
    courtDivision: "High Court",
  },
  ELCC: {
    caseTypeId: 401,
    caseType: "ELC",
    caseFamily: "Environment & Land",
    caseCategoryCode: "ELC_MATTER",
    courtDivision: "Environment and Land Court",
  },
  ELCMISC: {
    caseTypeId: 405,
    caseType: "ELC",
    caseFamily: "Environment & Land",
    caseCategoryCode: "ELC_MATTER",
    courtDivision: "Environment and Land Court",
  },
};

const CASE_COLUMNS = [
  "case_number",
  "title",
  "court",
  "status",
  "filed_date",
  "closed_date",
  "description",
  "case_type",
  "case_type_id",
  "case_family",
  "case_category_code",
  "court_station",
  "court_division",
  "year",
  "plaintiff",
  "defendant",
  "archive_code",
  "is_missing",
  "notes",
  "judge",
  "source_system",
  "source_case_id",
  "case_number_raw",
  "source_updated_at",
];

function splitCsv(content) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];

    if (char === '"') {
      const next = content[index + 1];
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && content[index + 1] === "\n") {
        index += 1;
      }
      row.push(field);
      field = "";
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((value) => value.length > 0)) {
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseCsv(filePath) {
  const rows = splitCsv(readFileSync(filePath, "utf8"));
  if (rows.length === 0) return [];

  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map((values) => {
    const record = {};
    for (let index = 0; index < headers.length; index += 1) {
      record[headers[index]] = (values[index] ?? "").trim();
    }
    return record;
  });
}

function normalizeCaseNumber(value) {
  return String(value ?? "").trim().toUpperCase();
}

function parseParties(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return { plaintiff: "Unknown", defendant: "" };
  }

  const parts = text.split(/\s+(?:V\/S|VS|VERSUS)\s+/i);
  if (parts.length >= 2) {
    return {
      plaintiff: parts[0].trim(),
      defendant: parts.slice(1).join(" VS ").trim(),
    };
  }

  return { plaintiff: text, defendant: "" };
}

function parseIsoDate(value) {
  const text = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return text;
}

function parseIsoTimestamp(value) {
  const date = parseIsoDate(value);
  return date ? `${date}T00:00:00Z` : null;
}

function parseYear(raw, filedDate, caseNumber) {
  const direct = Number.parseInt(String(raw ?? "").trim(), 10);
  if (Number.isInteger(direct) && direct > 1900 && direct < 2100) return direct;

  const filedYear = Number.parseInt(String(filedDate ?? "").slice(0, 4), 10);
  if (Number.isInteger(filedYear)) return filedYear;

  const match = String(caseNumber ?? "").match(/\/(\d{4})$/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function normalizeTitleCase(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeJudge(value) {
  const text = String(value ?? "").trim();
  return text || "Not recorded";
}

function buildDescription(caseTypeCode, caseCategory) {
  const code = String(caseTypeCode ?? "").trim();
  const category = String(caseCategory ?? "").trim();
  if (category) {
    return `Imported from CTS closed-case register (${code || "unclassified"}): ${category}.`;
  }
  return "Imported from CTS closed-case register.";
}

function inferCourtCode(registryCourt, courtDivision) {
  const value = `${registryCourt ?? ""} ${courtDivision ?? ""}`.toLowerCase();
  if (value.includes("kabarnet")) return "KBT";
  return "KBT";
}

function normalizeSourceRow(raw) {
  const caseNumber = raw.case_number || raw.case_no || "";
  const caseTypeCode =
    raw.case_type_code || raw.case_category_code || raw.case_category_code_ || "";
  const caseCategory = raw.case_category || raw.case_category_name || "";
  const filedDate = raw.filing_date || "";
  const sourceUpdatedAt = raw.last_date || "";
  const registryCourt = raw.registry_court || raw.court_unit_registry || raw.court_station || "";
  const titleParties = raw.case_title_parties || raw.details || "";
  const judicialOfficer = raw.judicial_officer || "";
  const finalStatus = raw.final_status_outcome || raw.status || "";
  const sourceYear = raw.source_year_filter || raw.year || "";

  return {
    caseNumber: normalizeCaseNumber(caseNumber),
    caseTypeCode: String(caseTypeCode).trim().toUpperCase(),
    caseCategory: String(caseCategory).trim(),
    titleParties: String(titleParties).trim(),
    filedDate: parseIsoDate(filedDate),
    sourceUpdatedAt: parseIsoTimestamp(sourceUpdatedAt),
    registryCourt: String(registryCourt).trim(),
    judicialOfficer: normalizeJudge(judicialOfficer),
    finalStatus: String(finalStatus).trim().toLowerCase(),
    sourceYear,
  };
}

function mapRowToCaseInsert(normalized) {
  if (!normalized.caseNumber || normalized.finalStatus !== "closed") {
    return null;
  }

  const caseType = CASE_TYPE_MAP[normalized.caseTypeCode];
  if (!caseType) {
    throw new Error(
      `Unsupported case type code "${normalized.caseTypeCode}" for ${normalized.caseNumber}`,
    );
  }

  const parties = parseParties(normalized.titleParties);
  const title = parties.defendant
    ? `${parties.plaintiff} v. ${parties.defendant}`
    : parties.plaintiff;
  const year = parseYear(
    normalized.sourceYear,
    normalized.filedDate,
    normalized.caseNumber,
  );

  return {
    case_number: normalized.caseNumber,
    title,
    court: inferCourtCode(normalized.registryCourt, caseType.courtDivision),
    status: "closed",
    filed_date: normalized.filedDate,
    closed_date: null,
    description: buildDescription(normalized.caseTypeCode, normalized.caseCategory),
    case_type: caseType.caseType,
    case_type_id: caseType.caseTypeId,
    case_family: caseType.caseFamily,
    case_category_code: caseType.caseCategoryCode,
    court_station: "Kabarnet",
    court_division: caseType.courtDivision,
    year,
    plaintiff: normalizeTitleCase(parties.plaintiff),
    defendant: normalizeTitleCase(parties.defendant),
    archive_code: null,
    is_missing: false,
    notes: `${normalized.caseTypeCode} - ${normalized.caseCategory || "CTS closed register"}`,
    judge: normalized.judicialOfficer,
    source_system: "cts_kabarnet_case_register",
    source_case_id: normalized.caseNumber,
    case_number_raw: normalized.caseNumber,
    source_updated_at: normalized.sourceUpdatedAt,
  };
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function loadRows() {
  const caseMap = new Map();
  const counts = [];

  for (const group of SOURCE_GROUPS) {
    for (const fileName of group.files) {
      const filePath = resolve(SOURCE_ROOT, group.directory, fileName);
      if (!existsSync(filePath)) {
        throw new Error(`Missing source CSV: ${filePath}`);
      }

      const parsed = parseCsv(filePath);
      let accepted = 0;

      for (const raw of parsed) {
        const normalized = normalizeSourceRow(raw);
        const mapped = mapRowToCaseInsert(normalized);
        if (!mapped) continue;

        const dedupeKey = mapped.case_number;
        if (!caseMap.has(dedupeKey)) {
          caseMap.set(dedupeKey, mapped);
          accepted += 1;
        } else {
          const existing = caseMap.get(dedupeKey);
          if (
            existing.source_updated_at === null &&
            mapped.source_updated_at !== null
          ) {
            caseMap.set(dedupeKey, mapped);
          }
        }
      }

      counts.push({ fileName, rows: parsed.length, accepted });
    }
  }

  return {
    cases: [...caseMap.values()].sort((left, right) =>
      left.case_number.localeCompare(right.case_number),
    ),
    counts,
  };
}

function renderSeedSql(cases, counts) {
  const header = [
    "-- Generated by scripts/generate-live-seed.mjs",
    `-- Source root: ${SOURCE_ROOT}`,
    "-- Authoritative inputs:",
    "-- - Magistrate subsets + 2000-2024 criminal combined range",
    "-- - High Court criminal combined range",
    "-- - ELC combined range (validated zero-result source)",
    "-- Excluded on purpose:",
    "-- - High Court civil subset folder (partial / not authoritative)",
    "-- - MCSUCC 2024 because the verified browser session was not saved to file",
    "--",
    "-- Input files:",
    ...counts.map(
      (count) => `-- - ${count.fileName}: ${count.accepted} kept from ${count.rows} parsed rows`,
    ),
    "",
    "DO $$",
    "DECLARE",
    "  table_name text;",
    "BEGIN",
    "  FOREACH table_name IN ARRAY ARRAY[",
    ...BUSINESS_TABLES_TO_CLEAR.map((table, index) => {
      const suffix = index === BUSINESS_TABLES_TO_CLEAR.length - 1 ? "" : ",";
      return `    '${table}'${suffix}`;
    }),
    "  ]",
    "  LOOP",
    "    IF to_regclass(format('public.%s', table_name)) IS NOT NULL THEN",
    "      EXECUTE format('TRUNCATE TABLE public.%I RESTART IDENTITY CASCADE', table_name);",
    "    END IF;",
    "  END LOOP;",
    "END $$;",
    "",
  ];

  const body = [];

  if (cases.length > 0) {
    body.push(
      `INSERT INTO public.cases (${CASE_COLUMNS.join(", ")})`,
      "VALUES",
    );

    cases.forEach((entry, index) => {
      const row = `  (${CASE_COLUMNS.map((column) => sqlLiteral(entry[column])).join(", ")})`;
      body.push(index === cases.length - 1 ? `${row};` : `${row},`);
    });
  } else {
    body.push("-- No case rows were available from the authoritative CTS exports.");
  }

  body.push(
    "",
    "INSERT INTO public.notices (title, body, author_id, priority, created_at)",
    "VALUES",
    "  ('CTS Dataset Loaded', 'Kabarnet closed-case records are live in the archive dashboard and reports workspace.', NULL, 'high', '2026-07-13T07:00:00Z'),",
    "  ('Kabarnet Coverage Scope', 'The current dataset covers Kabarnet Magistrate Court and Kabarnet High Court, with validated zero-result ELC coverage.', NULL, 'normal', '2026-07-13T06:30:00Z'),",
    "  ('Archive Metadata Follow-up', 'Physical shelf locations, movement history, and scanning activity are not yet part of the imported CTS closed-case dataset.', NULL, 'normal', '2026-07-13T06:00:00Z');",
    "",
    "INSERT INTO public.memos (title, reference, author_id, created_at)",
    "VALUES",
    "  ('CTS closed-case import validation', 'MEMO/ICT/2026/CTS-01', NULL, '2026-07-13T05:45:00Z'),",
    "  ('Archive inventory reconciliation', 'MEMO/REG/2026/INV-02', NULL, '2026-07-13T05:15:00Z');",
    "",
    "INSERT INTO public.broadcasts (title, message, author_id, created_at)",
    "VALUES",
    "  ('Scheduled data verification', 'Registry and ICT teams should validate sampled CTS records against physical file registers this week.', NULL, '2026-07-13T05:00:00Z'),",
    "  ('Archive room metadata capture', 'Location assignments for imported CTS cases will be captured in a later inventory phase.', NULL, '2026-07-13T04:45:00Z');",
    "",
    "ANALYZE public.cases;",
    "",
  );
  return [...header, ...body].join("\n");
}

function main() {
  const { cases, counts } = loadRows();
  const sql = renderSeedSql(cases, counts);

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, sql);

  console.log(`Wrote ${OUTPUT_PATH}`);
  console.log(`Seeded cases: ${cases.length}`);
}

main();
