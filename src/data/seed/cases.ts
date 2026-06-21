import { buildArchiveCode } from "@/lib/archive-code";
import {
  getCaseCategoryCode,
  getCaseCategoryLabel,
  getCaseTypeFromCategoryCode,
} from "@/lib/case-category";
import type { CaseFile } from "@/types/case";
import { getCaseTypeDefinition } from "@/data/case-types";

type SeedCaseInput = Omit<
  CaseFile,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "caseCategoryCode"
  | "caseCategoryName"
  | "caseTypeId"
  | "caseTypeCode"
  | "caseTypeName"
  | "caseTypeFullLabel"
  | "caseFamily"
  | "caseCourtLevel"
  | "classificationStatus"
> & {
  legacyCaseNumbers?: string[];
};

const cases: SeedCaseInput[] = [
  {
    caseNumber: "HCCR/123/2025",
    legacyCaseNumbers: ["CR/123/2025", "HCR/123/2025"],
    caseType: "Criminal",
    courtStation: "KBT",
    courtDivision: "High Court",
    year: 2025,
    plaintiff: "State",
    defendant: "John Doe",
    judge: "Hon. Justice Njeri",
    status: "open",
    archiveCode: buildArchiveCode({ court: "KBT", caseType: "Criminal", year: 2025, caseNo: "123" }),
    shelfLocation: "R1-B2-R3-S4",
    locationId: "loc-r1-b2-r3-s4",
    qrBarcode: "QR-CR1232025",
    filedDate: "2025-01-15",
    closedDate: null,
    notes: "High profile criminal matter",
    isMissing: false,
    createdBy: "user-registry",
  },
  {
    caseNumber: "ELC/E018/2023",
    caseType: "ELC",
    courtStation: "KBT",
    courtDivision: "Environment & Land",
    year: 2023,
    plaintiff: "Green Valley Ltd",
    defendant: "County Government",
    judge: "Hon. Justice Mwangi",
    status: "archived",
    archiveCode: buildArchiveCode({ court: "KBT", caseType: "ELC", year: 2023, caseNo: "E018" }),
    shelfLocation: "R2-B1-R2-S3",
    locationId: "loc-r2-b1-r2-s3",
    qrBarcode: "QR-ELCE0182023",
    filedDate: "2023-03-20",
    closedDate: "2024-11-10",
    notes: "Land dispute - environmental impact assessment",
    isMissing: false,
    createdBy: "user-registry",
  },
  {
    caseNumber: "HCCC/456/2024",
    legacyCaseNumbers: ["CIV/456/2024"],
    caseType: "Civil",
    courtStation: "NRB",
    courtDivision: "High Court",
    year: 2024,
    plaintiff: "ABC Enterprises",
    defendant: "XYZ Holdings",
    judge: "Hon. Justice Kamau",
    status: "closed",
    archiveCode: buildArchiveCode({ court: "NRB", caseType: "Civil", year: 2024, caseNo: "456" }),
    shelfLocation: "R1-B3-R1-S2",
    locationId: "loc-r1-b3-r1-s2",
    qrBarcode: "QR-CIV4562024",
    filedDate: "2024-06-01",
    closedDate: "2025-12-15",
    notes: "Contract dispute",
    isMissing: false,
    createdBy: "user-registry",
  },
  {
    caseNumber: "FAM/089/2025",
    caseType: "Family",
    courtStation: "KBT",
    courtDivision: "Family Division",
    year: 2025,
    plaintiff: "Jane Wanjiru",
    defendant: "James Wanjiru",
    judge: "Hon. Justice Akinyi",
    status: "open",
    archiveCode: buildArchiveCode({ court: "KBT", caseType: "Family", year: 2025, caseNo: "089" }),
    shelfLocation: "R3-B2-R1-S1",
    locationId: "loc-r3-b2-r1-s1",
    qrBarcode: "QR-FAM0892025",
    filedDate: "2025-02-10",
    closedDate: null,
    notes: "Custody and maintenance petition",
    isMissing: false,
    createdBy: "user-registry",
  },
  {
    caseNumber: "COM/234/2024",
    caseType: "Commercial",
    courtStation: "NRB",
    courtDivision: "Commercial Division",
    year: 2024,
    plaintiff: "Tech Solutions Ltd",
    defendant: "Digital Corp",
    judge: "Hon. Justice Ochieng",
    status: "pending_return",
    archiveCode: buildArchiveCode({ court: "NRB", caseType: "Commercial", year: 2024, caseNo: "234" }),
    shelfLocation: "R4-B1-R2-S5",
    locationId: "loc-r4-b1-r2-s5",
    qrBarcode: "QR-COM2342024",
    filedDate: "2024-08-15",
    closedDate: null,
    notes: "IP infringement claim",
    isMissing: false,
    createdBy: "user-registry",
  },
  {
    caseNumber: "MCCR/567/2023",
    legacyCaseNumbers: ["CR/567/2023"],
    caseType: "Criminal",
    courtStation: "MSA",
    courtDivision: "Magistrate Court",
    year: 2023,
    plaintiff: "State",
    defendant: "Peter Mutua",
    judge: "Hon. Magistrate Hassan",
    status: "missing",
    archiveCode: buildArchiveCode({ court: "MSA", caseType: "Criminal", year: 2023, caseNo: "567" }),
    shelfLocation: null,
    locationId: null,
    qrBarcode: "QR-CR5672023",
    filedDate: "2023-09-01",
    closedDate: "2024-06-30",
    notes: "File reported missing during audit",
    isMissing: true,
    createdBy: "user-registry",
  },
  {
    caseNumber: "CON/012/2025",
    caseType: "Constitutional",
    courtStation: "NRB",
    courtDivision: "High Court",
    year: 2025,
    plaintiff: "Citizens Coalition",
    defendant: "Attorney General",
    judge: "Hon. Chief Justice",
    status: "open",
    archiveCode: buildArchiveCode({ court: "NRB", caseType: "Constitutional", year: 2025, caseNo: "012" }),
    shelfLocation: "R5-B2-R3-S2",
    locationId: "loc-r5-b2-r3-s2",
    qrBarcode: "QR-CON0122025",
    filedDate: "2025-01-20",
    closedDate: null,
    notes: "Constitutional petition on governance",
    isMissing: false,
    createdBy: "user-registry",
  },
  {
    caseNumber: "PRO/078/2022",
    caseType: "Probate",
    courtStation: "KBT",
    courtDivision: "High Court",
    year: 2022,
    plaintiff: "Estate of J. Kamau",
    defendant: "N/A",
    judge: "Hon. Justice Wanjiku",
    status: "archived",
    archiveCode: buildArchiveCode({ court: "KBT", caseType: "Probate", year: 2022, caseNo: "078" }),
    shelfLocation: "R6-B1-R1-S3",
    locationId: "loc-r6-b1-r1-s3",
    qrBarcode: "QR-PRO0782022",
    filedDate: "2022-11-05",
    closedDate: "2023-08-20",
    notes: "Grant of probate application",
    isMissing: false,
    createdBy: "user-archivist",
  },
];

