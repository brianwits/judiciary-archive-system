const LEGACY_COURT_DOMAIN = "@courts.go.ke";
const STANDARD_COURT_DOMAIN = "@court.go.ke";

export function normalizeCourtEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  return trimmed.endsWith(LEGACY_COURT_DOMAIN)
    ? `${trimmed.slice(0, -LEGACY_COURT_DOMAIN.length)}${STANDARD_COURT_DOMAIN}`
    : trimmed;
}

export function isStandardCourtEmail(email: string): boolean {
  return normalizeCourtEmail(email).endsWith(STANDARD_COURT_DOMAIN);
}
