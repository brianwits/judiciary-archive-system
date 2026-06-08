export type NotificationPreferences = {
  emailNotifications: boolean;
  fileMovementAlerts: boolean;
  overdueReminders: boolean;
  weeklyDigest: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailNotifications: true,
  fileMovementAlerts: true,
  overdueReminders: true,
  weeklyDigest: false,
};

export function parseNotificationPreferences(
  raw: unknown,
): NotificationPreferences {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
  const obj = raw as Record<string, unknown>;
  return {
    emailNotifications:
      typeof obj.emailNotifications === "boolean"
        ? obj.emailNotifications
        : DEFAULT_NOTIFICATION_PREFERENCES.emailNotifications,
    fileMovementAlerts:
      typeof obj.fileMovementAlerts === "boolean"
        ? obj.fileMovementAlerts
        : DEFAULT_NOTIFICATION_PREFERENCES.fileMovementAlerts,
    overdueReminders:
      typeof obj.overdueReminders === "boolean"
        ? obj.overdueReminders
        : DEFAULT_NOTIFICATION_PREFERENCES.overdueReminders,
    weeklyDigest:
      typeof obj.weeklyDigest === "boolean"
        ? obj.weeklyDigest
        : DEFAULT_NOTIFICATION_PREFERENCES.weeklyDigest,
  };
}
