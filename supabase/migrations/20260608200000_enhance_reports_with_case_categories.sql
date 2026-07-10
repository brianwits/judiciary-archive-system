-- Enhance fetch_report_data with:
-- 1. Filter parameters (court level, case family, case type, date range)
-- 2. Court-level taxonomy stats (including Environment & Land Court)
-- 3. Case-family breakdown
-- 4. Authoritative case-type breakdown via case_types join
-- 5. All case categories from Magistrate, High Court & ELC
--
-- Drop the prior no-param overload so the parameterized version is the only one.
DROP FUNCTION IF EXISTS public.fetch_report_data();

CREATE OR REPLACE FUNCTION public.fetch_report_data(
  p_court_level  text DEFAULT NULL,
  p_case_family  text DEFAULT NULL,
  p_case_type_id integer DEFAULT NULL,
  p_from         text DEFAULT NULL,
  p_to           text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  now_ts         timestamptz := now();
  case_since     timestamptz := now_ts - INTERVAL '24 months';
  doc_since      timestamptz := now_ts - INTERVAL '120 days';
  filter_from    timestamptz;
  filter_to      timestamptz;
  result_json    jsonb;
BEGIN
  -- Parse optional date-range filters
  IF p_from IS NOT NULL AND p_from ~ '^\d{4}-\d{2}-\d{2}$' THEN
    filter_from := p_from::timestamptz;
  END IF;
  IF p_to IS NOT NULL AND p_to ~ '^\d{4}-\d{2}-\d{2}$' THEN
    -- Inclusive of the full day
    filter_to := (p_to::timestamptz + INTERVAL '1 day');
  END IF;

  WITH
  -- ── Base case set with filter support ──────────────────────────────
  filtered_cases AS (
    SELECT
      c.id,
      c.created_at,
      c.status,
      c.is_missing,
      c.court,
      c.court_division,
      c.case_family,
      c.case_type_id,
      c.case_category_code,
      c.filed_date
    FROM public.cases c
    WHERE c.created_at >= case_since
      -- Date-range filter
      AND (filter_from IS NULL OR c.created_at >= filter_from)
      AND (filter_to   IS NULL OR c.created_at <  filter_to)
      -- Court-level filter: matches court_division or court column
      AND (p_court_level IS NULL OR p_court_level = '' OR
           c.court_division ILIKE '%' || p_court_level || '%' OR
           c.court ILIKE '%' || p_court_level || '%')
      -- Case-family filter
      AND (p_case_family IS NULL OR p_case_family = '' OR
           c.case_family = p_case_family)
      -- Case-type filter
      AND (p_case_type_id IS NULL OR p_case_type_id <= 0 OR
           c.case_type_id = p_case_type_id)
    LIMIT 4000
  ),
  -- ── Taxonomy CTEs ─────────────────────────────────────────────────
  -- Normalised court-level grouping
  -- Maps court_division to canonical court levels: High Court, Magistrate Court, Environment and Land Court
  court_level_group AS (
    SELECT
      id,
      CASE
        WHEN court_division ILIKE '%Magistrate%' THEN 'Magistrate Court'
        WHEN court_division ILIKE '%Environment%' OR court_division ILIKE '%Land%' THEN 'Environment and Land Court'
        WHEN court_division ILIKE '%Family%' THEN 'High Court'
        WHEN court_division ILIKE '%Commercial%' THEN 'High Court'
        ELSE COALESCE(NULLIF(court_division, ''), 'High Court')
      END AS court_level
    FROM filtered_cases
  ),
  -- Counts by canonical court level
  court_level_stats AS (
    SELECT jsonb_agg(
      jsonb_build_object('name', clg.court_level, 'value', cnt)
      ORDER BY cnt DESC
    ) AS data
    FROM (
      SELECT court_level, count(*)::int AS cnt
      FROM court_level_group
      GROUP BY court_level
      ORDER BY cnt DESC
    ) clg
  ),
  -- Counts by case family
  family_stats AS (
    SELECT jsonb_agg(
      jsonb_build_object('name', COALESCE(fc.case_family, 'Uncategorised'), 'value', cnt)
      ORDER BY cnt DESC
    ) AS data
    FROM (
      SELECT COALESCE(NULLIF(case_family, ''), 'Uncategorised') AS case_family, count(*)::int AS cnt
      FROM filtered_cases
      GROUP BY case_family
      ORDER BY cnt DESC
    ) fc
  ),
  -- Authoritative case-type breakdown via case_types join
  case_type_stats AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'caseTypeId', ct.case_type_id,
        'code',       COALESCE(ct.code, 'LEGACY'),
        'name',       COALESCE(ct.case_type, 'Legacy / Unclassified'),
        'fullLabel',  COALESCE(ct.full_label, fc.case_type_label),
        'courtLevel', COALESCE(ct.court_level, 'High Court'),
        'family',     COALESCE(ct.case_family, fc.case_family, 'Uncategorised'),
        'value',      fc.cnt
      )
      ORDER BY fc.cnt DESC
    ) AS data
    FROM (
      SELECT
        case_type_id,
        COALESCE(NULLIF(case_family, ''), 'Uncategorised') AS case_family,
        'Legacy - ' || COALESCE(case_family, 'Uncategorised') AS case_type_label,
        count(*)::int AS cnt
      FROM filtered_cases
      GROUP BY case_type_id, case_family
    ) fc
    LEFT JOIN public.case_types ct ON ct.case_type_id = fc.case_type_id
  ),
  -- Case-category breakdown (rich view across all categories)
  case_category_stats AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'categoryCode', COALESCE(fc.case_category_code, 'UNKNOWN'),
        'categoryName', COALESCE(cc.category_name, 'Unknown Category'),
        'courtLevel',   CASE
                          WHEN cc.court_level IS NOT NULL THEN cc.court_level
                          WHEN fc.court_division ILIKE '%Magistrate%' THEN 'Magistrate Court'
                          WHEN fc.court_division ILIKE '%Environment%' OR fc.court_division ILIKE '%Land%' THEN 'Environment and Land Court'
                          ELSE 'High Court'
                        END,
        'value',        fc.cnt
      )
      ORDER BY fc.cnt DESC
    ) AS data
    FROM (
      SELECT
        case_category_code,
        court_division,
        count(*)::int AS cnt
      FROM filtered_cases
      GROUP BY case_category_code, court_division
    ) fc
    LEFT JOIN public.case_categories cc ON cc.code = fc.case_category_code
  ),
  -- Unclassified count
  unclassified AS (
    SELECT count(*)::int AS cnt
    FROM filtered_cases
    WHERE case_type_id IS NULL
      AND (case_category_code IS NULL OR case_category_code = 'UNKNOWN_PENDING_REVIEW' OR case_category_code = '')
  ),
  -- Total cases matching filters
  total_cases AS (
    SELECT count(*)::int AS cnt FROM filtered_cases
  ),

  -- ── Existing chart-data CTEs (preserved from original) ─────────────
  case_data AS (
    SELECT id, created_at, status, is_missing, court_division
    FROM filtered_cases
  ),
  movement_data AS (
    SELECT created_at, status, expected_return_date, actual_return_date, case_id
    FROM public.file_movements
    WHERE created_at >= case_since
    LIMIT 5000
  ),
  doc_data AS (
    SELECT created_at
    FROM public.documents
    WHERE created_at >= doc_since
    LIMIT 4000
  ),
  monthly_agg AS (
    SELECT
      to_char(created_at, 'Mon') AS month_label,
      to_char(created_at, 'YYYY-MM') AS month_key,
      count(*)::int AS total,
      count(*) FILTER (WHERE is_missing OR status = 'missing')::int AS missing_count
    FROM case_data
    GROUP BY month_key, month_label
  ),
  sorted_months AS (
    SELECT month_key, month_label, total, missing_count
    FROM monthly_agg
    ORDER BY month_key ASC
  ),
  archive_growth AS (
    SELECT jsonb_agg(
      jsonb_build_object('month', cumulative.month_label, 'count', cumulative.count)
      ORDER BY cumulative.month_key ASC
    ) AS data
    FROM (
      SELECT
        sm.month_key, sm.month_label,
        sum(sm.total) OVER (ORDER BY sm.month_key ROWS UNBOUNDED PRECEDING)::int AS count,
        row_number() OVER (ORDER BY sm.month_key DESC) AS rn
      FROM sorted_months sm
    ) cumulative
    WHERE cumulative.rn <= 6
  ),
  missing_trend AS (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object('month', sm.month_label, 'count', sm.missing_count)
        ORDER BY sm.month_key ASC
      ) FILTER (WHERE sm.missing_count > 0),
      '[]'::jsonb
    ) AS data
    FROM (SELECT * FROM sorted_months ORDER BY month_key DESC LIMIT 6) sm
  ),
  week_buckets AS (
    SELECT
      'W' || (4 - gs) AS week,
      now_ts - (gs + 1) * INTERVAL '7 days' AS start_ts,
      now_ts - gs * INTERVAL '7 days' AS end_ts
    FROM generate_series(0, 3) gs
  ),
  movement_freq AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'week', wb.week,
        'checkouts', COALESCE((SELECT count(*)::int FROM movement_data m WHERE m.created_at >= wb.start_ts AND m.created_at < wb.end_ts AND m.status IN ('checked_out','in_transit','overdue')), 0),
        'returns', COALESCE((SELECT count(*)::int FROM movement_data m WHERE m.created_at >= wb.start_ts AND m.created_at < wb.end_ts AND m.status = 'returned'), 0)
      )
      ORDER BY wb.start_ts ASC
    ) AS data
    FROM week_buckets wb
  ),
  division_stats AS (
    SELECT jsonb_agg(
      jsonb_build_object('name', COALESCE(court_division, 'High Court'), 'value', cnt)
      ORDER BY cnt DESC
    ) AS data
    FROM (
      SELECT COALESCE(court_division, 'High Court') AS court_division, count(*)::int AS cnt
      FROM case_data
      GROUP BY court_division
      ORDER BY cnt DESC
      LIMIT 5
    ) divisions
  ),
  retrieval_perf AS (
    SELECT jsonb_agg(
      jsonb_build_object('division', performance.division, 'avgHours', performance.avg_hours)
      ORDER BY performance.avg_hours DESC
    ) AS data
    FROM (
      SELECT
        COALESCE(cd.court_division, 'High Court') AS division,
        round(avg((m.actual_return_date - m.expected_return_date) * 24)::numeric, 1) AS avg_hours
      FROM movement_data m
      LEFT JOIN case_data cd ON cd.id = m.case_id
      WHERE m.actual_return_date IS NOT NULL AND m.expected_return_date < m.actual_return_date
      GROUP BY cd.court_division
      ORDER BY avg_hours DESC NULLS LAST
      LIMIT 5
    ) performance
  ),
  scanning_perf AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'day', CASE dow WHEN 0 THEN 'Sun' WHEN 1 THEN 'Mon' WHEN 2 THEN 'Tue' WHEN 3 THEN 'Wed' WHEN 4 THEN 'Thu' WHEN 5 THEN 'Fri' WHEN 6 THEN 'Sat' END,
        'scans', cnt
      )
      ORDER BY dow ASC
    ) AS data
    FROM (
      SELECT extract(dow FROM created_at)::int AS dow, count(*)::int AS cnt
      FROM doc_data
      GROUP BY extract(dow FROM created_at)
    ) scans
  )
  SELECT jsonb_build_object(
    'archiveGrowth',
      COALESCE((SELECT data FROM archive_growth), '[{"month":"N/A","count":0}]'::jsonb),
    'missingTrend',
      COALESCE((SELECT data FROM missing_trend), '[{"month":"N/A","count":0}]'::jsonb),
    'movementFrequency',
      COALESCE((SELECT data FROM movement_freq), '[{"week":"W1","checkouts":0,"returns":0}]'::jsonb),
    'divisionStats',
      COALESCE((SELECT data FROM division_stats), '[{"name":"High Court","value":0}]'::jsonb),
    'retrievalPerformance',
      COALESCE((SELECT data FROM retrieval_perf), '[{"division":"High Court","avgHours":0}]'::jsonb),
    'scanningPerformance',
      COALESCE((SELECT data FROM scanning_perf), '[{"day":"Mon","scans":0},{"day":"Tue","scans":0},{"day":"Wed","scans":0},{"day":"Thu","scans":0},{"day":"Fri","scans":0}]'::jsonb),
    -- New taxonomy fields
    'courtLevelStats',
      COALESCE((SELECT data FROM court_level_stats), '[]'::jsonb),
    'familyStats',
      COALESCE((SELECT data FROM family_stats), '[]'::jsonb),
    'caseTypeStats',
      COALESCE((SELECT data FROM case_type_stats), '[]'::jsonb),
    'caseCategoryStats',
      COALESCE((SELECT data FROM case_category_stats), '[]'::jsonb),
    'unclassifiedCount',
      COALESCE((SELECT cnt FROM unclassified), 0),
    'totalCases',
      COALESCE((SELECT cnt FROM total_cases), 0)
  ) INTO result_json;

  RETURN result_json;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_report_data(text, text, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_report_data(text, text, integer, text, text) TO service_role;
