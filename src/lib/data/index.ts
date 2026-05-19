import { isMockDataEnabled } from "@/lib/config";
import { caseRowToDto, documentRowToDto } from "@/contracts";
import { mockStore } from "@/lib/data/mock-store";
import { filterCases } from "@/lib/data/case-filtering";
import { getSessionCases } from "@/lib/data/mock-session";
import { createClient } from "@/lib/supabase/server";
import type { AuditLog } from "@/types/audit";
import type { RoomSummary } from "@/types/archive";
import type { CaseFile, CaseFilters } from "@/types/case";
import type { DashboardData, RegistryRequest } from "@/types/dashboard";
import type { CaseDocument, DocumentCategory } from "@/types/document";
import type { FileMovement, MovementStatus } from "@/types/movement";
import type { UserProfile } from "@/types/user";
import type { UserRole } from "@/types/roles";
import { REPORT_DATA, SEED_DASHBOARD, SEED_REGISTRY_REQUESTS } from "@/data/seed/dashboard";

export async function getDashboardData(): Promise<DashboardData> {
  if (isMockDataEnabled()) return mockStore.getDashboard();
  return SEED_DASHBOARD;
}

export async function getCases(filters?: CaseFilters): Promise<CaseFile[]> {
  if (isMockDataEnabled()) {
    return filterCases([...await getSessionCases(), ...mockStore.getCases()], filters);
  }
  const supabase = await createClient();
  let query = supabase.from("cases").select("*").order("created_at", { ascending: false });

  if (filters?.q ?? filters?.query) {
    const q = filters.q ?? filters.query;
    query = query.or(`case_number.ilike.%${q}%,title.ilike.%${q}%`);
  }

  if (filters?.year) {
    query = query
      .gte("filed_date", `${filters.year}-01-01`)
      .lte("filed_date", `${filters.year}-12-31`);
  }

  if (filters?.status && ["open", "closed", "archived"].includes(filters.status)) {
    query = query.eq("status", filters.status as "open" | "closed" | "archived");
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(caseRowToDto);
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

export async function getRoomSummaries(): Promise<RoomSummary[]> {
  return mockStore.getRooms();
}

export async function getMovements(): Promise<FileMovement[]> {
  return mockStore.getMovements();
}

export async function getRecentMovements(limit = 5): Promise<FileMovement[]> {
  return mockStore.getRecentMovements(limit);
}

export async function getMovementsByCase(caseId: string): Promise<FileMovement[]> {
  return mockStore.getMovementsByCase(caseId);
}

export async function getDocuments(caseId?: string): Promise<CaseDocument[]> {
  if (!isMockDataEnabled()) {
    const supabase = await createClient();
    let query = supabase.from("documents").select("*").order("created_at", { ascending: false });
    if (caseId) query = query.eq("case_id", caseId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data ?? []).map(documentRowToDto);
  }
  return mockStore.getDocuments(caseId);
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return mockStore.getAuditLogs();
}

export async function getUsers(): Promise<UserProfile[]> {
  return mockStore.getUsers();
}

export async function getRegistryRequests(): Promise<RegistryRequest[]> {
  if (isMockDataEnabled()) return mockStore.getRegistryRequests();
  return SEED_REGISTRY_REQUESTS;
}

export async function getReportData() {
  return REPORT_DATA;
}

export async function getLocationById(id: string) {
  return mockStore.getLocationById(id) ?? null;
}

export async function getLocationChildren(parentId: string | null) {
  return mockStore.getLocationChildren(parentId);
}

export async function searchAll(query: string) {
  const q = query.toLowerCase();
  const cases = mockStore.getCases({ q: query });
  const movements = mockStore.getMovements().filter(
    (m) =>
      m.caseNumber.toLowerCase().includes(q) ||
      m.destinationOffice.toLowerCase().includes(q),
  );
  return { cases, movements };
}

export {
  mockStore,
  REPORT_DATA,
};

export type { CaseFile, CaseFilters, FileMovement, MovementStatus, CaseDocument, DocumentCategory, UserRole };
