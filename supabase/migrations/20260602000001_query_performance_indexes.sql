-- Query performance: indexes on hot filter/sort columns and batch archive path resolution.

-- ---------------------------------------------------------------------------
-- Indexes (case_status, archive location, user_role, created_at)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);

CREATE INDEX IF NOT EXISTS idx_cases_created_at ON public.cases(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cases_status_created_at
  ON public.cases(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cases_location_id_number
  ON public.cases(location_id, case_number ASC)
  WHERE location_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_archive_locations_level_code
  ON public.archive_locations(level, code);

CREATE INDEX IF NOT EXISTS idx_profiles_role_created_at
  ON public.profiles(role, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id
  ON public.audit_logs(entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_case_lookup
  ON public.audit_logs(created_at DESC)
  INCLUDE (entity_id, user_id);

-- ---------------------------------------------------------------------------
-- Archive inventory: compute all location paths once (not per row)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.list_archive_stored_cases(
  result_limit integer DEFAULT 300,
  result_offset integer DEFAULT 0
)
RETURNS TABLE (
  case_id uuid,
  case_number text,
  title text,
  case_type text,
  court_station text,
  court_division text,
  year integer,
  plaintiff text,
  defendant text,
  judge text,
  status public.case_status,
  archive_code text,
  shelf_location text,
  filed_date date,
  storage_path text,
  matching_total bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH RECURSIVE loc_paths AS (
    SELECT
      al.id,
      al.parent_id,
      al.code,
      al.code::text AS path
    FROM public.archive_locations al
    WHERE al.parent_id IS NULL
    UNION ALL
    SELECT
      child.id,
      child.parent_id,
      child.code,
      parent.path || ' › ' || child.code
    FROM public.archive_locations child
    INNER JOIN loc_paths parent ON child.parent_id = parent.id
  ),
  stored AS (
    SELECT
      c.id,
      c.case_number,
      c.title,
      c.case_type,
      c.court_station,
      c.court_division,
      c.year,
      c.plaintiff,
      c.defendant,
      c.judge,
      c.status,
      c.archive_code,
      c.shelf_location,
      c.filed_date,
      lp.path AS storage_path,
      count(*) OVER () AS matching_total
    FROM public.cases c
    LEFT JOIN loc_paths lp ON lp.id = c.location_id
    WHERE c.location_id IS NOT NULL
    ORDER BY c.case_number ASC
    LIMIT LEAST(500, GREATEST(1, COALESCE(NULLIF(result_limit, 0), 300)))
    OFFSET GREATEST(COALESCE(result_offset, 0), 0)
  )
  SELECT
    stored.id,
    stored.case_number,
    stored.title,
    stored.case_type,
    stored.court_station,
    stored.court_division,
    stored.year,
    stored.plaintiff,
    stored.defendant,
    stored.judge,
    stored.status,
    stored.archive_code,
    stored.shelf_location,
    stored.filed_date,
    stored.storage_path,
    stored.matching_total
  FROM stored;
$$;

GRANT EXECUTE ON FUNCTION public.list_archive_stored_cases(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_archive_stored_cases(integer, integer) TO service_role;

-- ---------------------------------------------------------------------------
-- Case-scoped audit logs (avoids loading full audit table on case detail)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.list_audit_logs_for_case(
  p_case_id uuid,
  p_case_number text,
  result_limit integer DEFAULT 50,
  result_offset integer DEFAULT 0
)
RETURNS SETOF public.audit_logs
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT al.*
  FROM public.audit_logs al
  WHERE al.entity_id = p_case_id::text
     OR al.metadata->>'caseNumber' = p_case_number
     OR al.entity_id IN (
       SELECT fm.id::text
       FROM public.file_movements fm
       WHERE fm.case_id = p_case_id
     )
  ORDER BY al.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(result_limit, 50), 200))
  OFFSET GREATEST(0, COALESCE(result_offset, 0));
$$;

REVOKE ALL ON FUNCTION public.list_audit_logs_for_case(uuid, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_audit_logs_for_case(uuid, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_audit_logs_for_case(uuid, text, integer, integer) TO service_role;
