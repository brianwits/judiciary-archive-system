import { cookies } from "next/headers";
import type { CaseFile } from "@/types/case";

const MOCK_CASES_COOKIE = "mock_session_cases";
const MAX_COOKIE_AGE = 60 * 60 * 24 * 7;

export async function getSessionCases(): Promise<CaseFile[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(MOCK_CASES_COOKIE)?.value;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(decodeURIComponent(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveSessionCase(caseFile: CaseFile) {
  const cases = await getSessionCases();
  const nextCases = [caseFile, ...cases.filter((item) => item.id !== caseFile.id)];
  await setSessionCases(nextCases);
}

export async function deleteSessionCase(id: string) {
  const cases = await getSessionCases();
  await setSessionCases(cases.filter((item) => item.id !== id));
}

async function setSessionCases(cases: CaseFile[]) {
  const cookieStore = await cookies();
  cookieStore.set(MOCK_CASES_COOKIE, encodeURIComponent(JSON.stringify(cases)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_COOKIE_AGE,
  });
}
