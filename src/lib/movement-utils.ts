import { isToday } from "date-fns";
import { normalizeArchiveFamily } from "@/lib/archive-family";
import type { FileMovement, MovementFilters, MovementSummary, MovementViewStatus } from "@/types/movement";

const OPEN_MOVEMENT_STATUSES = new Set<FileMovement["status"]>([
  "checked_out",
  "in_transit",
  "overdue",
]);

const DB_FAMILIES_BY_NORMALIZED_LABEL: Record<string, readonly string[]> = {
  Civil: [
    "Civil",
    "Children & Protection",
    "Employment & Labour",
    "Gender Justice",
    "Judicial Review",
    "Tribunal & Regulatory",
  ],
  Criminal: ["Criminal", "Anti-Corruption & Economic Crimes", "Election"],
  Commercial: ["Commercial"],
  Constitutional: ["Constitutional & Human Rights"],
  Probate: ["Probate"],
  Succession: ["Succession & Probate"],
  Traffic: ["Traffic"],
  ELC: ["Environment & Land"],
};

export function movementFamilyDbValues(family: string) {
  return DB_FAMILIES_BY_NORMALIZED_LABEL[family] ?? [family];
}

export function isMovementOpen(status: FileMovement["status"]) {
  return OPEN_MOVEMENT_STATUSES.has(status);
}

export function isMovementOverdue(
  status: FileMovement["status"],
  expectedReturnDate: string,
  actualReturnDate: string | null,
) {
  if (status === "overdue") return true;
  if (actualReturnDate) return false;
  if (!isMovementOpen(status)) return false;

  return new Date(expectedReturnDate) < new Date(new Date().toISOString().slice(0, 10));
}

export function normalizeMovementFamily(input: {
  caseType?: string | null;
  caseFamily?: string | null;
  courtDivision?: string | null;
}) {
  return normalizeArchiveFamily(input);
}

export function decorateMovement<T extends {
  status: FileMovement["status"];
  expectedReturnDate: string;
  actualReturnDate: string | null;
  caseType?: string | null;
  caseFamily?: string | null;
  courtDivision?: string | null;
}>(movement: T) {
  const caseFamily = normalizeMovementFamily({
    caseType: movement.caseType,
    caseFamily: movement.caseFamily,
    courtDivision: movement.courtDivision,
  });
  const isOpen = isMovementOpen(movement.status);
  const isOverdue = isMovementOverdue(
    movement.status,
    movement.expectedReturnDate,
    movement.actualReturnDate,
  );

  return {
    ...movement,
    caseFamily,
    isOpen,
    isOverdue,
  };
}

export function movementMatchesFilters(
  movement: Pick<FileMovement, "status" | "caseFamily" | "isOpen" | "isOverdue">,
  filters?: MovementFilters,
) {
  const status = filters?.status ?? "all";
  const family = filters?.family;

  const statusMatches =
    status === "all" ||
    (status === "open" && movement.isOpen) ||
    (status === "overdue" && movement.isOverdue) ||
    (status === "returned" && movement.status === "returned");

  const familyMatches = !family || family === "all" || movement.caseFamily === family;

  return statusMatches && familyMatches;
}

export function paginateFilteredMovements<T extends Pick<FileMovement, "status" | "caseFamily" | "isOpen" | "isOverdue">>(
  movements: T[],
  filters: MovementFilters | undefined,
  from: number,
  to: number,
) {
  return movements.filter((movement) => movementMatchesFilters(movement, filters)).slice(from, to + 1);
}

export function sortMovementsOperationally<T extends Pick<FileMovement, "isOverdue" | "expectedReturnDate" | "createdAt">>(
  movements: T[],
) {
  return [...movements].sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    const expectedDelta =
      new Date(a.expectedReturnDate).getTime() - new Date(b.expectedReturnDate).getTime();
    if (expectedDelta !== 0) return expectedDelta;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function sortRecentMovementPriority<T extends Pick<FileMovement, "isOpen" | "isOverdue" | "createdAt">>(
  movements: T[],
) {
  return [...movements].sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function summarizeMovements(
  movements: Pick<FileMovement, "status" | "actualReturnDate" | "isOpen" | "isOverdue">[],
): MovementSummary {
  return movements.reduce<MovementSummary>(
    (summary, movement) => {
      if (movement.isOpen) summary.openCount += 1;
      if (movement.status === "in_transit") summary.inTransitCount += 1;
      if (movement.isOverdue) summary.overdueCount += 1;
      if (
        movement.status === "returned" &&
        movement.actualReturnDate &&
        isToday(new Date(movement.actualReturnDate))
      ) {
        summary.returnedTodayCount += 1;
      }
      return summary;
    },
    {
      openCount: 0,
      overdueCount: 0,
      inTransitCount: 0,
      returnedTodayCount: 0,
    },
  );
}

export const MOVEMENT_VIEW_STATUSES: readonly MovementViewStatus[] = [
  "all",
  "open",
  "overdue",
  "returned",
] as const;
