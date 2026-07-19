import { SEED_AUDIT_LOGS } from "@/data/seed/audit-logs";
import {
  buildMockArchiveDisplayPath,
  getLocationChildren,
  getLocationById,
  getRoomSummaries,
} from "@/data/seed/archive-locations";
import { SEED_DASHBOARD, SEED_REGISTRY_REQUESTS } from "@/data/seed/dashboard";
import { SEED_DOCUMENTS } from "@/data/seed/documents";
import { SEED_MOVEMENTS } from "@/data/seed/movements";
import { MOCK_USERS } from "@/data/seed/users";
import { loadCasesFromCsv } from "@/lib/data/csv-loader";
import { getCaseCategoryLabel } from "@/lib/case-category";
import { normalizeCaseNumberLookup } from "@/lib/case-number";
import { filterCases } from "@/lib/data/case-filtering";
import type { AuditLog } from "@/types/audit";
import type { ArchiveLocation, ArchiveStoredCase } from "@/types/archive";
import type { CaseFile, CaseFilters } from "@/types/case";
import type { DashboardData, RegistryRequest } from "@/types/dashboard";
import type { CaseDocument } from "@/types/document";
import type { FileMovement, OpenMovementOption } from "@/types/movement";
import type { UserProfile } from "@/types/user";
import type { NotificationPreferences } from "@/types/notification";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/types/notification";
import { normalizeCourtEmail } from "@/lib/email";
import { buildMockDashboardData, buildMockReportData } from "@/lib/data/mock-analytics";
import type { ReportFilters } from "@/lib/reports-computations";
import {
  decorateMovement,
  movementMatchesFilters,
  sortMovementsOperationally,
  sortRecentMovementPriority,
  summarizeMovements,
} from "@/lib/movement-utils";
import type { MovementFilters, MovementSummary } from "@/types/movement";

// ─── Load cases from CSV ────────────────────────────────────────────────────
const csvData = loadCasesFromCsv();
const CSV_CASES = csvData.cases;

let cases = [...CSV_CASES];
let caseNumberAliases: { caseId: string; caseNumber: string }[] = [];
let movements = [...SEED_MOVEMENTS];
let documents = [...SEED_DOCUMENTS];
let auditLogs = [...SEED_AUDIT_LOGS];
const users = [...MOCK_USERS];

function createMockUserId() {
  return globalThis.crypto?.randomUUID?.() ?? `user-${Date.now()}`;
}

let registryRequests = [...SEED_REGISTRY_REQUESTS];
const OPEN_MOVEMENT_STATUSES = new Set<FileMovement["status"]>([
  "checked_out",
  "in_transit",
  "overdue",
]);

