import { SEED_AUDIT_LOGS } from "@/data/seed/audit-logs";
import {
  buildMockArchiveDisplayPath,
  getLocationChildren,
  getLocationById,
  getRoomSummaries,
} from "@/data/seed/archive-locations";
import { SEED_CASES } from "@/data/seed/cases";
import { SEED_DASHBOARD, SEED_REGISTRY_REQUESTS } from "@/data/seed/dashboard";
import { SEED_DOCUMENTS } from "@/data/seed/documents";
import { SEED_MOVEMENTS } from "@/data/seed/movements";
import { MOCK_USERS } from "@/data/seed/users";
import { filterCases } from "@/lib/data/case-filtering";
import type { AuditLog } from "@/types/audit";
import type { ArchiveLocation, ArchiveStoredCase } from "@/types/archive";
import type { CaseFile, CaseFilters } from "@/types/case";
import type { DashboardData, RegistryRequest } from "@/types/dashboard";
import type { CaseDocument } from "@/types/document";
import type { FileMovement } from "@/types/movement";
import type { UserProfile } from "@/types/user";
import type { NotificationPreferences } from "@/types/notification";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/types/notification";

let cases = [...SEED_CASES];
let movements = [...SEED_MOVEMENTS];
let documents = [...SEED_DOCUMENTS];
let auditLogs = [...SEED_AUDIT_LOGS];
const users = [...MOCK_USERS];

let registryRequests = [...SEED_REGISTRY_REQUESTS];

export const mockStore = {
  getUsers: () => users,
  getUserById: (id: string) => users.find((u) => u.id === id),
  getUserByEmail: (email: string) => users.find((u) => u.email === email),

  getDashboard: (): DashboardData => ({
    ...SEED_DASHBOARD,
    activeCasesCount: cases.filter((c) => c.status === "open").length,
    registryRequestsCount: registryRequests.filter((r) => r.status === "pending").length,
    alerts: SEED_DASHBOARD.alerts,
  }),
  getRegistryRequests: (): RegistryRequest[] => [...registryRequests],
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
    return filterCases(cases, filters);
  },

  getCaseById: (id: string) => cases.find((c) => c.id === id),
  getCaseByNumber: (caseNumber: string) => cases.find((c) => c.caseNumber === caseNumber),

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
    cases[idx] = { ...cases[idx], ...data, updatedAt: new Date().toISOString() };
    return cases[idx];
  },

  deleteCase: (id: string): boolean => {
    const existing = cases.some((c) => c.id === id);
    if (!existing) return false;
    cases = cases.filter((c) => c.id !== id);
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
        storagePath: buildMockArchiveDisplayPath(c.locationId!),
      }))
      .sort((a, b) => a.caseNumber.localeCompare(b.caseNumber));
  },

  getLocationChildren,
  getLocationById,

  getMovements: () => [...movements],
  getMovementsByCase: (caseId: string) => movements.filter((m) => m.caseId === caseId),
  getRecentMovements: (limit = 5) =>
    [...movements].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit),

  addMovement: (movement: Omit<FileMovement, "id" | "createdAt" | "updatedAt">): FileMovement => {
    const newMovement: FileMovement = {
      ...movement,
      id: `mov-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    movements = [newMovement, ...movements];
    return newMovement;
  },

  updateMovement: (id: string, data: Partial<FileMovement>): FileMovement | null => {
    const idx = movements.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    movements[idx] = { ...movements[idx], ...data, updatedAt: new Date().toISOString() };
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
    users[idx] = { ...users[idx], ...data, updatedAt: new Date().toISOString() };
    return users[idx];
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

export type { ArchiveLocation };
