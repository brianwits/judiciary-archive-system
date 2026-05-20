import type { UserRole } from "./roles";

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  pjNumber: string | null;
  department: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
