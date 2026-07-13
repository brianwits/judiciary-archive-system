-- Composite index on cases (case_type_id, case_family) for queries that
-- filter or group by both columns simultaneously, such as report
-- aggregations and case-list filtering by type within a family.

CREATE INDEX IF NOT EXISTS idx_cases_type_family
  ON public.cases (case_type_id, case_family)
  WHERE case_type_id IS NOT NULL AND case_family IS NOT NULL;

COMMENT ON INDEX public.idx_cases_type_family IS
  'Composite index on case_type_id + case_family for combined filter/group queries.';
