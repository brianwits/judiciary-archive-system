import type { UserRole } from "./roles";
import type { NotificationPreferences } from "./notification";

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  pjNumber: string | null;
  department: string | null;
  role: UserRole;
  isActive: boolean;
  notificationPreferences?: NotificationPreferences;
  createdAt: string;
  updatedAt: string;
};
