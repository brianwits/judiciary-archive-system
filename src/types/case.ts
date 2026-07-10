export const CASE_STATUSES = [
  "open",
  "closed",
  "archived",
  "missing",
  "pending_return",
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_TYPES = [
  "Civil",
  "Criminal",
  "ELC",
  "Commercial",
  "Constitutional",
  "Probate",
  "Traffic",
  "Succession",
] as const;

export type CaseType = (typeof CASE_TYPES)[number];

export const COURT_STATIONS = ["KBT", "NRB", "MSA", "KSM", "NKR"] as const;
export type CourtStation = (typeof COURT_STATIONS)[number];

export const COURT_DIVISIONS = [
  "High Court",
  "Magistrate Court",
  "Environment & Land",
  "Commercial Division",
] as const;

export type CourtDivision = (typeof COURT_DIVISIONS)[number];

export type CaseFile = {
  id: string;
  caseNumber: string;
  caseNumberRaw?: string | null;
  caseNumberNormalized?: string | null;
  trackingNumber?: string | null;
  sourceCaseId?: string | null;
  sourceSystem?: string | null;
  sourceUpdatedAt?: string | null;
  caseType: CaseType;
  caseTypeId: number | null;
  caseTypeCode: string;
  caseTypeName: string;
  caseTypeFullLabel: string;
  caseFamily: string;
  caseCourtLevel: string;
  classificationStatus: "canonical" | "legacy" | "pending_review";
  caseCategoryCode: string;
  caseCategoryName: string;
  courtStation: CourtStation;
  courtDivision: CourtDivision;
  year: number;
  plaintiff: string;
  defendant: string;
  judge: string;
  status: CaseStatus;
  archiveCode: string;
  shelfLocation: string | null;
  locationId: string | null;
  qrBarcode: string | null;
  filedDate: string | null;
  closedDate: string | null;
  notes: string | null;
  isMissing: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CaseFilters = {
  q?: string;
  query?: string;
  caseType?: CaseType;
  caseCategory?: string;
  caseTypeId?: number;
  classificationStatus?: "canonical" | "legacy" | "pending_review";
  year?: number;
  status?: CaseStatus;
  courtDivision?: CourtDivision;
  partyName?: string;
};