function generateMoreCases(): SeedCaseInput[] {
  const extra: SeedCaseInput[] = [];
  const types = ["Civil", "Criminal", "ELC", "Family", "Commercial"] as const;
  const canonicalPrefixes = {
    Civil: "HCCC",
    Criminal: "HCCR",
    ELC: "ELC",
    Family: "FAM",
    Commercial: "COM",
  } as const;
  const stations = ["KBT", "NRB", "MSA", "KSM"] as const;
  const statuses = ["open", "closed", "archived"] as const;

  for (let i = 1; i <= 22; i++) {
    const type = types[i % types.length];
    const station = stations[i % stations.length];
    const year = 2020 + (i % 6);
    const caseNo = String(100 + i);
    const caseNumber = `${canonicalPrefixes[type]}/${caseNo}/${year}`;
    const legacyCaseNumbers = [`${type.slice(0, 3).toUpperCase()}/${caseNo}/${year}`];
    if (type === "Criminal") legacyCaseNumbers.push(`HCR/${caseNo}/${year}`);
    extra.push({
      caseNumber,
      legacyCaseNumbers: legacyCaseNumbers.filter((legacy) => legacy !== caseNumber),
      caseType: type,
      courtStation: station,
      courtDivision: "High Court",
      year,
      plaintiff: `Plaintiff ${i}`,
      defendant: `Defendant ${i}`,
      judge: `Hon. Justice ${["Kamau", "Njeri", "Ochieng", "Akinyi"][i % 4]}`,
      status: statuses[i % statuses.length],
      archiveCode: buildArchiveCode({ court: station, caseType: type, year, caseNo }),
      shelfLocation: `R${(i % 6) + 1}-B${(i % 3) + 1}-R${(i % 4) + 1}-S${(i % 5) + 1}`,
      locationId: `loc-r${(i % 6) + 1}`,
      qrBarcode: `QR-${caseNo}${year}`,
      filedDate: `${year}-${String((i % 12) + 1).padStart(2, "0")}-15`,
      closedDate: statuses[i % statuses.length] !== "open" ? `${year + 1}-06-30` : null,
      notes: null,
      isMissing: false,
      createdBy: "user-registry",
    });
  }
  return extra;
}

