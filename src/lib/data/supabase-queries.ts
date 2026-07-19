import {
  archiveLocationRowToDto,
  archiveStoredCaseRpcRowToDto,
  auditLogRowToDto,
  caseRowToArchiveStoredCase,
  movementRowToDto,
  registryRequestRowToDto,
  roomSummaryFromLocation,
  type ArchiveStoredCaseRpcRow,
} from "@/contracts/archive";
import { caseRowToDto } from "@/contracts/cases";
import { documentRowToDto } from "@/contracts/documents";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  type ListQuery,
} from "@/contracts/queries";
import { mapDbRoleToAppRole } from "@/lib/roles/map-db-role";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listProfilesWithAuthEmails } from "@/lib/supabase/admin-profiles";
import {
  decorateMovement,
  movementFamilyDbValues,
  movementMatchesFilters,
  paginateFilteredMovements,
  sortMovementsOperationally,
  sortRecentMovementPriority,
  summarizeMovements,
} from "@/lib/movement-utils";
import type { AuditAction, AuditLog } from "@/types/audit";
import type { ArchiveLocation, ArchiveStoredCase, RoomSummary } from "@/types/archive";
import type { CaseFile, CaseFilters } from "@/types/case";
import type { ScanMatchType } from "@/contracts/scanning";
import type { DashboardData, RegistryRequest } from "@/types/dashboard";
import type {
  AuditLogRow,
  ArchiveLocationRow,
  FileMovementRow,
  Json,
  ProfileRow,
} from "@/types/database";
import type { CaseDocument, DocumentCategory, OcrStatus } from "@/types/document";
import type { FileMovement, MovementFilters, MovementSummary, OpenMovementOption } from "@/types/movement";
import type { UserProfile } from "@/types/user";
import { parseNotificationPreferences } from "@/types/notification";

type SupabaseReadClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>;

function isMissingDbRpcError(error: { message?: string; code?: string }) {
  return (
    error.code === "PGRST202" ||
    (error.message?.includes("Could not find the function") ?? false)
  );
}

/** Max rows when loading all documents/audit logs for a single case detail view. */
const CASE_SCOPED_FETCH_LIMIT = 500;

/** Escape user input for PostgREST `.or()` ilike patterns (commas break OR syntax). */
function postgrestIlikePattern(value: string): string {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '""');
  return `"${`%${escaped}%`}"`;
}

function buildArchiveCodesPath(
  byId: Map<string, Pick<ArchiveLocationRow, "parent_id" | "code" | "mapping_source">>,
  leafId: string | null,
): string | null {
  if (!leafId) return null;
  const segments: string[] = [];
  let id: string | null = leafId;
  for (let depth = 0; depth < 64 && id; depth += 1) {
    const node = byId.get(id);
    if (!node) break;
    segments.push(node.code);
    id = node.parent_id;
  }
  if (segments.length === 0) return null;
  return segments.reverse().join(" › ");
}

function buildDescendantLocationIds(
  rows: Pick<ArchiveLocationRow, "id" | "parent_id">[],
  rootId: string,
) {
  const childrenByParent = new Map<string | null, string[]>();
  for (const row of rows) {
    const siblings = childrenByParent.get(row.parent_id) ?? [];
    siblings.push(row.id);
    childrenByParent.set(row.parent_id, siblings);
  }

  const descendants = new Set<string>();
  const queue = [rootId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || descendants.has(current)) continue;
    descendants.add(current);
    for (const childId of childrenByParent.get(current) ?? []) {
      queue.push(childId);
    }
  }

  return [...descendants];
}

async function fetchArchiveStoredCasesDirect(
  supabase: SupabaseReadClient,
  limitCap: number,
  offset: number,
): Promise<{ items: ArchiveStoredCase[]; total: number }> {
  const [{ count: totalStored, error: countError }, { data: locationRows, error: locationsError }] =
    await Promise.all([
      supabase
        .from("cases")
        .select("*", { count: "exact", head: true })
        .not("location_id", "is", null),
      supabase.from("archive_locations").select("id, parent_id, code, mapping_source"),
    ]);

  if (countError) throw new Error(countError.message);
  if (locationsError) throw new Error(locationsError.message);

  const locationById = new Map<
    string,
    Pick<ArchiveLocationRow, "parent_id" | "code" | "mapping_source">
  >((locationRows ?? []).map((loc) => [
    loc.id,
    { parent_id: loc.parent_id, code: loc.code, mapping_source: loc.mapping_source },
  ]));

  const { data: caseRows, error: casesError } = await supabase
    .from("cases")
    .select("*")
    .not("location_id", "is", null)
    .order("case_number", { ascending: true })
    .range(offset, offset + limitCap - 1);

  if (casesError) throw new Error(casesError.message);

  const rows = caseRows ?? [];
  return {
    items: rows.map((row) =>
      caseRowToArchiveStoredCase(
        row,
        buildArchiveCodesPath(locationById, row.location_id),
        row.location_id && locationById.get(row.location_id)?.mapping_source === "generated"
          ? "generated"
          : "verified",
      ),
    ),
    total: totalStored ?? 0,
  };
}

