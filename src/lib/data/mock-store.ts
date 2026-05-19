import { SEED_AUDIT_LOGS } from "@/data/seed/audit-logs";
import { getLocationChildren, getLocationById, getRoomSummaries, SEED_LOCATIONS } from "@/data/seed/archive-locations";
import { SEED_CASES } from "@/data/seed/cases";
import { SEED_DASHBOARD, SEED_REGISTRY_REQUESTS } from "@/data/seed/dashboard";
import { SEED_DOCUMENTS } from "@/data/seed/documents";
import { SEED_MOVEMENTS } from "@/data/seed/movements";
import { MOCK_USERS } from "@/data/seed/users";
import { filterCases } from "@/lib/data/case-filtering";
import type { AuditLog } from "@/types/audit";
import type { ArchiveLocation } from "@/types/archive";
import type { CaseFile, CaseFilters } from "@/types/case";
import type { DashboardData, RegistryRequest } from "@/types/dashboard";
import type { CaseDocument } from "@/types/document";
import type { FileMovement } from "@/types/movement";
import type { UserProfile } from "@/types/user";

let cases = [...SEED_CASES];
let movements = [...SEED_MOVEMENTS];
let documents = [...SEED_DOCUMENTS];
let auditLogs = [...SEED_AUDIT_LOGS];
const users = [...MOCK_USERS];
const locations = [...SEED_LOCATIONS];

export const mockStore = {
  getUsers: () => users,
  getUserById: (id: string) => users.find((u) => u.id === id),
  getUserByEmail: (email: string) => users.find((u) => u.email === email),

  getDashboard: (): DashboardData => SEED_DASHBOARD,
  getRegistryRequests: (): RegistryRequest[] => SEED_REGISTRY_REQUESTS,

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
  getLocations: () => locations,
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
