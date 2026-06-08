import { isMockDataEnabled } from "@/lib/config";
import { unstable_cache } from "next/cache";
import { caseRowToDto } from "@/contracts/cases";
import { mockStore } from "@/lib/data/mock-store";
import { filterCases } from "@/lib/data/case-filtering";
import { getSessionCases } from "@/lib/data/mock-session";
import {
  fetchAuditLogsForCaseFromSupabase,
  fetchAuditLogsForExport,
  fetchAuditLogsFromSupabase,
  fetchCaseByNumberFromSupabase,
  fetchCasesFromSupabase,
  fetchCasesPageFromSupabase,
  fetchArchiveStoredCasesFromSupabase,
  fetchDashboardFromSupabase,
  fetchDocumentsForCasesFromSupabase,
  fetchDocumentCountsForCasesFromSupabase,
  fetchDocumentsFromSupabase,
  fetchLocationByIdFromSupabase,
  fetchLocationChildrenFromSupabase,
  fetchMovementsByCaseFromSupabase,
  fetchMovementsFromSupabase,
  fetchMovementsSearchFromSupabase,
  fetchRecentMovementsFromSupabase,
  fetchRegistryRequestsFromSupabase,
  fetchRoomSummariesFromSupabase,
  fetchReportDataFromSupabase,
  fetchUsersFromSupabase,
} from "@/lib/data/supabase-queries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CACHE_TAGS } from "@/lib/data/cache-tags";
import type { ListQuery, ListResult } from "@/contracts/queries";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, paginateItems } from "@/contracts/queries";
import type { AuditAction, AuditLog } from "@/types/audit";
import type { Alert } from "@/types/dashboard";
import type { ArchiveStoredCase, RoomSummary } from "@/types/archive";
import type { CaseFile, CaseFilters } from "@/types/case";
import type { DashboardData, RegistryRequest } from "@/types/dashboard";
import type { CaseDocument, DocumentCategory } from "@/types/document";
import type { FileMovement, MovementStatus } from "@/types/movement";
import type { UserProfile } from "@/types/user";
import type { UserRole } from "@/types/roles";
import { REPORT_DATA } from "@/data/seed/dashboard";

const getCachedDashboardData = unstable_cache(
  async () => fetchDashboardFromSupabase(createAdminClient()),
  ["dashboard-data"],
  {
    revalidate: 120,
    tags: [
      CACHE_TAGS.dashboard,
      CACHE_TAGS.cases,
      CACHE_TAGS.documents,
      CACHE_TAGS.movements,
      CACHE_TAGS.users,
    ],
  },
);

const getCachedRoomSummaries = unstable_cache(
  async () => fetchRoomSummariesFromSupabase(createAdminClient()),
  ["archive-room-summaries"],
  {
    revalidate: 300,
    tags: [CACHE_TAGS.archive],
  },
);

const getCachedRecentMovements = unstable_cache(
  async (limit: number) => fetchRecentMovementsFromSupabase(limit, createAdminClient()),
  ["recent-movements"],
  {
    revalidate: 60,
    tags: [CACHE_TAGS.movements, CACHE_TAGS.cases],
  },
);

const getCachedUsers = unstable_cache(
  async () => fetchUsersFromSupabase(createAdminClient()),
  ["users-list"],
  {
    revalidate: 300,
    tags: [CACHE_TAGS.users],
  },
);

const getCachedReportData = unstable_cache(
  async () => fetchReportDataFromSupabase(createAdminClient()),
  ["reports-data"],
  {
    revalidate: 300,
    tags: [CACHE_TAGS.reports, CACHE_TAGS.cases, CACHE_TAGS.documents, CACHE_TAGS.movements],
  },
);

const getCachedTopLevelDocuments = unstable_cache(
  async () => fetchDocumentsFromSupabase(undefined, createAdminClient()),
  ["documents-index"],
  {
    revalidate: 120,
    tags: [CACHE_TAGS.documents],
  },
);

const getCachedAuditLogs = unstable_cache(
  async (page: number, pageSize: number, action?: AuditAction) =>
    fetchAuditLogsFromSupabase({ page, pageSize }, action ? { action } : undefined, createAdminClient()),
  ["audit-logs"],
  {
    revalidate: 60,
    tags: [CACHE_TAGS.audit],
  },
);

const getCachedNavSnapshot = unstable_cache(
  async () => {
    const dashboard = await fetchDashboardFromSupabase(createAdminClient());
    return {
      openCases: dashboard.activeCasesCount,
      pendingRegistry: dashboard.registryRequestsCount,
      alerts: dashboard.alerts.slice(0, 5),
    };
  },
  ["nav-snapshot"],
  {
    revalidate: 60,
    tags: [CACHE_TAGS.dashboard, CACHE_TAGS.cases],
  },
);