function pageRange(query?: Partial<ListQuery>) {
  const page = query?.page ?? DEFAULT_PAGE;
  const pageSize = query?.pageSize ?? DEFAULT_PAGE_SIZE;
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1, page, pageSize };
}

async function profileNameMap(
  userIds: string[],
  client?: SupabaseReadClient,
): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();

  const supabase = client ?? await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", uniqueIds);

  return new Map(
    (data ?? []).map((profile: Pick<ProfileRow, "id" | "full_name">) => [
      profile.id,
      profile.full_name ?? "Unknown",
    ]),
  );
}

function applyMovementQueryFilters<T extends {
  eq: (column: string, value: string) => T;
  in: (column: string, values: string[]) => T;
}>(query: T, filters?: MovementFilters) {
  if (!filters) return query;

  if (filters.status === "overdue") {
    query = query.in("status", ["checked_out", "in_transit", "overdue"]);
  } else if (filters.status === "returned") {
    query = query.eq("status", "returned");
  } else if (filters.status === "open") {
    query = query.in("status", ["checked_out", "in_transit", "overdue"]);
  }

  if (filters.family && filters.family !== "all") {
    query = query.in("cases.case_family", [...movementFamilyDbValues(filters.family)]);
  }

  return query;
}

export async function fetchUsersFromSupabase(): Promise<UserProfile[]> {
  const profiles = await listProfilesWithAuthEmails();

  return profiles.map((profile) => ({
    id: profile.id,
    fullName: profile.full_name ?? "User",
    email: profile.email ?? "",
    pjNumber: profile.pj_number ?? null,
    department: profile.department ?? null,
    role: mapDbRoleToAppRole(profile.role),
    isActive: profile.is_active ?? true,
    notificationPreferences: parseNotificationPreferences(profile.notification_preferences),
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  }));
}

export async function fetchCasesFromSupabase(
  filters?: CaseFilters,
  listQuery?: Partial<ListQuery>,
): Promise<CaseFile[]> {
  const page = await fetchCasesPageFromSupabase(filters, listQuery);
  return page.items;
}

