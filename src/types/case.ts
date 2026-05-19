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
  "Family",
  "Commercial",
  "Constitutional",
  "Probate",
] as const;

export type CaseType = (typeof CASE_TYPES)[number];

export const COURT_STATIONS = ["KBT", "NRB", "MSA", "KSM", "NKR"] as const;
export type CourtStation = (typeof COURT_STATIONS)[number];

export const COURT_DIVISIONS = [
  "High Court",
  "Magistrate Court",
  "Environment & Land",
  "Family Division",
  "Commercial Division",
] as const;

export type CourtDivision = (typeof COURT_DIVISIONS)[number];

export type CaseFile = {
  id: string;
  caseNumber: string;
  caseType: CaseType;
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
  year?: number;
  status?: CaseStatus;
  courtDivision?: CourtDivision;
  partyName?: string;
};