const getCachedArchiveStoredCases = unstable_cache(
  async (limit: number, offset: number) =>
    fetchArchiveStoredCasesFromSupabase({ limit, offset }, createAdminClient()),
  ["archive-stored-cases"],
  {
    revalidate: 120,
    tags: [CACHE_TAGS.archive, CACHE_TAGS.cases],
  },
);

const getCachedLocationById = unstable_cache(
  async (id: string) => fetchLocationByIdFromSupabase(id, createAdminClient()),
  ["archive-location-by-id"],
  {
    revalidate: 300,
    tags: [CACHE_TAGS.archive],
  },
);

const getCachedLocationChildren = unstable_cache(
  async (parentId: string | null) =>
    fetchLocationChildrenFromSupabase(parentId, createAdminClient()),
  ["archive-location-children"],
  {
    revalidate: 300,
    tags: [CACHE_TAGS.archive],
  },
);

export async function getDashboardData(): Promise<DashboardData> {
  if (isMockDataEnabled()) return mockStore.getDashboard();
  return getCachedDashboardData();
}

export type NavSnapshot = {
  openCases: number;
  pendingRegistry: number;
  alerts: Alert[];
};

export async function getNavSnapshot(): Promise<NavSnapshot> {
  if (isMockDataEnabled()) {
    const dashboard = mockStore.getDashboard();
    return {
      openCases: dashboard.activeCasesCount,
      pendingRegistry: dashboard.registryRequestsCount,
      alerts: dashboard.alerts.slice(0, 5),
    };
  }
  return getCachedNavSnapshot();
}

export async function getCasesPage(
  filters?: CaseFilters,
  listQuery?: Partial<ListQuery>,
): Promise<ListResult<CaseFile>> {
  const page = listQuery?.page ?? DEFAULT_PAGE;
  const pageSize = listQuery?.pageSize ?? DEFAULT_PAGE_SIZE;

  if (isMockDataEnabled()) {
    const items = filterCases([...await getSessionCases(), ...mockStore.getCases()], filters);
    return paginateItems(items, { page, pageSize });
  }

  const result = await fetchCasesPageFromSupabase(filters, { page, pageSize });
  return {
    items: result.items,
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    hasNextPage: result.page * result.pageSize < result.total,
  };
}

export async function getCases(
  filters?: CaseFilters,
  listQuery?: Partial<ListQuery>,
): Promise<CaseFile[]> {
  if (isMockDataEnabled()) {
    return filterCases([...await getSessionCases(), ...mockStore.getCases()], filters);
  }
  return fetchCasesFromSupabase(filters, listQuery);
}