export async function fetchCasesPageFromSupabase(
  filters?: CaseFilters,
  listQuery?: Partial<ListQuery>,
): Promise<{ items: CaseFile[]; total: number; page: number; pageSize: number }> {
  const supabase = await createClient();
  const { from, to, page, pageSize } = pageRange(listQuery);

  if (filters?.q ?? filters?.query) {
    const q = filters.q ?? filters.query ?? "";
    const [{ data, error }, { data: totalData, error: countError }] = await Promise.all([
      supabase.rpc("search_cases", {
        search_query: q,
        result_limit: pageSize,
        result_offset: from,
      }),
      supabase.rpc("search_cases_count", { search_query: q }),
    ]);
    if (error) throw new Error(error.message);
    const items = (data ?? []).map(caseRowToDto);
    const total =
      countError || totalData === null || totalData === undefined
        ? items.length < pageSize
          ? from + items.length
          : from + pageSize + 1
        : Number(totalData);
    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  let query = supabase.from("cases").select("*", { count: "exact" }).order("created_at", { ascending: false });

  if (filters?.year) {
    query = query
      .gte("filed_date", `${filters.year}-01-01`)
      .lte("filed_date", `${filters.year}-12-31`);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.caseType) {
    query = query.eq("case_type", filters.caseType);
  }

  if (filters?.caseTypeId) {
    query = query.eq("case_type_id", filters.caseTypeId);
  }

  if (filters?.classificationStatus === "canonical") {
    query = query.not("case_type_id", "is", null);
  } else if (filters?.classificationStatus === "pending_review") {
    query = query.is("case_type_id", null).is("case_category_code", null);
  } else if (filters?.classificationStatus === "legacy") {
    query = query.is("case_type_id", null).not("case_category_code", "is", null);
  }

  if (filters?.caseCategory) {
    query = query.eq("case_category_code", filters.caseCategory);
  }

  if (filters?.courtDivision) {
    query = query.eq("court_division", filters.courtDivision);
  }

  if (filters?.partyName) {
    const party = filters.partyName.trim();
    if (party) {
      const pattern = postgrestIlikePattern(party);
      query = query.or(`plaintiff.ilike.${pattern},defendant.ilike.${pattern}`);
    }
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.message);
  return {
    items: (data ?? []).map(caseRowToDto),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function fetchMovementsFromSupabase(
  listQuery?: Partial<ListQuery>,
  filters?: MovementFilters,
  client?: SupabaseReadClient,
): Promise<FileMovement[]> {
  const supabase = client ?? await createClient();
  const { from, to } = pageRange(listQuery);

  let query = supabase
    .from("file_movements")
    .select("*, cases!inner(case_number, plaintiff, defendant, title, case_type, case_family, court_division, archive_code, shelf_location)")
    .order("created_at", { ascending: false });

  query = applyMovementQueryFilters(query, filters);
  const paginateAfterDecoration = filters?.status === "overdue";
  const { data, error } = await (paginateAfterDecoration ? query : query.range(from, to));

  if (error) throw new Error(error.message);

  const names = await profileNameMap((data ?? []).map((row) => row.checked_out_by ?? ""), supabase);

  const movements = (data ?? [])
    .map((row) =>
      movementRowToDto({
        ...row,
        profiles: row.checked_out_by
          ? { full_name: names.get(row.checked_out_by) ?? "Unknown" }
          : null,
      }),
    );

  if (paginateAfterDecoration) {
    return paginateFilteredMovements(movements, filters, from, to);
  }

  return movements.filter((movement) => movementMatchesFilters(movement, filters));
}

export async function fetchOpenMovementsFromSupabase(
  filters?: MovementFilters,
  client?: SupabaseReadClient,
): Promise<OpenMovementOption[]> {
  const supabase = client ?? await createClient();

  let query = supabase
    .from("file_movements")
    .select("id, case_id, destination_office, created_at, expected_return_date, actual_return_date, status, cases!inner(case_number, case_type, case_family, court_division, archive_code, shelf_location)")
    .in("status", ["checked_out", "in_transit", "overdue"])
    .order("expected_return_date", { ascending: true });

  query = applyMovementQueryFilters(query, filters);

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return sortMovementsOperationally(
    (data ?? [])
      .map((row) =>
        decorateMovement({
          id: row.id,
          caseId: row.case_id,
          caseNumber: row.cases?.case_number ?? "",
          caseFamily: row.cases?.case_family ?? row.cases?.case_type ?? "Other",
          courtDivision: row.cases?.court_division ?? "",
          archiveCode: row.cases?.archive_code ?? null,
          shelfLocation: row.cases?.shelf_location ?? null,
          caseType: row.cases?.case_type ?? null,
          caseTitle: row.cases?.case_number ?? "",
          checkedOutBy: "",
          checkedOutByName: "",
          destinationOffice: row.destination_office,
          purpose: "",
          expectedReturnDate: row.expected_return_date,
          actualReturnDate: row.actual_return_date,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.created_at,
        }),
      )
      .filter((movement) => movementMatchesFilters(movement, filters)),
  ).map((movement) => ({
    id: movement.id,
    caseId: movement.caseId,
    caseNumber: movement.caseNumber,
    caseFamily: movement.caseFamily,
    archiveCode: movement.archiveCode,
    shelfLocation: movement.shelfLocation,
    expectedReturnDate: movement.expectedReturnDate,
    status: movement.status,
    isOverdue: movement.isOverdue,
    destinationOffice: movement.destinationOffice,
    createdAt: movement.createdAt,
  }));
}

export async function fetchMovementSummaryFromSupabase(
  filters?: MovementFilters,
  client?: SupabaseReadClient,
): Promise<MovementSummary> {
  const supabase = client ?? await createClient();

  let query = supabase
    .from("file_movements")
    .select("id, status, expected_return_date, actual_return_date, created_at, cases!inner(case_type, case_family, court_division)");

  query = applyMovementQueryFilters(query, filters);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return summarizeMovements(
    (data ?? [])
      .map((row) =>
        decorateMovement({
          id: row.id,
          caseId: "",
          caseNumber: "",
          caseTitle: "",
          caseFamily: row.cases?.case_family ?? row.cases?.case_type ?? "Other",
          courtDivision: row.cases?.court_division ?? "",
          archiveCode: null,
          shelfLocation: null,
          caseType: row.cases?.case_type ?? null,
          checkedOutBy: "",
          checkedOutByName: "",
          destinationOffice: "",
          purpose: "",
          expectedReturnDate: row.expected_return_date,
          actualReturnDate: row.actual_return_date,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.created_at,
        }),
      )
      .filter((movement) => movementMatchesFilters(movement, filters)),
  );
}

export async function fetchMovementsSearchFromSupabase(
  query: string,
  listQuery?: Partial<ListQuery>,
  client?: SupabaseReadClient,
): Promise<FileMovement[]> {
  const supabase = client ?? await createClient();
  const { from, to } = pageRange(listQuery);
  const trimmed = query.trim();
  if (!trimmed) return [];

  const { data, error } = await supabase.rpc("search_file_movements", {
    search_query: trimmed,
    result_limit: to - from + 1,
    result_offset: from,
  });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Array<{
    id: string;
    case_id: string;
    checked_out_by: string | null;
    destination_office: string;
    purpose: string;
    expected_return_date: string;
    actual_return_date: string | null;
    status: FileMovementRow["status"];
    created_at: string;
    updated_at: string;
    case_number: string;
    plaintiff: string | null;
    defendant: string | null;
    title: string;
    case_type: string | null;
    case_family: string | null;
    court_division: string | null;
    archive_code: string | null;
    shelf_location: string | null;
  }>;

  const names = await profileNameMap(rows.map((row) => row.checked_out_by ?? ""), supabase);

  return rows.map((row) =>
    movementRowToDto({
      ...row,
      cases: {
        case_number: row.case_number,
        plaintiff: row.plaintiff,
        defendant: row.defendant,
        title: row.title,
        case_type: row.case_type,
        case_family: row.case_family,
        court_division: row.court_division,
        archive_code: row.archive_code,
        shelf_location: row.shelf_location,
      },
      profiles: row.checked_out_by ? { full_name: names.get(row.checked_out_by) ?? "Unknown" } : null,
    }),
  );
}

export async function fetchRecentMovementsFromSupabase(
  limit = 5,
  filters?: MovementFilters,
  client?: SupabaseReadClient,
): Promise<FileMovement[]> {
  const movements = await fetchMovementsFromSupabase({ page: 1, pageSize: Math.max(limit * 4, 20) }, filters, client);
  return sortRecentMovementPriority(movements).slice(0, limit);
}

export async function fetchMovementsByCaseFromSupabase(
  caseId: string,
  client?: SupabaseReadClient,
): Promise<FileMovement[]> {
  const supabase = client ?? await createClient();
  const { data, error } = await supabase
    .from("file_movements")
    .select("*, cases(case_number, plaintiff, defendant, title, case_type, case_family, court_division, archive_code, shelf_location)")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const names = await profileNameMap((data ?? []).map((row) => row.checked_out_by ?? ""), supabase);

  return (data ?? []).map((row) =>
    movementRowToDto({
      ...row,
      profiles: row.checked_out_by
        ? { full_name: names.get(row.checked_out_by) ?? "Unknown" }
        : null,
    }),
  );
}

function mapAuditLogRows(
  rows: AuditLogRow[],
  names: Map<string, string>,
): AuditLog[] {
  return rows.map((row) =>
    auditLogRowToDto({
      ...row,
      profiles: row.user_id ? { full_name: names.get(row.user_id) ?? "System" } : null,
    }),
  );
}

export async function fetchAuditLogsFromSupabase(
  listQuery?: Partial<ListQuery>,
  filters?: { action?: AuditAction },
  client?: SupabaseReadClient,
): Promise<AuditLog[]> {
  const supabase = client ?? await createClient();
  const { from, to } = pageRange(listQuery);

  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }

  const { data, error } = await query.range(from, to);

  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const names = await profileNameMap(rows.map((row) => row.user_id ?? ""), supabase);

  return mapAuditLogRows(rows, names);
}

const AUDIT_EXPORT_LIMIT = 5000;

export async function fetchAuditLogsForExport(
  filters?: { action?: AuditAction },
  client?: SupabaseReadClient,
  limit = AUDIT_EXPORT_LIMIT,
): Promise<{ logs: AuditLog[]; truncated: boolean }> {
  const supabase = client ?? await createClient();

  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as AuditLogRow[];
  const truncated = rows.length > limit;
  const slice = truncated ? rows.slice(0, limit) : rows;
  const names = await profileNameMap(slice.map((row) => row.user_id ?? ""), supabase);

  return { logs: mapAuditLogRows(slice, names), truncated };
}

export async function fetchAuditLogsForCaseFromSupabase(
  caseId: string,
  caseNumber: string,
  listQuery?: Partial<ListQuery>,
  client?: SupabaseReadClient,
): Promise<AuditLog[]> {
  const supabase = client ?? await createClient();
  const { from, pageSize } = pageRange(listQuery);
  const resultLimit = listQuery ? pageSize : CASE_SCOPED_FETCH_LIMIT;
  const resultOffset = listQuery ? from : 0;

  const { data, error } = await supabase.rpc("list_audit_logs_for_case", {
    p_case_id: caseId,
    p_case_number: caseNumber,
    result_limit: resultLimit,
    result_offset: resultOffset,
  });

  if (error) {
    if (isMissingDbRpcError(error)) {
      const { data: movements } = await supabase
        .from("file_movements")
        .select("id")
        .eq("case_id", caseId);
      const movementIds = (movements ?? []).map((row) => row.id);
      const filters = [
        `entity_id.eq.${caseId}`,
        `metadata->>caseNumber.eq.${caseNumber}`,
        ...movementIds.map((id) => `entity_id.eq.${id}`),
      ];

      const { data: rows, error: queryError } = await supabase
        .from("audit_logs")
        .select("*")
        .or(filters.join(","))
        .order("created_at", { ascending: false })
        .range(resultOffset, resultOffset + resultLimit - 1);

      if (queryError) throw new Error(queryError.message);

      const auditRows = (rows ?? []) as AuditLogRow[];
      const names = await profileNameMap(auditRows.map((row) => row.user_id ?? ""), supabase);
      return mapAuditLogRows(auditRows, names);
    }
    throw new Error(error.message);
  }

  const rows = (data ?? []) as AuditLogRow[];
  const names = await profileNameMap(rows.map((row) => row.user_id ?? ""), supabase);

  return mapAuditLogRows(rows, names);
}

export async function fetchRoomSummariesFromSupabase(client?: SupabaseReadClient): Promise<RoomSummary[]> {
  const supabase = client ?? await createClient();
  const { data, error } = await supabase
    .from("archive_locations")
    .select("*")
    .eq("level", "room")
    .order("code", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(roomSummaryFromLocation);
}

export async function fetchArchiveStoredCasesFromSupabase(
  opts?: { limit?: number; offset?: number },
  client?: SupabaseReadClient,
): Promise<{ items: ArchiveStoredCase[]; total: number }> {
  const supabase = client ?? await createClient();
  const limitCap = Math.min(Math.max(opts?.limit ?? 300, 1), 500);
  const offset = Math.max(opts?.offset ?? 0, 0);

  const { data, error } = await supabase.rpc("list_archive_stored_cases", {
    result_limit: limitCap,
    result_offset: offset,
  });

  if (error) {
    if (isMissingDbRpcError(error)) {
      return fetchArchiveStoredCasesDirect(supabase, limitCap, offset);
    }
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ArchiveStoredCaseRpcRow[];
  if (rows.length === 0) {
    return { items: [], total: 0 };
  }

  return {
    items: rows.map(archiveStoredCaseRpcRowToDto),
    total: Number(rows[0]?.matching_total ?? 0),
  };
}

export async function fetchArchiveStoredCasesForRoomFromSupabase(
  roomId: string,
  opts?: { limit?: number; offset?: number },
  client?: SupabaseReadClient,
): Promise<{ items: ArchiveStoredCase[]; total: number }> {
  const supabase = client ?? await createClient();
  const limitCap = Math.min(Math.max(opts?.limit ?? 60, 1), 500);
  const offset = Math.max(opts?.offset ?? 0, 0);

  const { data: locationRows, error: locationsError } = await supabase
    .from("archive_locations")
    .select("id, parent_id, code, mapping_source");

  if (locationsError) throw new Error(locationsError.message);

  const rows = locationRows ?? [];
  const descendantIds = buildDescendantLocationIds(rows, roomId);
  if (descendantIds.length === 0) {
    return { items: [], total: 0 };
  }

  const locationById = new Map<
    string,
    Pick<ArchiveLocationRow, "parent_id" | "code" | "mapping_source">
  >(rows.map((row) => [row.id, row]));

  const [{ count: total, error: countError }, { data: caseRows, error: casesError }] = await Promise.all([
    supabase
      .from("cases")
      .select("*", { count: "exact", head: true })
      .in("location_id", descendantIds),
    supabase
      .from("cases")
      .select("*")
      .in("location_id", descendantIds)
      .order("case_number", { ascending: true })
      .range(offset, offset + limitCap - 1),
  ]);

  if (countError) throw new Error(countError.message);
  if (casesError) throw new Error(casesError.message);

  return {
    items: (caseRows ?? []).map((row) =>
      caseRowToArchiveStoredCase(
        row,
        buildArchiveCodesPath(locationById, row.location_id),
        row.location_id && locationById.get(row.location_id)?.mapping_source === "generated"
          ? "generated"
          : "verified",
      ),
    ),
    total: total ?? 0,
  };
}

export async function fetchLocationByIdFromSupabase(
  id: string,
  client?: SupabaseReadClient,
): Promise<ArchiveLocation | null> {
  const supabase = client ?? await createClient();
  const { data, error } = await supabase
    .from("archive_locations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? archiveLocationRowToDto(data) : null;
}

export async function fetchLocationChildrenFromSupabase(
  parentId: string | null,
  client?: SupabaseReadClient,
): Promise<ArchiveLocation[]> {
  const supabase = client ?? await createClient();
  let query = supabase.from("archive_locations").select("*").order("code", { ascending: true });

  query = parentId ? query.eq("parent_id", parentId) : query.is("parent_id", null);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(archiveLocationRowToDto);
}

export async function fetchRegistryRequestsFromSupabase(
  client?: SupabaseReadClient,
): Promise<RegistryRequest[]> {
  const supabase = client ?? await createClient();
  const { data, error } = await supabase
    .from("registry_requests")
    .select("*, cases(case_number)")
    .order("created_at", { ascending: false })
    .limit(DEFAULT_PAGE_SIZE);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => registryRequestRowToDto(row));
}

export async function fetchDocumentsFromSupabase(
  caseId?: string,
  client?: SupabaseReadClient,
): Promise<CaseDocument[]> {
  const supabase = client ?? await createClient();
  const rowLimit = caseId ? CASE_SCOPED_FETCH_LIMIT : DEFAULT_PAGE_SIZE;
  let query = supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(rowLimit);

  if (caseId) query = query.eq("case_id", caseId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const names = await profileNameMap((data ?? []).map((row) => row.uploaded_by ?? ""), supabase);

  return (data ?? []).map((row) =>
    documentRowToDto(row, row.uploaded_by ? names.get(row.uploaded_by) ?? null : null),
  );
}

/**
 * Batch-load documents for multiple case IDs in a single round-trip.
 * Eliminates N+1 when rendering a list of cases with document previews.
 */
export async function fetchDocumentsForCasesFromSupabase(
  caseIds: string[],
  client?: SupabaseReadClient,
): Promise<Map<string, CaseDocument[]>> {
  if (caseIds.length === 0) return new Map();

  const supabase = client ?? await createClient();

  const { data, error } = await supabase.rpc("list_documents_for_cases", {
    p_case_ids: caseIds,
    p_limit_per_case: 5,
  });

  if (error) {
    if (isMissingDbRpcError(error)) {
      // Fallback: fetch per-case sequentially
      const result = new Map<string, CaseDocument[]>();
      for (const caseId of caseIds) {
        const docs = await fetchDocumentsFromSupabase(caseId, supabase);
        result.set(caseId, docs);
      }
      return result;
    }
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{
    case_id: string;
    doc_id: string;
    title: string;
    category: string | null;
    ocr_status: string | null;
    uploaded_by: string | null;
    file_size: number;
    mime_type: string;
    created_at: string;
  }>;

  // Group by case_id
  const docMap = new Map<string, CaseDocument[]>();
  const uploaderIds = new Set<string>();
  for (const row of rows) {
    if (row.uploaded_by) uploaderIds.add(row.uploaded_by);
  }

  // Resolve uploader names in a single batch query
  const nameMap = uploaderIds.size > 0
    ? await profileNameMap([...uploaderIds], supabase)
    : new Map<string, string>();

  for (const row of rows) {
    const doc: CaseDocument = {
      id: row.doc_id,
      caseId: row.case_id,
      title: row.title,
      category: (row.category ?? "Pleadings") as DocumentCategory,
      storagePath: "",
      mimeType: row.mime_type,
      fileSize: row.file_size,
      ocrStatus: (row.ocr_status ?? "pending") as OcrStatus,
      uploadedBy: row.uploaded_by,
      uploadedByName: row.uploaded_by ? (nameMap.get(row.uploaded_by) ?? null) : null,
      createdAt: row.created_at,
    };
    const existing = docMap.get(row.case_id) ?? [];
    existing.push(doc);
    docMap.set(row.case_id, existing);
  }

  return docMap;
}

/**
 * Batch-load accurate document counts for multiple case IDs.
 */
export async function fetchDocumentCountsForCasesFromSupabase(
  caseIds: string[],
  client?: SupabaseReadClient,
): Promise<Map<string, number>> {
  if (caseIds.length === 0) return new Map();

  const supabase = client ?? await createClient();

  const { data, error } = await supabase.rpc("count_documents_for_cases", {
    p_case_ids: caseIds,
  });

  if (error) {
    if (isMissingDbRpcError(error)) {
      const result = new Map<string, number>();
      for (const caseId of caseIds) {
        const docs = await fetchDocumentsFromSupabase(caseId, supabase);
        result.set(caseId, docs.length);
      }
      return result;
    }
    throw new Error(error.message);
  }

  const counts = new Map<string, number>();
  for (const caseId of caseIds) {
    counts.set(caseId, 0);
  }
  for (const row of data ?? []) {
    counts.set(row.case_id, Number(row.document_count));
  }
  return counts;
}

/** Parse the JSON result from fetch_dashboard_data RPC into typed DashboardData. */
function parseDashboardJson(json: Json): DashboardData {
  const d = json as Record<string, Json>;

  const kpis = (d.kpis as Array<Record<string, Json>>) ?? [];
  const notices = (d.notices as Array<Record<string, Json>>) ?? [];
  const memos = (d.memos as Array<Record<string, Json>>) ?? [];
  const broadcasts = (d.broadcasts as Array<Record<string, Json>>) ?? [];
  const approvals = (d.approvals as Array<Record<string, Json>>) ?? [];
  const alerts = (d.alerts as Array<Record<string, Json>>) ?? [];

  return {
    activeCasesCount: Number(d.activeCasesCount ?? 0),
    registryRequestsCount: Number(d.registryRequestsCount ?? 0),
    kpis: kpis.map((k) => ({
      label: String(k.label ?? ""),
      value: String(k.value ?? ""),
      variant: (k.variant as DashboardData["kpis"][number]["variant"]) ?? "default",
    })),
    notices: notices.map((n) => ({
      id: String(n.id ?? ""),
      title: String(n.title ?? ""),
      body: String(n.body ?? ""),
      author: String(n.author ?? "System"),
      priority: (n.priority as "low" | "normal" | "high") ?? "normal",
      createdAt: String(n.createdAt ?? ""),
    })),
    memos: memos.map((m) => ({
      id: String(m.id ?? ""),
      title: String(m.title ?? ""),
      reference: String(m.reference ?? ""),
      author: String(m.author ?? "System"),
      createdAt: String(m.createdAt ?? ""),
    })),
    broadcasts: broadcasts.map((b) => ({
      id: String(b.id ?? ""),
      title: String(b.title ?? ""),
      message: String(b.message ?? ""),
      author: String(b.author ?? "System"),
      createdAt: String(b.createdAt ?? ""),
    })),
    approvals: approvals.map((a) => ({
      id: String(a.id ?? ""),
      title: String(a.title ?? ""),
      requester: String(a.requester ?? ""),
      type: String(a.type ?? ""),
      status: (a.status as "pending" | "approved" | "rejected") ?? "pending",
      createdAt: String(a.createdAt ?? ""),
    })),
    alerts: alerts.map((a) => ({
      id: String(a.id ?? ""),
      title: String(a.title ?? ""),
      message: String(a.message ?? ""),
      severity: (a.severity as "info" | "warning" | "danger") ?? "info",
      createdAt: String(a.createdAt ?? ""),
    })),
  };
}

export async function fetchDashboardFromSupabase(client?: SupabaseReadClient): Promise<DashboardData> {
  const supabase = client ?? await createClient();

  const { data, error } = await supabase.rpc("fetch_dashboard_data");
  if (error) throw new Error(error.message);

  return parseDashboardJson(data);
}

export async function insertAuditLog(
  entry: Omit<AuditLog, "id" | "createdAt">,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("audit_logs").insert({
    user_id: entry.userId || null,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    description: entry.description,
    metadata: entry.metadata as Json,
  });
  if (error) throw new Error(error.message);
}

export async function fetchCaseByNumberFromSupabase(caseNumber: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("lookup_case_by_identifier", {
    identifier: caseNumber,
  });

  if (error) throw new Error(error.message);

  const row = data?.[0];
  return row ? caseRowToDto(row) : null;
}

export async function fetchCaseByScanCodeFromSupabase(
  code: string,
  client?: SupabaseReadClient,
): Promise<{ caseFile: CaseFile; matchedBy: ScanMatchType } | null> {
  const supabase = client ?? await createClient();
  const normalized = code.trim();
  if (!normalized) return null;

  const { data, error } = await supabase.rpc("lookup_case_for_scan", {
    scan_code: normalized,
  });

  if (!error) {
    const row = data?.[0];
    return row
      ? {
          caseFile: caseRowToDto(row),
          matchedBy: row.matched_by as ScanMatchType,
        }
      : null;
  }

  if (!isMissingDbRpcError(error)) {
    throw new Error(error.message);
  }

  const candidates = [
    { column: "case_number", matchedBy: "case_number" as const },
    { column: "case_number_raw", matchedBy: "case_number_raw" as const },
    { column: "case_number_normalized", matchedBy: "case_number_normalized" as const },
    { column: "tracking_number", matchedBy: "tracking_number" as const },
    { column: "qr_barcode", matchedBy: "qr_barcode" as const },
    { column: "archive_code", matchedBy: "archive_code" as const },
  ];

  for (const candidate of candidates) {
    const { data: row, error: queryError } = await supabase
      .from("cases")
      .select("*")
      .ilike(candidate.column, normalized)
      .limit(1)
      .maybeSingle();

    if (queryError) throw new Error(queryError.message);
    if (row) {
      return {
        caseFile: caseRowToDto(row),
        matchedBy: candidate.matchedBy,
      };
    }
  }

  const { data: alias, error: aliasError } = await supabase
    .from("case_number_aliases")
    .select("case_id")
    .ilike("case_number", normalized)
    .limit(1)
    .maybeSingle();

  if (aliasError) throw new Error(aliasError.message);
  if (alias) {
    const { data: row, error: caseError } = await supabase
      .from("cases")
      .select("*")
      .eq("id", alias.case_id)
      .maybeSingle();
    if (caseError) throw new Error(caseError.message);
    if (row) {
      return {
        caseFile: caseRowToDto(row),
        matchedBy: "case_number_alias",
      };
    }
  }

  return null;
}

/** @internal exported for testing only. */
export function parseReportJson(json: Json) {
  const d = json as Record<string, Json>;

  const archiveGrowth = (d.archiveGrowth as Array<Record<string, Json>>) ?? [];
  const missingTrend = (d.missingTrend as Array<Record<string, Json>>) ?? [];
  const divisionStats = (d.divisionStats as Array<Record<string, Json>>) ?? [];
  const judgeStats = (d.judgeStats as Array<Record<string, Json>>) ?? [];
  const ageBandStats = (d.ageBandStats as Array<Record<string, Json>>) ?? [];
  const courtLevelStats = (d.courtLevelStats as Array<Record<string, Json>>) ?? [];
  const caseTypeStats = (d.caseTypeStats as Array<Record<string, Json>>) ?? [];
  const caseCategoryStats = (d.caseCategoryStats as Array<Record<string, Json>>) ?? [];

  return {
    archiveGrowth: archiveGrowth.length > 0
      ? archiveGrowth.map((g) => ({ month: String(g.month ?? ""), count: Number(g.count ?? 0) }))
      : [{ month: "N/A", count: 0 }],
    missingTrend: missingTrend.length > 0
      ? missingTrend.map((t) => ({ month: String(t.month ?? ""), count: Number(t.count ?? 0) }))
      : [{ month: "N/A", count: 0 }],
    divisionStats: divisionStats.length > 0
      ? divisionStats.map((s) => ({ name: String(s.name ?? ""), value: Number(s.value ?? 0) }))
      : [{ name: "High Court", value: 0 }],
    judgeStats: judgeStats.map((item) => ({
      name: String(item.name ?? ""),
      value: Number(item.value ?? 0),
    })),
    ageBandStats: ageBandStats.map((item) => ({
      label: String(item.label ?? ""),
      value: Number(item.value ?? 0),
    })),
    courtLevelStats: courtLevelStats.map((item) => ({
      name: String(item.name ?? ""),
      value: Number(item.value ?? 0),
    })),
    caseTypeStats: caseTypeStats.map((item) => ({
      caseTypeId: item.caseTypeId == null ? null : Number(item.caseTypeId),
      code: String(item.code ?? ""),
      name: String(item.name ?? ""),
      fullLabel: String(item.fullLabel ?? ""),
      courtLevel: String(item.courtLevel ?? ""),
      value: Number(item.value ?? 0),
    })),
    caseCategoryStats: caseCategoryStats.map((item) => ({
      categoryCode: String(item.categoryCode ?? ""),
      categoryName: String(item.categoryName ?? ""),
      courtLevel: String(item.courtLevel ?? ""),
      value: Number(item.value ?? 0),
    })),
    unclassifiedCount: Number(d.unclassifiedCount ?? 0),
    totalCases: Number(d.totalCases ?? 0),
  };
}

export async function fetchReportDataFromSupabase(
  filters: {
    from?: string;
    to?: string;
    courtLevel?: string;
    caseTypeId?: number;
  } = {},
  client?: SupabaseReadClient,
) {
  const supabase = client ?? await createClient();

  const { data, error } = await supabase.rpc("fetch_report_data", {
    p_from: filters.from,
    p_to: filters.to,
    p_court_level: filters.courtLevel,
    p_case_type_id: filters.caseTypeId,
  });
  if (error) throw new Error(error.message);

  return parseReportJson(data);
}