const seedCaseInputs = [...cases, ...generateMoreCases()];

export const SEED_CASES: CaseFile[] = seedCaseInputs.map((seedCase, idx) => {
    const { legacyCaseNumbers, ...c } = seedCase;
    void legacyCaseNumbers;
    const caseCategoryCode = getCaseCategoryCode(null, c.caseNumber, {
      caseType: c.caseType,
      courtDivision: c.courtDivision,
    });
    const caseType = getCaseTypeFromCategoryCode(caseCategoryCode, {
      caseType: c.caseType,
      courtDivision: c.courtDivision,
    });
    const authoritativeId: Record<string, number> = {
      HC_CRIMINAL: 9,
      HC_COMMERCIAL: 13,
      HC_CIVIL: 19,
      MC_CRIMINAL: 33,
      MC_CIVIL: 31,
      MC_TRAFFIC: 35,
      MC_SUCCESSION: 37,
      MC_SEXUAL_OFFENCE: 72,
    };
    const definition = getCaseTypeDefinition(authoritativeId[caseCategoryCode]);

    return {
      ...c,
      caseType,
      caseTypeId: definition?.caseTypeId ?? null,
      caseTypeCode: definition?.code ?? caseCategoryCode,
      caseTypeName: definition?.caseType ?? getCaseCategoryLabel(caseCategoryCode),
      caseTypeFullLabel: definition?.fullLabel ?? getCaseCategoryLabel(caseCategoryCode),
      caseFamily: definition?.caseFamily ?? caseType,
      caseCourtLevel: definition?.courtLevel ?? c.courtDivision,
      classificationStatus: definition ? "canonical" : "legacy",
      caseCategoryCode,
      caseCategoryName: getCaseCategoryLabel(caseCategoryCode),
      id: `case-${String(idx + 1).padStart(3, "0")}`,
      createdAt: "2024-01-01T08:00:00Z",
      updatedAt: "2026-05-19T08:00:00Z",
    };
  });

export const SEED_CASE_NUMBER_ALIASES = seedCaseInputs.flatMap((seedCase, idx) =>
  (seedCase.legacyCaseNumbers ?? []).map((caseNumber) => ({
    caseId: `case-${String(idx + 1).padStart(3, "0")}`,
    caseNumber,
  })),
);