export const mockStore = {
  getUsers: () => users,
  getUserById: (id: string) => users.find((u) => u.id === id),
  getUserByEmail: (email: string) =>
    users.find((u) => normalizeCourtEmail(u.email) === normalizeCourtEmail(email)),

  getDashboard: (): DashboardData => {
    return buildMockDashboardData({
      cases,
      users,
      registryRequests,
      baseDashboard: SEED_DASHBOARD,
    });
  },
  getRegistryRequests: (): RegistryRequest[] => [...registryRequests],
  getReportData: (filters: ReportFilters = {}) =>
    buildMockReportData({
      cases,
      filters,
    }),
  updateRegistryRequest: (id: string, data: Partial<RegistryRequest>): RegistryRequest | null => {
    const idx = registryRequests.findIndex((item) => item.id === id);
    if (idx === -1) return null;
    registryRequests[idx] = { ...registryRequests[idx], ...data };
    return registryRequests[idx];
  },
  addRegistryRequest: (
    data: Omit<RegistryRequest, "id" | "createdAt">,
  ): RegistryRequest => {
    const created: RegistryRequest = {
      ...data,
      id: `rr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    registryRequests = [created, ...registryRequests];
    return created;
  },

  getCases: (filters?: CaseFilters): CaseFile[] => {
    return filterCases(cases, filters, buildCaseNumberAliasMap());
  },

  getCaseById: (id: string) => cases.find((c) => c.id === id),
  getCaseByNumber: (caseNumber: string) => {
    const normalized = normalizeCaseNumberLookup(caseNumber);
    const direct = cases.find((c) => normalizeCaseNumberLookup(c.caseNumber) === normalized);
    if (direct) return direct;
    const alias = caseNumberAliases.find(
      (item) => normalizeCaseNumberLookup(item.caseNumber) === normalized,
    );
    return alias ? cases.find((c) => c.id === alias.caseId) : undefined;
  },
  getCaseByScanCode: (code: string) => {
    const normalized = normalizeCaseNumberLookup(code);
    const alias = caseNumberAliases.find(
      (item) => normalizeCaseNumberLookup(item.caseNumber) === normalized,
    );
    const caseFile = cases.find(
      (c) =>
        normalizeCaseNumberLookup(c.caseNumber) === normalized ||
        c.qrBarcode?.toLowerCase() === normalized ||
        normalizeCaseNumberLookup(c.archiveCode) === normalized ||
        c.id === alias?.caseId ||
        c.caseCategoryCode.toLowerCase() === normalized,
    );
    if (!caseFile) return null;
    if (caseFile.caseNumber.toLowerCase() === normalized) {
      return { caseFile, matchedBy: "case_number" as const };
    }
    if (caseFile.qrBarcode?.toLowerCase() === normalized) {
      return { caseFile, matchedBy: "qr_barcode" as const };
    }
    if (alias?.caseId === caseFile.id) {
      return { caseFile, matchedBy: "case_number_alias" as const };
    }
    return { caseFile, matchedBy: "archive_code" as const };
  },

  createCase: (data: Omit<CaseFile, "id" | "createdAt" | "updatedAt">): CaseFile => {
    const newCase: CaseFile = {
      ...data,
      id: `case-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    cases = [newCase, ...cases];
    return newCase;
  },

  updateCase: (id: string, data: Partial<CaseFile>): CaseFile | null => {
    const idx = cases.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    if (data.caseNumber && data.caseNumber !== cases[idx].caseNumber) {
      const previousCaseNumber = cases[idx].caseNumber;
      const normalized = normalizeCaseNumberLookup(previousCaseNumber);
      if (
        !caseNumberAliases.some(
          (alias) => normalizeCaseNumberLookup(alias.caseNumber) === normalized,
        )
      ) {
        caseNumberAliases = [...caseNumberAliases, { caseId: id, caseNumber: previousCaseNumber }];
      }
    }
    cases[idx] = { ...cases[idx], ...data, updatedAt: new Date().toISOString() };
    return cases[idx];
  },

  deleteCase: (id: string): boolean => {
    const existing = cases.some((c) => c.id === id);
    if (!existing) return false;
    cases = cases.filter((c) => c.id !== id);
    caseNumberAliases = caseNumberAliases.filter((alias) => alias.caseId !== id);
    documents = documents.filter((d) => d.caseId !== id);
    movements = movements.filter((m) => m.caseId !== id);
    return true;
  },

  getRooms: () => getRoomSummaries(),

  getArchiveStoredCases: (): ArchiveStoredCase[] => {
    return [...cases]
      .filter((c) => Boolean(c.locationId))
      .map((c) => ({
        id: c.id,
        caseNumber: c.caseNumber,
        title: c.defendant ? `${c.plaintiff} v. ${c.defendant}` : c.plaintiff,
        caseType: c.caseType,
        caseTypeId: c.caseTypeId,
        caseTypeCode: c.caseTypeCode,
        caseTypeName: c.caseTypeName,
        caseTypeFullLabel: c.caseTypeFullLabel,
        caseFamily: c.caseFamily,
        classificationStatus: c.classificationStatus,
        caseCategoryCode: c.caseCategoryCode,
        caseCategoryName: c.caseCategoryName ?? getCaseCategoryLabel(c.caseCategoryCode),
        courtStation: c.courtStation,
        courtDivision: c.courtDivision,
        year: c.year,
        plaintiff: c.plaintiff,
        defendant: c.defendant,
        judge: c.judge,
        status: c.status,
        archiveCode: c.archiveCode,
        shelfLocation: c.shelfLocation,
        filedDate: c.filedDate,
        storagePath: c.locationId ? buildMockArchiveDisplayPath(c.locationId) : "",
        locationSource: "generated" as const,
      }))
      .sort((a, b) => {
        const yearDelta = (b.year ?? 0) - (a.year ?? 0);
        return yearDelta !== 0 ? yearDelta : a.caseNumber.localeCompare(b.caseNumber);
      });
  },

  getLocationChildren,
  getLocationById,

  getMovements: (filters?: MovementFilters) =>
    [...movements]
      .map((movement) => decorateMovement(movement))
      .filter((movement) => movementMatchesFilters(movement, filters))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  getMovementsByCase: (caseId: string) =>
    movements
      .filter((m) => m.caseId === caseId)
      .map((movement) => decorateMovement(movement)),
  getOpenMovements: (filters?: MovementFilters): OpenMovementOption[] =>
    sortMovementsOperationally(
      [...movements]
        .map((movement) => decorateMovement(movement))
        .filter((movement) => OPEN_MOVEMENT_STATUSES.has(movement.status))
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
    })),
  getRecentMovements: (limit = 5, filters?: MovementFilters) =>
    sortRecentMovementPriority(
      [...movements]
        .map((movement) => decorateMovement(movement))
        .filter((movement) => movementMatchesFilters(movement, filters)),
    ).slice(0, limit),
  getMovementSummary: (filters?: MovementFilters): MovementSummary =>
    summarizeMovements(
      [...movements]
        .map((movement) => decorateMovement(movement))
        .filter((movement) => movementMatchesFilters(movement, filters)),
    ),

  addMovement: (movement: Omit<FileMovement, "id" | "createdAt" | "updatedAt">): FileMovement => {
    const newMovement = decorateMovement({
      ...movement,
      id: `mov-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    movements = [newMovement, ...movements];
    return newMovement;
  },

  updateMovement: (id: string, data: Partial<FileMovement>): FileMovement | null => {
    const idx = movements.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    movements[idx] = decorateMovement({
      ...movements[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return movements[idx];
  },

  getDocuments: (caseId?: string) =>
    caseId ? documents.filter((d) => d.caseId === caseId) : [...documents],

  getDocumentsForCases: (caseIds: string[]): Map<string, CaseDocument[]> => {
    const map = new Map<string, CaseDocument[]>();
    for (const id of caseIds) {
      map.set(id, documents.filter((d) => d.caseId === id));
    }
    return map;
  },
  getDocumentById: (id: string) => documents.find((d) => d.id === id),

  addDocument: (doc: Omit<CaseDocument, "id" | "createdAt">): CaseDocument => {
    const newDoc: CaseDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    documents = [newDoc, ...documents];
    return newDoc;
  },

  deleteDocument: (id: string): boolean => {
    const existing = documents.some((d) => d.id === id);
    if (!existing) return false;
    documents = documents.filter((d) => d.id !== id);
    return true;
  },

  getAuditLogs: () =>
    [...auditLogs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

  addAuditLog: (log: Omit<AuditLog, "id" | "createdAt">) => {
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    auditLogs = [newLog, ...auditLogs];
    return newLog;
  },

  getNotificationPreferences: (id: string): NotificationPreferences | null => {
    const user = users.find((u) => u.id === id);
    return user?.notificationPreferences ?? null;
  },

  updateNotificationPreferences: (
    id: string,
    prefs: Partial<NotificationPreferences>,
  ): NotificationPreferences | null => {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    const current = users[idx].notificationPreferences ?? { ...DEFAULT_NOTIFICATION_PREFERENCES };
    users[idx] = {
      ...users[idx],
      notificationPreferences: { ...current, ...prefs },
      updatedAt: new Date().toISOString(),
    };
    return users[idx].notificationPreferences!;
  },

  updateUser: (id: string, data: Partial<UserProfile>) => {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    users[idx] = {
      ...users[idx],
      ...data,
      ...(data.email ? { email: normalizeCourtEmail(data.email) } : {}),
      updatedAt: new Date().toISOString(),
    };
    return users[idx];
  },

  createUser: (
    data: Omit<UserProfile, "id" | "createdAt" | "updatedAt">,
  ): UserProfile => {
    const now = new Date().toISOString();
    const user: UserProfile = {
      ...data,
      id: createMockUserId(),
      email: normalizeCourtEmail(data.email),
      createdAt: now,
      updatedAt: now,
    };
    users.unshift(user);
    return user;
  },

  deleteUser: (id: string): boolean => {
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    users.splice(idx, 1);
    return true;
  },

  assignLocation: (caseId: string, locationId: string) => {
    const loc = getLocationById(locationId);
    if (!loc) return null;
    return mockStore.updateCase(caseId, {
      locationId,
      shelfLocation: loc.code,
    });
  },
};

function buildCaseNumberAliasMap(): Map<string, string[]> {
  const aliasesByCaseId = new Map<string, string[]>();
  for (const alias of caseNumberAliases) {
    aliasesByCaseId.set(alias.caseId, [
      ...(aliasesByCaseId.get(alias.caseId) ?? []),
      alias.caseNumber,
    ]);
  }
  return aliasesByCaseId;
}

export type { ArchiveLocation };
