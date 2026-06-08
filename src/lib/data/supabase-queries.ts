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
import type { AuditAction, AuditLog } from "@/types/audit";
import type { ArchiveLocation, ArchiveStoredCase, RoomSummary } from "@/types/archive";
import type { CaseFile, CaseFilters } from "@/types/case";
import type { DashboardData, RegistryRequest } from "@/types/dashboard";
import type { AuditLogRow, ArchiveLocationRow, Json, ProfileRow } from "@/types/database";
import type { CaseDocument, DocumentCategory, OcrStatus } from "@/types/document";
import type { FileMovement } from "@/types/movement";
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

function buildArchiveCodesPath(
  byId: Map<string, Pick<ArchiveLocationRow, "parent_id" | "code">>,
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
      supabase.from("archive_locations").select("id, parent_id, code"),
    ]);

  if (countError) throw new Error(countError.message);
  if (locationsError) throw new Error(locationsError.message);

  const locationById = new Map<
    string,
    Pick<ArchiveLocationRow, "parent_id" | "code">
  >((locationRows ?? []).map((loc) => [loc.id, { parent_id: loc.parent_id, code: loc.code }]));

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
      caseRowToArchiveStoredCase(row, buildArchiveCodesPath(locationById, row.location_id)),
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

export async function fetchUsersFromSupabase(client?: SupabaseReadClient): Promise<UserProfile[]> {
  const supabase = client ?? await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) throw new Error(error.message);

  const profiles = data ?? [];
  const emailById = new Map<string, string>();

  try {
    const admin = createAdminClient();
    const perPage = 1000;
    for (let page = 1; page <= 100; page += 1) {
      const { data: authData, error: authError } = await admin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (authError) throw authError;
      for (const user of authData.users) {
        if (user.email) emailById.set(user.id, user.email);
      }
      if (authData.users.length < perPage) break;
    }
  } catch (e) {
    console.error("Admin email merge failed; returning profiles without auth emails.", e);
  }

  return profiles.map((profile) => ({
    id: profile.id,
    fullName: profile.full_name ?? "User",
    email: emailById.get(profile.id) ?? "",
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
    const { data, error } = await supabase.rpc("search_cases", {
      search_query: q,
      result_limit: pageSize,
      result_offset: from,
    });
    if (error) throw new Error(error.message);
    const items = (data ?? []).map(caseRowToDto);
    return {
      items,
      total: items.length < pageSize ? from + items.length : from + pageSize + 1,
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

  if (filters?.courtDivision) {
    query = query.eq("court_division", filters.courtDivision);
  }

  if (filters?.partyName) {
    const party = filters.partyName;
    query = query.or(`plaintiff.ilike.%${party}%,defendant.ilike.%${party}%`);
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
  client?: SupabaseReadClient,
): Promise<FileMovement[]> {
  const supabase = client ?? await createClient();
  const { from, to } = pageRange(listQuery);

  const { data, error } = await supabase
    .from("file_movements")
    .select("*, cases(case_number, plaintiff, defendant, title)")
    .order("created_at", { ascending: false })
    .range(from, to);

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

export async function fetchRecentMovementsFromSupabase(
  limit = 5,
  client?: SupabaseReadClient,
): Promise<FileMovement[]> {
  return fetchMovementsFromSupabase({ page: 1, pageSize: limit }, client);
}

export async function fetchMovementsByCaseFromSupabase(
  caseId: string,
  client?: SupabaseReadClient,
): Promise<FileMovement[]> {
  const supabase = client ?? await createClient();
  const { data, error } = await supabase
    .from("file_movements")
    .select("*, cases(case_number, plaintiff, defendant, title)")
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

  const { data, error } = await supabase.rpc("list_audit_logs_for_case", {
    p_case_id: caseId,
    p_case_number: caseNumber,
    result_limit: pageSize,
    result_offset: from,
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
        .range(from, from + pageSize - 1);

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
  let query = supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(DEFAULT_PAGE_SIZE);

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
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("case_number", caseNumber)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? caseRowToDto(data) : null;
}

function parseReportJson(json: Json) {
  const d = json as Record<string, Json>;

  const archiveGrowth = (d.archiveGrowth as Array<Record<string, Json>>) ?? [];
  const missingTrend = (d.missingTrend as Array<Record<string, Json>>) ?? [];
  const movementFrequency = (d.movementFrequency as Array<Record<string, Json>>) ?? [];
  const divisionStats = (d.divisionStats as Array<Record<string, Json>>) ?? [];
  const retrievalPerformance = (d.retrievalPerformance as Array<Record<string, Json>>) ?? [];
  const scanningPerformance = (d.scanningPerformance as Array<Record<string, Json>>) ?? [];

  return {
    archiveGrowth: archiveGrowth.length > 0
      ? archiveGrowth.map((g) => ({ month: String(g.month ?? ""), count: Number(g.count ?? 0) }))
      : [{ month: "N/A", count: 0 }],
    missingTrend: missingTrend.length > 0
      ? missingTrend.map((t) => ({ month: String(t.month ?? ""), count: Number(t.count ?? 0) }))
      : [{ month: "N/A", count: 0 }],
    movementFrequency: movementFrequency.map((f) => ({
      week: String(f.week ?? ""),
      checkouts: Number(f.checkouts ?? 0),
      returns: Number(f.returns ?? 0),
    })),
    divisionStats: divisionStats.length > 0
      ? divisionStats.map((s) => ({ name: String(s.name ?? ""), value: Number(s.value ?? 0) }))
      : [{ name: "High Court", value: 0 }],
    retrievalPerformance: (
      retrievalPerformance.length > 0
        ? retrievalPerformance
        : [{ division: "High Court", avgHours: 0 }]
    ).map((p) => ({
      division: String(p.division ?? ""),
      avgHours: Number(p.avgHours ?? 0),
    })),
    scanningPerformance: scanningPerformance.length > 0
      ? scanningPerformance.map((s) => ({ day: String(s.day ?? ""), scans: Number(s.scans ?? 0) }))
      : [{ day: "Mon", scans: 0 }, { day: "Tue", scans: 0 }, { day: "Wed", scans: 0 }, { day: "Thu", scans: 0 }, { day: "Fri", scans: 0 }],
  };
}

export async function fetchReportDataFromSupabase(client?: SupabaseReadClient) {
  const supabase = client ?? await createClient();

  const { data, error } = await supabase.rpc("fetch_report_data");
  if (error) throw new Error(error.message);

  return parseReportJson(data);
}
