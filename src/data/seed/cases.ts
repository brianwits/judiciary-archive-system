import { buildArchiveCode } from "@/lib/archive-code";
import {
  getCaseCategoryCode,
  getCaseCategoryLabel,
  getCaseTypeFromCategoryCode,
} from "@/lib/case-category";
import type { CaseFile, CaseType, CourtDivision } from "@/types/case";
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
    caseNumber: "ELC/OS/045/2025",
    caseType: "ELC",
    courtStation: "NRB",
    courtDivision: "Environment & Land",
    year: 2025,
    plaintiff: "Sunrise Properties Ltd",
    defendant: "City Planning Authority",
    judge: "Hon. Justice Odongo",
    status: "open",
    archiveCode: buildArchiveCode({ court: "NRB", caseType: "ELC", year: 2025, caseNo: "OS045" }),
    shelfLocation: "R7-B1-R2-S1",
    locationId: "loc-r7-b1-r2-s1",
    qrBarcode: "QR-ELCOS0452025",
    filedDate: "2025-04-12",
    closedDate: null,
    notes: "Originating summons - land use dispute",
    isMissing: false,
    createdBy: "user-registry",
  },
  {
    caseNumber: "ELC/122/2024",
    caseType: "ELC",
    courtStation: "KSM",
    courtDivision: "Environment & Land",
    year: 2024,
    plaintiff: "Lake Basin Farmers Co-op",
    defendant: "National Land Commission",
    judge: "Hon. Justice Achieng",
    status: "closed",
    archiveCode: buildArchiveCode({ court: "KSM", caseType: "ELC", year: 2024, caseNo: "122" }),
    shelfLocation: "R8-B2-R1-S4",
    locationId: "loc-r8-b2-r1-s4",
    qrBarcode: "QR-ELC1222024",
    filedDate: "2024-07-08",
    closedDate: "2026-03-15",
    notes: "Land compensation dispute - consent judgment",
    isMissing: false,
    createdBy: "user-registry",
  },
  {
    caseNumber: "ELC/EP/003/2025",
    caseType: "ELC",
    courtStation: "MSA",
    courtDivision: "Environment & Land",
    year: 2025,
    plaintiff: "Coastal Conservation Trust",
    defendant: "County Government of Mombasa",
    judge: "Hon. Justice Omar",
    status: "open",
    archiveCode: buildArchiveCode({ court: "MSA", caseType: "ELC", year: 2025, caseNo: "EP003" }),
    shelfLocation: "R2-B3-R2-S1",
    locationId: "loc-r2-b3-r2-s1",
    qrBarcode: "QR-ELCEP0032025",
    filedDate: "2025-05-22",
    closedDate: null,
    notes: "Environmental petition - mangrove conservation",
    isMissing: false,
    createdBy: "user-registry",
  },
  {
    caseNumber: "ELC/098/2024",
    caseType: "ELC",
    courtStation: "NKR",
    courtDivision: "Environment & Land",
    year: 2024,
    plaintiff: "Rift Valley Estates",
    defendant: "Water Resources Authority",
    judge: "Hon. Justice Kiprono",
    status: "pending_return",
    archiveCode: buildArchiveCode({ court: "NKR", caseType: "ELC", year: 2024, caseNo: "098" }),
    shelfLocation: "R4-B2-R3-S2",
    locationId: "loc-r4-b2-r3-s2",
    qrBarcode: "QR-ELC0982024",
    filedDate: "2024-10-30",
    closedDate: null,
    notes: "Water rights and riparian boundary dispute",
    isMissing: false,
    createdBy: "user-registry",
  },
  {
    caseNumber: "MCELC/007/2025",
    caseType: "ELC",
    courtStation: "KBT",
    courtDivision: "Magistrate Court",
    year: 2025,
    plaintiff: "Joseph Mwangi",
    defendant: "Grace Njoki",
    judge: "Hon. Magistrate Otieno",
    status: "open",
    archiveCode: buildArchiveCode({ court: "KBT", caseType: "ELC", year: 2025, caseNo: "MCELC007" }),
    shelfLocation: "R5-B1-R3-S1",
    locationId: "loc-r5-b1-r3-s1",
    qrBarcode: "QR-MCELC0072025",
    filedDate: "2025-02-18",
    closedDate: null,
    notes: "Boundary dispute - referred from Land Registrar",
    isMissing: false,
    createdBy: "user-registry",
  },
  {
    caseNumber: "MCELC/032/2023",
    caseType: "ELC",
    courtStation: "MSA",
    courtDivision: "Magistrate Court",
    year: 2023,
    plaintiff: "Ali Hassan",
    defendant: "Mombasa Municipal Council",
    judge: "Hon. Magistrate Nyambura",
    status: "closed",
    archiveCode: buildArchiveCode({ court: "MSA", caseType: "ELC", year: 2023, caseNo: "MCELC032" }),
    shelfLocation: "R3-B2-R1-S5",
    locationId: "loc-r3-b2-r1-s5",
    qrBarcode: "QR-MCELC0322023",
    filedDate: "2023-06-14",
    closedDate: "2025-01-30",
    notes: "Tenant-landlord dispute over market stall",
    isMissing: false,
    createdBy: "user-registry",
  },
  {
    caseNumber: "MCELC/MISC/001/2025",
    caseType: "ELC",
    courtStation: "NRB",
    courtDivision: "Magistrate Court",
    year: 2025,
    plaintiff: "Urban Residents Association",
    defendant: "Nairobi Water Company",
    judge: "Hon. Magistrate Wanjala",
    status: "open",
    archiveCode: buildArchiveCode({ court: "NRB", caseType: "ELC", year: 2025, caseNo: "MCELCMISC001" }),
    shelfLocation: "R6-B3-R2-S2",
    locationId: "loc-r6-b3-r2-s2",
    qrBarcode: "QR-MCELCMISC0012025",
    filedDate: "2025-03-05",
    closedDate: null,
    notes: "Miscellaneous application - water connection dispute",
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

  // Define case profiles that exercise all three court levels
  const profiles: Array<{
    prefix: string;
    type: CaseType;
    division: CourtDivision;
  }> = [
    // High Court cases (existing pattern)
    { prefix: "HCCC", type: "Civil", division: "High Court" },
    { prefix: "HCCR", type: "Criminal", division: "High Court" },
    { prefix: "COM", type: "Commercial", division: "Commercial Division" },
    { prefix: "CON", type: "Constitutional", division: "High Court" },
    { prefix: "PRO", type: "Probate", division: "High Court" },
    // Environment & Land Court cases (court_division = Environment & Land)
    { prefix: "ELC", type: "ELC", division: "Environment & Land" },
    // Magistrate Court cases
    { prefix: "MCCR", type: "Criminal", division: "Magistrate Court" },
    { prefix: "MCCC", type: "Civil", division: "Magistrate Court" },
    { prefix: "MCTR", type: "Traffic", division: "Magistrate Court" },
    { prefix: "MCSUCC", type: "Succession", division: "Magistrate Court" },
    // Magistrate ELC cases
    { prefix: "MCELC", type: "ELC", division: "Magistrate Court" },
  ];

  const stations = ["KBT", "NRB", "MSA", "KSM", "NKR"] as const;
  const statuses = ["open", "closed", "archived", "pending_return"] as const;
  const judges = ["Kamau", "Njeri", "Ochieng", "Akinyi", "Mwangi", "Hassan"] as const;

  let caseIdx = 0;
  for (let cycle = 0; cycle < 3; cycle++) {
  for (const profile of profiles) {
      caseIdx++;
      const station = stations[caseIdx % stations.length];
      const year = 2021 + (caseIdx % 5);
      const caseNo = String(200 + caseIdx);
      const caseNumber = `${profile.prefix}/${caseNo}/${year}`;
      const status = statuses[caseIdx % statuses.length];

      const legacyNumbers: string[] = [];
      if (profile.prefix === "HCCR" || profile.prefix === "MCCR") {
        legacyNumbers.push(`CR/${caseNo}/${year}`);
      } else if (profile.prefix === "COM") {
        legacyNumbers.push(`CIV/${caseNo}/${year}`);
      }

      const judgeTitle = profile.division === "Magistrate Court" ? "Hon. Magistrate" : "Hon. Justice";

      extra.push({
        caseNumber,
        legacyCaseNumbers: legacyNumbers,
        caseType: profile.type,
        courtStation: station,
        courtDivision: profile.division,
        year,
        plaintiff: `Plaintiff ${caseIdx}`,
        defendant: `Defendant ${caseIdx}`,
        judge: `${judgeTitle} ${judges[caseIdx % judges.length]}`,
        status,
        archiveCode: buildArchiveCode({ court: station, caseType: profile.type, year, caseNo }),
        shelfLocation: `R${(caseIdx % 6) + 1}-B${(caseIdx % 3) + 1}-R${(caseIdx % 4) + 1}-S${(caseIdx % 5) + 1}`,
        locationId: `loc-r${(caseIdx % 6) + 1}`,
        qrBarcode: `QR-${profile.prefix}${caseNo}${year}`,
        filedDate: `${year}-${String((caseIdx % 12) + 1).padStart(2, "0")}-15`,
        closedDate: status === "open" || status === "pending_return" ? null : `${year + 1}-06-30`,
        notes: null,
        isMissing: false,
        createdBy: "user-registry",
      });
    }
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
    const authoritativeId: Record<string, number | null> = {
      HC_CRIMINAL: 9,
      HC_COMMERCIAL: 13,
      HC_CIVIL: 19,
      MC_CRIMINAL: 33,
      MC_CIVIL: 31,
      MC_TRAFFIC: 35,
      MC_SUCCESSION: 37,
      MC_SEXUAL_OFFENCE: 72,
      // ELC - Environment & Land Court case types
      ELC_MATTER: 401,
      // Magistrate Court ELC types
      MC_ELC: 95,
      MC_ELCMISC: 113,
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