export async function getCaseById(id: string): Promise<CaseFile | null> {
  if (isMockDataEnabled()) {
    const sessionCase = (await getSessionCases()).find((item) => item.id === id);
    return sessionCase ?? mockStore.getCaseById(id) ?? null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("cases").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? caseRowToDto(data) : null;
}

export async function getCaseByNumber(caseNumber: string): Promise<CaseFile | null> {
  if (isMockDataEnabled()) return mockStore.getCaseByNumber(caseNumber) ?? null;
  return fetchCaseByNumberFromSupabase(caseNumber);
}

export async function getRoomSummaries(): Promise<RoomSummary[]> {
  if (isMockDataEnabled()) return mockStore.getRooms();
  return getCachedRoomSummaries();
}

/** Case files assigned to archive locations (`cases.location_id`), with hierarchical storage paths. */
export async function getArchiveStoredCases(opts?: {
  limit?: number;
  offset?: number;
}): Promise<{ items: ArchiveStoredCase[]; total: number }> {
  if (isMockDataEnabled()) {
    const all = mockStore.getArchiveStoredCases();
    const limit = Math.min(Math.max(opts?.limit ?? all.length, 1), 500);
    const offset = Math.max(opts?.offset ?? 0, 0);
    return {
      items: all.slice(offset, offset + limit),
      total: all.length,
    };
  }

  const limit = Math.min(Math.max(opts?.limit ?? 300, 1), 500);
  const offset = Math.max(opts?.offset ?? 0, 0);

  return getCachedArchiveStoredCases(limit, offset);
}

export async function getMovements(listQuery?: Partial<ListQuery>): Promise<FileMovement[]> {
  if (isMockDataEnabled()) return mockStore.getMovements();
  return fetchMovementsFromSupabase(listQuery);
}

export async function getRecentMovements(limit = 5): Promise<FileMovement[]> {
  if (isMockDataEnabled()) return mockStore.getRecentMovements(limit);
  return getCachedRecentMovements(limit);
}

export async function getMovementsByCase(caseId: string): Promise<FileMovement[]> {
  if (isMockDataEnabled()) return mockStore.getMovementsByCase(caseId);
  return fetchMovementsByCaseFromSupabase(caseId);
}

/**
 * Batch-load documents for multiple case IDs in a single round-trip.
 * Uses the list_documents_for_cases RPC when available, falling back to
 * individual fetches per case.
 * Returns a Map<caseId, documents[]>.
 */
export async function getDocumentsForCases(
  caseIds: string[],
): Promise<Map<string, CaseDocument[]>> {
  if (caseIds.length === 0) return new Map();

  if (isMockDataEnabled()) {
    return mockStore.getDocumentsForCases(caseIds);
  }

  return fetchDocumentsForCasesFromSupabase(caseIds);
}

export async function getDocumentCountsForCases(
  caseIds: string[],
): Promise<Map<string, number>> {
  if (caseIds.length === 0) return new Map();

  if (isMockDataEnabled()) {
    const docMap = mockStore.getDocumentsForCases(caseIds);
    return new Map(
      Array.from(docMap.entries()).map(([id, docs]) => [id, docs.length]),
    );
  }

  return fetchDocumentCountsForCasesFromSupabase(caseIds);
}

export async function getDocuments(caseId?: string): Promise<CaseDocument[]> {
  if (isMockDataEnabled()) return mockStore.getDocuments(caseId);
  if (!caseId) return getCachedTopLevelDocuments();
  return fetchDocumentsFromSupabase(caseId);
}

export async function getAuditLogs(
  listQuery?: Partial<ListQuery>,
  filters?: { action?: AuditAction },
): Promise<AuditLog[]> {
  if (isMockDataEnabled()) {
    let logs = mockStore.getAuditLogs();
    if (filters?.action) {
      logs = logs.filter((log) => log.action === filters.action);
    }
    return paginateItems(logs, listQuery).items;
  }
  const page = listQuery?.page ?? DEFAULT_PAGE;
  const pageSize = listQuery?.pageSize ?? DEFAULT_PAGE_SIZE;
  return getCachedAuditLogs(page, pageSize, filters?.action);
}

export async function getAuditLogsForExport(
  filters?: { action?: AuditAction },
): Promise<{ logs: AuditLog[]; truncated: boolean }> {
  if (isMockDataEnabled()) {
    let logs = mockStore.getAuditLogs();
    if (filters?.action) {
      logs = logs.filter((log) => log.action === filters.action);
    }
    const truncated = logs.length > 5000;
    return { logs: logs.slice(0, 5000), truncated };
  }
  return fetchAuditLogsForExport(filters, createAdminClient());
}

export async function getAuditLogsForCase(
  caseId: string,
  caseNumber: string,
  listQuery?: Partial<ListQuery>,
): Promise<AuditLog[]> {
  if (isMockDataEnabled()) {
    return mockStore.getAuditLogs().filter(
      (log) =>
        log.entityId === caseId ||
        log.metadata?.caseNumber === caseNumber,
    );
  }
  return fetchAuditLogsForCaseFromSupabase(caseId, caseNumber, listQuery);
}

export async function getUsers(): Promise<UserProfile[]> {
  if (isMockDataEnabled()) return mockStore.getUsers();
  return getCachedUsers();
}

export async function getRegistryRequests(): Promise<RegistryRequest[]> {
  if (isMockDataEnabled()) return mockStore.getRegistryRequests();
  return fetchRegistryRequestsFromSupabase();
}

export async function getReportData() {
  if (isMockDataEnabled()) return REPORT_DATA;
  return getCachedReportData();
}

export async function getLocationById(id: string) {
  if (isMockDataEnabled()) return mockStore.getLocationById(id) ?? null;
  const location = await getCachedLocationById(id);
  return location;
}

export async function getLocationChildren(parentId: string | null) {
  if (isMockDataEnabled()) return mockStore.getLocationChildren(parentId);
  const children = await getCachedLocationChildren(parentId);
  return children;
}

export async function searchAll(query: string) {
  if (isMockDataEnabled()) {
    const q = query.toLowerCase();
    const cases = mockStore.getCases({ q: query });
    const movements = mockStore.getMovements().filter(
      (m) =>
        m.caseNumber.toLowerCase().includes(q) ||
        m.destinationOffice.toLowerCase().includes(q),
    );
    return { cases, movements };
  }

  const [cases, movements] = await Promise.all([
    fetchCasesFromSupabase({ q: query }, { page: 1, pageSize: 25 }),
    fetchMovementsSearchFromSupabase(query, { page: 1, pageSize: 25 }),
  ]);

  return { cases, movements };
}

export { mockStore, REPORT_DATA };

export type { CaseFile, CaseFilters, FileMovement, MovementStatus, CaseDocument, DocumentCategory, UserRole };
