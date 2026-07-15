export const MOVEMENT_STATUSES = [
  "checked_out",
  "in_transit",
  "returned",
  "overdue",
] as const;

export type MovementStatus = (typeof MOVEMENT_STATUSES)[number];

export type MovementViewStatus = "all" | "open" | "overdue" | "returned";

export type FileMovement = {
  id: string;
  caseId: string;
  caseNumber: string;
  caseTitle: string;
  caseFamily: string;
  courtDivision: string;
  archiveCode: string | null;
  shelfLocation: string | null;
  checkedOutBy: string;
  checkedOutByName: string;
  destinationOffice: string;
  purpose: string;
  expectedReturnDate: string;
  actualReturnDate: string | null;
  status: MovementStatus;
  isOpen: boolean;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
};

export type OpenMovementOption = {
  id: string;
  caseId: string;
  caseNumber: string;
  caseFamily: string;
  archiveCode: string | null;
  shelfLocation: string | null;
  expectedReturnDate: string;
  status: MovementStatus;
  isOverdue: boolean;
  destinationOffice: string;
  createdAt: string;
};

export type MovementFilters = {
  status?: MovementViewStatus;
  family?: string;
};

export type MovementSummary = {
  openCount: number;
  overdueCount: number;
  inTransitCount: number;
  returnedTodayCount: number;
};
