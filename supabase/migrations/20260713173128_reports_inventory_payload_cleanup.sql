CREATE OR REPLACE FUNCTION public.fetch_report_data(
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
      COALESCE(p_from, (SELECT min(COALESCE(filed_date, make_date(year, 1, 1), created_at::date)) FROM public.cases)) AS from_date,
      COALESCE(p_to, (SELECT max(COALESCE(filed_date, make_date(year, 12, 31), created_at::date)) FROM public.cases)) AS to_date
  ),
  case_data AS MATERIALIZED (
    SELECT
      c.id,
      c.status,
      c.is_missing,
      c.year,
      c.judge,
      c.case_type_id,
      c.case_category_code,
      c.court_division,
      COALESCE(
        ct.court_level,
        CASE
          WHEN c.court_division ILIKE '%Environment%' OR c.court_division ILIKE '%Land%' THEN 'Environment and Land Court'
          WHEN c.court_division ILIKE '%Magistrate%' THEN 'Magistrate Court'
          ELSE 'High Court'
        END
      ) AS court_level,
      COALESCE(ct.code, c.case_type, 'UNCLASSIFIED') AS code,
      COALESCE(ct.case_type, c.case_type, 'Pending review') AS case_type_name,
      COALESCE(ct.full_label, c.case_type, 'Pending review') AS full_label,
      COALESCE(ct.case_family, c.case_family, c.case_type, 'Unclassified') AS case_family,
      cc.category_name AS category_name,
      COALESCE(c.filed_date, make_date(c.year, 1, 1), c.created_at::date) AS case_date
    FROM public.cases c
    LEFT JOIN public.case_types ct ON ct.case_type_id = c.case_type_id
    LEFT JOIN public.case_categories cc ON cc.code = c.case_category_code
    CROSS JOIN bounds b
    WHERE COALESCE(c.filed_date, make_date(c.year, 1, 1), c.created_at::date) BETWEEN b.from_date AND b.to_date
      AND (p_court_level IS NULL OR p_court_level = '' OR COALESCE(
        ct.court_level,
        CASE
          WHEN c.court_division ILIKE '%Environment%' OR c.court_division ILIKE '%Land%' THEN 'Environment and Land Court'
          WHEN c.court_division ILIKE '%Magistrate%' THEN 'Magistrate Court'
          ELSE 'High Court'
        END
      ) = p_court_level)
      AND (p_case_type_id IS NULL OR p_case_type_id <= 0 OR c.case_type_id = p_case_type_id)
      AND (p_case_family IS NULL OR p_case_family = '' OR COALESCE(ct.case_family, c.case_family, c.case_type, 'Unclassified') = p_case_family)
  ),
  yearly_agg AS (
    SELECT year::text AS year_label, year AS year_key, count(*)::int AS total, count(*) FILTER (WHERE is_missing OR status = 'missing')::int AS missing_count
    FROM case_data
    GROUP BY year
  ),
  recent_years AS (
    SELECT * FROM yearly_agg ORDER BY year_key DESC LIMIT 6
  ),
  archive_growth AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('month', year_label, 'count', total) ORDER BY year_key), '[]'::jsonb) AS data
    FROM yearly_agg
  ),
  missing_trend AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('month', year_label, 'count', missing_count) ORDER BY year_key), '[]'::jsonb) AS data
    FROM recent_years
  ),
  division_stats AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('name', name, 'value', value) ORDER BY value DESC, name), '[]'::jsonb) AS data
    FROM (
      SELECT court_division AS name, count(*)::int AS value
      FROM case_data
      GROUP BY court_division
      ORDER BY value DESC, court_division
      LIMIT 8
    ) grouped
  ),
  court_level_stats AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('name', court_level, 'value', value) ORDER BY value DESC, court_level), '[]'::jsonb) AS data
    FROM (
      SELECT court_level, count(*)::int AS value
      FROM case_data
      GROUP BY court_level
      ORDER BY value DESC, court_level
    ) grouped
  ),
  judge_stats AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('name', judge_name, 'value', value) ORDER BY value DESC, judge_name), '[]'::jsonb) AS data
    FROM (
      SELECT COALESCE(NULLIF(trim(judge), ''), 'Not recorded') AS judge_name, count(*)::int AS value
      FROM case_data
      GROUP BY judge_name
      ORDER BY value DESC, judge_name
      LIMIT 8
    ) grouped
  ),
  age_band_stats AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('label', label, 'value', value) ORDER BY sort_order), '[]'::jsonb) AS data
    FROM (
      SELECT
        CASE
          WHEN current_date_part.age_years <= 2 THEN '0-2 years'
          WHEN current_date_part.age_years <= 5 THEN '3-5 years'
          WHEN current_date_part.age_years <= 10 THEN '6-10 years'
          ELSE '11+ years'
        END AS label,
        CASE
          WHEN current_date_part.age_years <= 2 THEN 1
          WHEN current_date_part.age_years <= 5 THEN 2
          WHEN current_date_part.age_years <= 10 THEN 3
          ELSE 4
        END AS sort_order,
        count(*)::int AS value
      FROM (
        SELECT EXTRACT(YEAR FROM current_date)::int - year AS age_years
        FROM case_data
        WHERE year IS NOT NULL
      ) current_date_part
      GROUP BY 1, 2
      ORDER BY sort_order
    ) grouped
  ),
  case_type_stats AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('caseTypeId', case_type_id, 'code', code, 'name', case_type_name, 'fullLabel', full_label, 'courtLevel', court_level, 'value', value) ORDER BY value DESC, code), '[]'::jsonb) AS data
    FROM (
      SELECT case_type_id, code, case_type_name, full_label, court_level, count(*)::int AS value
      FROM case_data
      GROUP BY 1, 2, 3, 4, 5
      ORDER BY value DESC, code
    ) grouped
  ),
  case_category_stats AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('categoryCode', case_category_code, 'categoryName', category_name, 'courtLevel', court_level, 'value', value) ORDER BY value DESC, case_category_code), '[]'::jsonb) AS data
    FROM (
      SELECT COALESCE(case_category_code, 'UNKNOWN') AS case_category_code, COALESCE(category_name, 'Unknown Category') AS category_name, court_level, count(*)::int AS value
      FROM case_data
      GROUP BY 1, 2, 3
      ORDER BY value DESC, case_category_code
    ) grouped
  )
  SELECT jsonb_build_object(
    'archiveGrowth', COALESCE((SELECT data FROM archive_growth), '[]'::jsonb),
    'missingTrend', COALESCE((SELECT data FROM missing_trend), '[]'::jsonb),
    'divisionStats', COALESCE((SELECT data FROM division_stats), '[]'::jsonb),
    'judgeStats', COALESCE((SELECT data FROM judge_stats), '[]'::jsonb),
    'ageBandStats', COALESCE((SELECT data FROM age_band_stats), '[]'::jsonb),
    'courtLevelStats', COALESCE((SELECT data FROM court_level_stats), '[]'::jsonb),
    'caseTypeStats', COALESCE((SELECT data FROM case_type_stats), '[]'::jsonb),
    'caseCategoryStats', COALESCE((SELECT data FROM case_category_stats), '[]'::jsonb),
    'unclassifiedCount', (SELECT count(*)::int FROM case_data WHERE case_type_id IS NULL),
    'totalCases', (SELECT count(*)::int FROM case_data)
  );
$$;

REVOKE ALL ON FUNCTION public.fetch_report_data(date, date, text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_report_data(date, date, text, integer, text) TO authenticated, service_role;;
