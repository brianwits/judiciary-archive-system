import type { CaseStatus } from "@/types/case";

export const LOCATION_LEVELS = ["room", "bay", "rack", "shelf", "box"] as const;
export type LocationLevel = (typeof LOCATION_LEVELS)[number];

/** Case file physically assigned to `archive_locations` (dashboard / archive inventory). */
export type ArchiveStoredCase = {
  id: string;
  caseNumber: string;
  title: string;
  caseType: string;
  courtStation: string;
  courtDivision: string;
  year: number | null;
  plaintiff: string;
  defendant: string;
  judge: string;
  status: CaseStatus;
  archiveCode: string | null;
  shelfLocation: string | null;
  filedDate: string | null;
  /** Root-to-leaf location codes (from hierarchy of `archive_locations`). */
  storagePath: string | null;
};

export type ArchiveLocation = {
  id: string;
  parentId: string | null;
  level: LocationLevel;
  code: string;
  label: string;
  capacity: number;
  occupiedCount: number;
  category?: string;
};

export type RoomSummary = {
  id: string;
  code: string;
  label: string;
  category: string;
  capacity: number;
  occupiedCount: number;
  occupancyPercent: number;
  status: "available" | "near_full" | "full";
};
