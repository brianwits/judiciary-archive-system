export const MOVEMENT_STATUSES = [
  "checked_out",
  "in_transit",
  "returned",
  "overdue",
] as const;

export type MovementStatus = (typeof MOVEMENT_STATUSES)[number];

export type FileMovement = {
  id: string;
  caseId: string;
  caseNumber: string;
  caseTitle: string;
  checkedOutBy: string;
  checkedOutByName: string;
  destinationOffice: string;
  purpose: string;
  expectedReturnDate: string;
  actualReturnDate: string | null;
  status: MovementStatus;
  createdAt: string;
  updatedAt: string;
};

export type OpenMovementOption = {
  id: string;
  caseId: string;
  caseNumber: string;
  destinationOffice: string;
  createdAt: string;
};
