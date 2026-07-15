export const CASE_PAGE_SIZE_OPTIONS = [10, 20, 50, 80, 100] as const;
export const DEFAULT_CASE_PAGE_SIZE = 20;
export const MAX_CASE_PAGE_SIZE = 100;

export function parseCasePageSize(value: string | undefined): number {
  const parsed = Number(value);
  return CASE_PAGE_SIZE_OPTIONS.some((option) => option === parsed)
    ? parsed
    : DEFAULT_CASE_PAGE_SIZE;
}
