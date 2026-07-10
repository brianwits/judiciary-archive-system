-- Add ELC case types and category stats to the reports RPC.
--
-- 1. Alter the case_types CHECK constraint to allow 'Environment and Land Court'
-- 2. Insert canonical ELC case type rows
-- 3. Add caseCategoryStats to fetch_report_data

-- ── 1. Widen the court_level CHECK constraint ─────────────────────────────
ALTER TABLE public.case_types DROP CONSTRAINT IF EXISTS case_types_court_level_check;
ALTER TABLE public.case_types ADD CONSTRAINT case_types_court_level_check
  CHECK (court_level IN ('High Court', 'Magistrate Court', 'Environment and Land Court'));

-- ── 2. Insert ELC case types ──────────────────────────────────────────────
INSERT INTO public.case_types (case_type_id, code, case_type, full_label, court_level, case_family)
VALUES
  (401, 'ELC',      'Environment and Land Court Case',                 'ELC - Environment and Land Court Case',                 'Environment and Land Court', 'Environment & Land'),
  (402, 'ELCOS',    'Environment and Land Court Originating Summons',  'ELCOS - Environment and Land Court Originating Summons', 'Environment and Land Court', 'Environment & Land'),
  (403, 'ELCEP',    'Environment and Land Court Environmental Petition','ELCEP - Environment and Land Court Environmental Petition','Environment and Land Court', 'Environment & Land'),
  (405, 'ELCMISC',  'Environment and Land Court Miscellaneous',        'ELCMISC - Environment and Land Court Miscellaneous',     'Environment and Land Court', 'Environment & Land')
ON CONFLICT (case_type_id) DO UPDATE SET
  code = EXCLUDED.code,
  case_type = EXCLUDED.case_type,
  full_label = EXCLUDED.full_label,
  court_level = EXCLUDED.court_level,
  case_family = EXCLUDED.case_family,
  active = true,
  updated_at = now();

-- ── 3. Re-create fetch_report_data with caseCategoryStats ─────────────────
DROP FUNCTION IF EXISTS public.fetch_report_data(date, date, text, integer, text);
DROP FUNCTION IF EXISTS public.fetch_report_data(text, text, integer, text, text);
DROP FUNCTION IF EXISTS public.fetch_report_data();

