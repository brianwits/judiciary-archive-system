-- Consolidate case identifier lookup and file movement search into single RPCs.
-- Also add the exact indexes those RPCs need.

CREATE INDEX IF NOT EXISTS idx_cases_case_number_raw_lower
  ON public.cases (lower(case_number_raw))
  WHERE case_number_raw IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_file_movements_case_id_created_at_desc
  ON public.file_movements (case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_file_movements_status_created_at_desc
  ON public.file_movements (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_file_movements_destination_office_trgm
  ON public.file_movements USING gin (destination_office gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.lookup_case_by_identifier(identifier text)
RETURNS TABLE (
  id uuid,
  case_number text,
  case_number_raw text,
  case_number_normalized text,
  title text,
  court text,
  status public.case_status,
  filed_date date,
  closed_date date,
  description text,
  case_type text,
  case_type_id integer,
  case_family text,
  case_category_code text,
  court_station text,
  court_division text,
  year integer,
  plaintiff text,
  defendant text,
  judge text,
  archive_code text,
  shelf_location text,
  location_id uuid,
  qr_barcode text,
  notes text,
  is_missing boolean,
  created_by uuid,
  source_case_id text,
  source_record_hash text,
  source_system text,
  source_updated_at timestamptz,
  tracking_number text,
  created_at timestamptz,
  updated_at timestamptz,
  matched_by text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH input AS (
    SELECT lower(btrim(COALESCE(identifier, ''))) AS code
  ),
  ranked_matches AS (
    SELECT
      c.id,
      c.case_number,
      c.case_number_raw,
      c.case_number_normalized,
      c.title,
      c.court,
      c.status,
      c.filed_date,
      c.closed_date,
      c.description,
      c.case_type,
      c.case_type_id,
      c.case_family,
      c.case_category_code,
      c.court_station,
      c.court_division,
      c.year,
      c.plaintiff,
      c.defendant,
      c.judge,
      c.archive_code,
      c.shelf_location,
      c.location_id,
      c.qr_barcode,
      c.notes,
      c.is_missing,
      c.created_by,
      c.source_case_id,
      c.source_record_hash,
      c.source_system,
      c.source_updated_at,
      c.tracking_number,
      c.created_at,
      c.updated_at,
      match_info.matched_by,
      match_info.rank_order
    FROM input
    JOIN LATERAL (
      SELECT
        c.*,
        'case_number'::text AS matched_by,
        1 AS rank_order
      FROM public.cases c
      WHERE input.code <> ''
        AND lower(c.case_number) = input.code

      UNION ALL

      SELECT
        c.*,
        'case_number_raw'::text AS matched_by,
        2 AS rank_order
      FROM public.cases c
      WHERE input.code <> ''
        AND lower(COALESCE(c.case_number_raw, '')) = input.code

      UNION ALL

      SELECT
        c.*,
        'case_number_normalized'::text AS matched_by,
        3 AS rank_order
      FROM public.cases c
      WHERE input.code <> ''
        AND lower(COALESCE(c.case_number_normalized, '')) = input.code

      UNION ALL

      SELECT
        c.*,
        'tracking_number'::text AS matched_by,
        4 AS rank_order
      FROM public.cases c
      WHERE input.code <> ''
        AND lower(COALESCE(c.tracking_number, '')) = input.code

      UNION ALL

      SELECT
        c.*,
        'case_number_alias'::text AS matched_by,
        5 AS rank_order
      FROM public.case_number_aliases alias
      JOIN public.cases c ON c.id = alias.case_id
      WHERE input.code <> ''
        AND alias.normalized_case_number = input.code
    ) AS match_info ON true
    JOIN public.cases c ON c.id = match_info.id
  )
  SELECT
    id,
    case_number,
    case_number_raw,
    case_number_normalized,
    title,
    court,
    status,
    filed_date,
    closed_date,
    description,
    case_type,
    case_type_id,
    case_family,
    case_category_code,
    court_station,
    court_division,
    year,
    plaintiff,
    defendant,
    judge,
    archive_code,
    shelf_location,
    location_id,
    qr_barcode,
    notes,
    is_missing,
    created_by,
    source_case_id,
    source_record_hash,
    source_system,
    source_updated_at,
    tracking_number,
    created_at,
    updated_at,
    matched_by
  FROM ranked_matches
  ORDER BY rank_order, updated_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_case_by_identifier(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_case_by_identifier(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_case_by_identifier(text) TO service_role;

CREATE OR REPLACE FUNCTION public.search_file_movements(
  search_query text,
  result_limit integer DEFAULT 25,
  result_offset integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  case_id uuid,
  checked_out_by uuid,
  destination_office text,
  purpose text,
  expected_return_date date,
  actual_return_date date,
  status public.movement_status,
  created_at timestamptz,
  updated_at timestamptz,
  case_number text,
  plaintiff text,
  defendant text,
  title text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH input AS (
    SELECT
      lower(btrim(COALESCE(search_query, ''))) AS q,
      GREATEST(1, LEAST(COALESCE(result_limit, 25), 100)) AS limit_value,
      GREATEST(COALESCE(result_offset, 0), 0) AS offset_value
  )
  SELECT
    fm.id,
    fm.case_id,
    fm.checked_out_by,
    fm.destination_office,
    fm.purpose,
    fm.expected_return_date,
    fm.actual_return_date,
    fm.status,
    fm.created_at,
    fm.updated_at,
    c.case_number,
    c.plaintiff,
    c.defendant,
    c.title
  FROM public.file_movements fm
  JOIN public.cases c ON c.id = fm.case_id
  CROSS JOIN input
  WHERE input.q <> ''
    AND (
      fm.destination_office ILIKE '%' || input.q || '%'
      OR lower(c.case_number) = input.q
      OR lower(COALESCE(c.case_number_raw, '')) = input.q
      OR lower(COALESCE(c.case_number_normalized, '')) = input.q
      OR lower(COALESCE(c.tracking_number, '')) = input.q
      OR c.case_number ILIKE '%' || input.q || '%'
      OR COALESCE(c.plaintiff, '') ILIKE '%' || input.q || '%'
      OR COALESCE(c.defendant, '') ILIKE '%' || input.q || '%'
      OR COALESCE(c.title, '') ILIKE '%' || input.q || '%'
    )
  ORDER BY fm.created_at DESC
  LIMIT (SELECT limit_value FROM input)
  OFFSET (SELECT offset_value FROM input);
$$;

REVOKE ALL ON FUNCTION public.search_file_movements(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_file_movements(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_file_movements(text, integer, integer) TO service_role;
