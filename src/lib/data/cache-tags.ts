export const CACHE_TAGS = {
  archive: "archive",
  audit: "audit",
  cases: "cases",
  dashboard: "dashboard",
  documents: "documents",
  movements: "movements",
  reports: "reports",
  users: "users",
} as const;

export function caseTag(caseId: string) {
  return `case:${caseId}`;
}

export function archiveLocationTag(locationId: string) {
  return `archive-location:${locationId}`;
}