CREATE FUNCTION public.fetch_report_data(
  p_from date DEFAULT NULL,
  p_to date DEFAULT NULL,
  p_court_level text DEFAULT NULL,
  p_case_type_id integer DEFAULT NULL,
  p_case_family text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT
      COALESCE(p_from, (current_date - INTERVAL '24 months')::date) AS from_date,
      COALESCE(p_to, current_date) AS to_date
  ),
  case_data AS MATERIALIZED (
    SELECT
      c.id,
      c.created_at,
      c.filed_date,
      c.status,
      c.is_missing,
      c.court_division,
      c.case_type_id,
      c.case_category_code,
      COALESCE(ct.case_family, c.case_family, c.case_type, 'Unclassified') AS case_family,
      ct.code,
      ct.case_type AS case_type_name,
      ct.full_label,
      ct.court_level
    FROM public.cases c
    LEFT JOIN public.case_types ct ON ct.case_type_id = c.case_type_id
    CROSS JOIN bounds b
    WHERE COALESCE(c.filed_date, c.created_at::date) BETWEEN b.from_date AND b.to_date
      AND (p_court_level IS NULL OR ct.court_level = p_court_level)
      AND (p_case_type_id IS NULL OR c.case_type_id = p_case_type_id)
      AND (p_case_family IS NULL OR COALESCE(ct.case_family, c.case_family, c.case_type) = p_case_family)
  ),
  movement_data AS MATERIALIZED (
    SELECT m.created_at, m.status, m.expected_return_date, m.actual_return_date, m.case_id
    FROM public.file_movements m
    JOIN case_data c ON c.id = m.case_id
    CROSS JOIN bounds b
    WHERE m.created_at::date BETWEEN b.from_date AND b.to_date
  ),
  doc_data AS MATERIALIZED (
    SELECT d.created_at
    FROM public.documents d
    JOIN case_data c ON c.id = d.case_id
    CROSS JOIN bounds b
    WHERE d.created_at::date BETWEEN b.from_date AND b.to_date
  ),
  monthly_agg AS (
    SELECT
      to_char(created_at, 'Mon') AS month_label,
      to_char(created_at, 'YYYY-MM') AS month_key,
      count(*)::int AS total,
      count(*) FILTER (WHERE is_missing OR status = 'missing')::int AS missing_count
    FROM case_data
    GROUP BY 1, 2
  ),
  recent_months AS (
    SELECT * FROM monthly_agg ORDER BY month_key DESC LIMIT 6
  ),
  archive_growth AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object('month', month_label, 'count', running_total)
      ORDER BY month_key
    ), '[]'::jsonb) AS data
    FROM (
      SELECT month_key, month_label,
        sum(total) OVER (ORDER BY month_key ROWS UNBOUNDED PRECEDING)::int AS running_total
      FROM monthly_agg
    ) totals
    WHERE month_key IN (SELECT month_key FROM recent_months)
  ),
  missing_trend AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object('month', month_label, 'count', missing_count)
      ORDER BY month_key
    ), '[]'::jsonb) AS data
    FROM recent_months
  ),
  week_buckets AS (
    SELECT
      'W' || (4 - gs) AS week,
      now() - (gs + 1) * INTERVAL '7 days' AS start_ts,
      now() - gs * INTERVAL '7 days' AS end_ts
    FROM generate_series(0, 3) gs
  ),
  movement_frequency AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'week', week,
      'checkouts', checkouts,
      'returns', returns
    ) ORDER BY start_ts), '[]'::jsonb) AS data
    FROM (
      SELECT wb.week, wb.start_ts,
        count(m.*) FILTER (WHERE m.status IN ('checked_out', 'in_transit', 'overdue'))::int AS checkouts,
        count(m.*) FILTER (WHERE m.status = 'returned')::int AS returns
      FROM week_buckets wb
      LEFT JOIN movement_data m ON m.created_at >= wb.start_ts AND m.created_at < wb.end_ts
      GROUP BY wb.week, wb.start_ts
    ) grouped
  ),
  division_stats AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('name', name, 'value', value) ORDER BY value DESC), '[]'::jsonb) AS data
    FROM (
      SELECT COALESCE(court_level, court_division, 'Unclassified') AS name, count(*)::int AS value
      FROM case_data GROUP BY 1 ORDER BY 2 DESC LIMIT 8
    ) grouped
  ),
  retrieval_performance AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('division', division, 'avgHours', avg_hours) ORDER BY avg_hours DESC), '[]'::jsonb) AS data
    FROM (
      SELECT COALESCE(c.court_level, c.court_division, 'Unclassified') AS division,
        round(avg((m.actual_return_date - m.expected_return_date) * 24)::numeric, 1) AS avg_hours
      FROM movement_data m
      JOIN case_data c ON c.id = m.case_id
      WHERE m.actual_return_date IS NOT NULL AND m.expected_return_date < m.actual_return_date
      GROUP BY 1 ORDER BY 2 DESC NULLS LAST LIMIT 8
    ) grouped
  ),
  scanning_performance AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'day', CASE dow WHEN 0 THEN 'Sun' WHEN 1 THEN 'Mon' WHEN 2 THEN 'Tue' WHEN 3 THEN 'Wed' WHEN 4 THEN 'Thu' WHEN 5 THEN 'Fri' ELSE 'Sat' END,
      'scans', scans
    ) ORDER BY dow), '[]'::jsonb) AS data
    FROM (
      SELECT extract(dow FROM created_at)::int AS dow, count(*)::int AS scans
      FROM doc_data GROUP BY 1
    ) grouped
  ),
  court_level_stats AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('name', name, 'value', value) ORDER BY name), '[]'::jsonb) AS data
    FROM (
      SELECT COALESCE(court_level, 'Legacy / unclassified') AS name, count(*)::int AS value
      FROM case_data GROUP BY 1
    ) grouped
  ),
  family_stats AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('name', case_family, 'value', value) ORDER BY value DESC, case_family), '[]'::jsonb) AS data
    FROM (
      SELECT case_family, count(*)::int AS value FROM case_data GROUP BY 1
    ) grouped
  ),
  case_type_stats AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'caseTypeId', case_type_id,
      'code', COALESCE(code, 'UNCLASSIFIED'),
      'name', COALESCE(case_type_name, 'Pending review'),
      'fullLabel', COALESCE(full_label, 'Pending review'),
      'courtLevel', COALESCE(court_level, 'Legacy / unclassified'),
      'family', case_family,
      'value', value
    ) ORDER BY value DESC, code, case_type_id), '[]'::jsonb) AS data
    FROM (
      SELECT case_type_id, code, case_type_name, full_label, court_level, case_family, count(*)::int AS value
      FROM case_data GROUP BY 1, 2, 3, 4, 5, 6
    ) grouped
  ),
  -- NEW: case_category_stats — join with case_categories table for rich category view.
  -- Falls back to mapping court_division to court_level when case_type_id is null.
  case_category_stats AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'categoryCode', COALESCE(cd.case_category_code, 'UNKNOWN'),
      'categoryName', COALESCE(cc.category_name, 'Unknown Category'),
      'courtLevel',   COALESCE(cd.court_level,
                        CASE
                          WHEN cd.court_division ILIKE '%Environment%' OR cd.court_division ILIKE '%Land%'
                            THEN 'Environment and Land Court'
                          WHEN cd.court_division ILIKE '%Magistrate%' THEN 'Magistrate Court'
                          ELSE 'High Court'
                        END),
      'value',        value
    ) ORDER BY value DESC, cd.case_category_code), '[]'::jsonb) AS data
    FROM (
      SELECT
        cd.case_category_code,
        cd.court_division,
        cd.court_level,
        count(*)::int AS value
      FROM case_data cd
      GROUP BY cd.case_category_code, cd.court_division, cd.court_level
    ) cd
    LEFT JOIN public.case_categories cc ON cc.code = cd.case_category_code
  )
  SELECT jsonb_build_object(
    'archiveGrowth', (SELECT data FROM archive_growth),
    'missingTrend', (SELECT data FROM missing_trend),
    'movementFrequency', (SELECT data FROM movement_frequency),
    'divisionStats', (SELECT data FROM division_stats),
    'retrievalPerformance', (SELECT data FROM retrieval_performance),
    'scanningPerformance', (SELECT data FROM scanning_performance),
    'courtLevelStats', (SELECT data FROM court_level_stats),
    'familyStats', (SELECT data FROM family_stats),
    'caseTypeStats', (SELECT data FROM case_type_stats),
    'caseCategoryStats', (SELECT data FROM case_category_stats),
    'unclassifiedCount', (SELECT count(*)::int FROM case_data WHERE case_type_id IS NULL),
    'totalCases', (SELECT count(*)::int FROM case_data),
    'filters', jsonb_build_object(
      'from', (SELECT from_date FROM bounds),
      'to', (SELECT to_date FROM bounds),
      'courtLevel', p_court_level,
      'caseTypeId', p_case_type_id,
      'caseFamily', p_case_family
    )
  );
$$;

REVOKE ALL ON FUNCTION public.fetch_report_data(date, date, text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_report_data(date, date, text, integer, text) TO authenticated, service_role;
