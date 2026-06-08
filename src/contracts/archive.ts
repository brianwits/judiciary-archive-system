import type {
  AuditLogRow,
  ArchiveLocationRow,
  CaseRow,
  FileMovementRow,
  RegistryRequestRow,
} from "@/types/database";
import type { AuditLog } from "@/types/audit";
import type { ArchiveLocation, ArchiveStoredCase, RoomSummary } from "@/types/archive";
import type { FileMovement } from "@/types/movement";
import type { RegistryRequest } from "@/types/dashboard";
import { CASE_STATUSES, type CaseStatus } from "@/types/case";

export function movementRowToDto(
  row: FileMovementRow & {
    cases?: { case_number: string; plaintiff: string | null; defendant: string | null; title: string } | null;
    profiles?: { full_name: string | null } | null;
  },
): FileMovement {
  const caseRow = row.cases;
  const plaintiff = caseRow?.plaintiff ?? caseRow?.title ?? "";
  const defendant = caseRow?.defendant ?? "";

  return {
    id: row.id,
    caseId: row.case_id,
    caseNumber: caseRow?.case_number ?? "",
    caseTitle: defendant ? `${plaintiff} v. ${defendant}` : plaintiff,
    checkedOutBy: row.checked_out_by ?? "",
    checkedOutByName: row.profiles?.full_name ?? "Unknown",
    destinationOffice: row.destination_office,
    purpose: row.purpose,
    expectedReturnDate: row.expected_return_date,
    actualReturnDate: row.actual_return_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function auditLogRowToDto(
  row: AuditLogRow & { profiles?: { full_name: string | null } | null },
): AuditLog {
  return {
    id: row.id,
    userId: row.user_id ?? "",
    userName: row.profiles?.full_name ?? "System",
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    description: row.description,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  };
}

export function archiveLocationRowToDto(row: ArchiveLocationRow): ArchiveLocation {
  return {
    id: row.id,
    parentId: row.parent_id,
    level: row.level,
    code: row.code,
    label: row.label,
    capacity: row.capacity,
    occupiedCount: row.occupied_count,
    category: row.category ?? undefined,
  };
}

function parseStoredCaseStatus(value: CaseRow["status"]): CaseStatus {
  if (CASE_STATUSES.includes(value as CaseStatus)) return value as CaseStatus;
  return "open";
}

/** Row shape returned by `list_archive_stored_cases` RPC. */
export type ArchiveStoredCaseRpcRow = {
  case_id: string;
  case_number: string;
  title: string;
  case_type: string | null;
  court_station: string | null;
  court_division: string | null;
  year: number | null;
  plaintiff: string | null;
  defendant: string | null;
  judge: string | null;
  status: CaseRow["status"];
  archive_code: string | null;
  shelf_location: string | null;
  filed_date: string | null;
  storage_path: string | null;
  matching_total: number;
};

export function archiveStoredCaseRpcRowToDto(row: ArchiveStoredCaseRpcRow): ArchiveStoredCase {
  return {
    id: row.case_id,
    caseNumber: row.case_number,
    title: row.title ?? "",
    caseType: row.case_type ?? "",
    courtStation: row.court_station ?? "",
    courtDivision: row.court_division ?? "",
    year: row.year,
    plaintiff: row.plaintiff ?? "",
    defendant: row.defendant ?? "",
    judge: row.judge ?? "",
    status: parseStoredCaseStatus(row.status),
    archiveCode: row.archive_code,
    shelfLocation: row.shelf_location,
    filedDate: row.filed_date,
    storagePath: row.storage_path,
  };
}

/** Case mapped to shelf/box leaf + optional path string (`R1 › B1 › …` from `archive_locations`). */
export function caseRowToArchiveStoredCase(row: CaseRow, storagePath: string | null): ArchiveStoredCase {
  return {
    id: row.id,
    caseNumber: row.case_number,
    title: row.title ?? "",
    caseType: row.case_type ?? "",
    courtStation: row.court_station ?? "",
    courtDivision: row.court_division ?? "",
    year: row.year,
    plaintiff: row.plaintiff ?? "",
    defendant: row.defendant ?? "",
    judge: row.judge ?? "",
    status: parseStoredCaseStatus(row.status),
    archiveCode: row.archive_code,
    shelfLocation: row.shelf_location,
    filedDate: row.filed_date,
    storagePath,
  };
}

export function roomSummaryFromLocation(row: ArchiveLocationRow): RoomSummary {
  const occupancyPercent =
    row.capacity > 0 ? Math.round((row.occupied_count / row.capacity) * 100) : 0;

  let status: RoomSummary["status"] = "available";
  if (occupancyPercent >= 90) status = "full";
  else if (occupancyPercent >= 70) status = "near_full";

  return {
    id: row.id,
    code: row.code,
    label: row.label,
    category: row.category ?? "",
    capacity: row.capacity,
    occupiedCount: row.occupied_count,
    occupancyPercent,
    status,
  };
}

export function registryRequestRowToDto(
  row: RegistryRequestRow & { cases?: { case_number: string } | null },
): RegistryRequest {
  const status = row.status as RegistryRequest["status"];
  return {
    id: row.id,
    caseNumber: row.cases?.case_number ?? "—",
    requestType: row.request_type,
    requester: row.requester,
    status: ["pending", "in_progress", "completed", "rejected"].includes(status)
      ? status
      : "pending",
    createdAt: row.created_at,
  };
}
