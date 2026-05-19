import type { UserProfile } from "@/types/user";

export const MOCK_USERS: UserProfile[] = [
  {
    id: "user-admin",
    fullName: "John Kamau",
    email: "john.kamau@courts.go.ke",
    role: "admin",
    isActive: true,
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "user-ict",
    fullName: "Mary Wanjiku",
    email: "mary.wanjiku@courts.go.ke",
    role: "ict_officer",
    isActive: true,
    createdAt: "2024-02-10T08:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "user-registry",
    fullName: "Peter Ochieng",
    email: "peter.ochieng@courts.go.ke",
    role: "registry_clerk",
    isActive: true,
    createdAt: "2024-03-05T08:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "user-archivist",
    fullName: "Grace Akinyi",
    email: "grace.akinyi@courts.go.ke",
    role: "archivist",
    isActive: true,
    createdAt: "2024-04-01T08:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "user-deputy",
    fullName: "David Mutua",
    email: "david.mutua@courts.go.ke",
    role: "deputy_registrar",
    isActive: true,
    createdAt: "2024-05-20T08:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z",
  },
  {
    id: "user-judge",
    fullName: "Hon. Justice Njeri",
    email: "j.njeri@courts.go.ke",
    role: "judge",
    isActive: true,
    createdAt: "2024-06-01T08:00:00Z",
    updatedAt: "2026-05-01T10:00:00Z",
  },
];

export const DEMO_PASSWORD = "demo1234";
