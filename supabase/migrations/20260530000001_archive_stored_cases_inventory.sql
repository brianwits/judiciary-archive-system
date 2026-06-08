-- Archive inventory helpers: hierarchical path labels and fast lookups for cases on shelves

CREATE OR REPLACE FUNCTION public.archive_location_display_path(p_location_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH RECURSIVE upward AS (
    SELECT id,
           parent_id,
           code,
           label,
           0 AS depth
      FROM public.archive_locations
     WHERE id = p_location_id
    UNION ALL
    SELECT al.id,
           al.parent_id,
           al.code,
           al.label,
           u.depth + 1 AS depth
      FROM public.archive_locations al
 INNER JOIN upward u ON al.id = u.parent_id
  )
  SELECT string_agg(upward.code, ' › ' ORDER BY upward.depth DESC)
    FROM upward
   WHERE upward.id IS NOT NULL;
$$;

CREATE INDEX IF NOT EXISTS idx_cases_location_id
  ON public.cases(location_id)
  WHERE location_id IS NOT NULL;

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
  WITH capped AS (
    SELECT
      c.id AS lid,
      c.case_number AS l_case_number,
      c.title AS l_title,
      c.case_type AS l_case_type,
      c.court_station AS l_court_station,
      c.court_division AS l_court_division,
      c.year AS l_year,
      c.plaintiff AS l_plaintiff,
      c.defendant AS l_defendant,
      c.judge AS l_judge,
      c.status AS l_status,
      c.archive_code AS l_archive_code,
      c.shelf_location AS l_shelf_location,
      c.filed_date AS l_filed_date,
      public.archive_location_display_path(c.location_id) AS l_storage_path,
      count(*) OVER () AS l_matching_total
    FROM public.cases c
    WHERE c.location_id IS NOT NULL
    ORDER BY c.case_number ASC
    LIMIT LEAST(500, GREATEST(1, COALESCE(NULLIF(result_limit, 0), 300)))
    OFFSET GREATEST(COALESCE(result_offset, 0), 0)
  )
  SELECT
    capped.lid,
    capped.l_case_number,
    capped.l_title,
    capped.l_case_type,
    capped.l_court_station,
    capped.l_court_division,
    capped.l_year,
    capped.l_plaintiff,
    capped.l_defendant,
    capped.l_judge,
    capped.l_status,
    capped.l_archive_code,
    capped.l_shelf_location,
    capped.l_filed_date,
    capped.l_storage_path,
    capped.l_matching_total
  FROM capped;
$$;

GRANT EXECUTE ON FUNCTION public.archive_location_display_path(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_archive_stored_cases(integer, integer) TO authenticated;
