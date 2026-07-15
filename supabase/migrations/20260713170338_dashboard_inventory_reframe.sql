INSERT INTO public.notices (title, body, author_id, priority, created_at)
SELECT *
FROM (
  VALUES
    ('CTS Dataset Loaded','Kabarnet closed-case records are live in the archive dashboard and reports workspace.',NULL::uuid,'high','2026-07-13T07:00:00Z'::timestamptz),
    ('Kabarnet Coverage Scope','The current dataset covers Kabarnet Magistrate Court and Kabarnet High Court, with validated zero-result ELC coverage.',NULL::uuid,'normal','2026-07-13T06:30:00Z'::timestamptz),
    ('Archive Metadata Follow-up','Physical shelf locations, movement history, and scanning activity are not yet part of the imported CTS closed-case dataset.',NULL::uuid,'normal','2026-07-13T06:00:00Z'::timestamptz)
) AS seed_rows(title, body, author_id, priority, created_at)
WHERE NOT EXISTS (SELECT 1 FROM public.notices);

INSERT INTO public.memos (title, reference, author_id, created_at)
SELECT *
FROM (
  VALUES
    ('CTS closed-case import validation','MEMO/ICT/2026/CTS-01',NULL::uuid,'2026-07-13T05:45:00Z'::timestamptz),
    ('Archive inventory reconciliation','MEMO/REG/2026/INV-02',NULL::uuid,'2026-07-13T05:15:00Z'::timestamptz)
) AS seed_rows(title, reference, author_id, created_at)
WHERE NOT EXISTS (SELECT 1 FROM public.memos);

INSERT INTO public.broadcasts (title, message, author_id, created_at)
SELECT *
FROM (
  VALUES
    ('Scheduled data verification','Registry and ICT teams should validate sampled CTS records against physical file registers this week.',NULL::uuid,'2026-07-13T05:00:00Z'::timestamptz),
    ('Archive room metadata capture','Location assignments for imported CTS cases will be captured in a later inventory phase.',NULL::uuid,'2026-07-13T04:45:00Z'::timestamptz)
) AS seed_rows(title, message, author_id, created_at)
WHERE NOT EXISTS (SELECT 1 FROM public.broadcasts);

CREATE OR REPLACE FUNCTION public.fetch_dashboard_data()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH counts AS (
    SELECT
      (SELECT count(*)::int FROM public.cases) AS archived_files,
      (SELECT count(*)::int FROM public.cases WHERE court_division ILIKE '%High Court%') AS high_court_files,
      (SELECT count(*)::int FROM public.cases WHERE court_division ILIKE '%Magistrate%') AS magistrate_files,
      (SELECT count(*)::int FROM public.cases WHERE court_division ILIKE '%Environment%' OR court_division ILIKE '%Land%') AS elc_files,
      (SELECT count(*)::int FROM public.cases WHERE is_missing = true OR status = 'missing') AS missing_files,
      (SELECT count(DISTINCT year)::int FROM public.cases WHERE year IS NOT NULL) AS years_covered,
      (SELECT count(DISTINCT case_category_code)::int FROM public.cases WHERE case_category_code IS NOT NULL) AS case_categories,
      (SELECT count(*)::int FROM public.profiles) AS active_users,
      (SELECT count(*)::int FROM public.registry_requests WHERE status = 'pending') AS pending_registry,
      (SELECT count(*)::int FROM public.documents) AS documents_count,
      (SELECT count(*)::int FROM public.file_movements) AS movements_count
  ),
  notices_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', n.id,
        'title', n.title,
        'body', n.body,
        'author', COALESCE(p.full_name, 'System'),
        'priority', n.priority,
        'createdAt', n.created_at
      )
      ORDER BY n.created_at DESC
    ) AS items
    FROM public.notices n
    LEFT JOIN public.profiles p ON p.id = n.author_id
    LIMIT 5
  ),
  memos_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', m.id,
        'title', m.title,
        'reference', m.reference,
        'author', COALESCE(p.full_name, 'System'),
        'createdAt', m.created_at
      )
      ORDER BY m.created_at DESC
    ) AS items
    FROM public.memos m
    LEFT JOIN public.profiles p ON p.id = m.author_id
    LIMIT 5
  ),
  broadcasts_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', b.id,
        'title', b.title,
        'message', b.message,
        'author', COALESCE(p.full_name, 'System'),
        'createdAt', b.created_at
      )
      ORDER BY b.created_at DESC
    ) AS items
    FROM public.broadcasts b
    LEFT JOIN public.profiles p ON p.id = b.author_id
    LIMIT 5
  ),
  generated_alerts AS (
    SELECT jsonb_agg(alert ORDER BY sort_order) AS items
    FROM (
      SELECT 1 AS sort_order, jsonb_build_object('id','alert-cts-live','title','CTS live dataset active','message','Dashboard and reports are reading the hosted Kabarnet closed-case CTS inventory.','severity','info','createdAt',now()) AS alert
      UNION ALL
      SELECT 2, jsonb_build_object('id','alert-elc-empty','title','ELC subset has no rows','message','The validated Kabarnet ELC closed-case export currently contains zero records.','severity','warning','createdAt',now())
      FROM counts c WHERE c.elc_files = 0
      UNION ALL
      SELECT 3, jsonb_build_object('id','alert-ops-empty','title','Operational tables not populated','message','Movements and documents are not yet seeded for the CTS closed-case dataset, so inventory metrics are shown instead.','severity','warning','createdAt',now())
      FROM counts c WHERE c.documents_count = 0 AND c.movements_count = 0
      UNION ALL
      SELECT 4, jsonb_build_object('id','alert-missing-files','title','Missing files recorded','message', c.missing_files || ' case file(s) are flagged as missing in the current archive inventory.','severity','warning','createdAt',now())
      FROM counts c WHERE c.missing_files > 0
    ) ranked
  )
  SELECT jsonb_build_object(
    'activeCasesCount', 0,
    'registryRequestsCount', c.pending_registry,
    'kpis', jsonb_build_array(
      jsonb_build_object('label', 'Archived Files', 'value', c.archived_files::text, 'variant', 'default'),
      jsonb_build_object('label', 'High Court Files', 'value', c.high_court_files::text, 'variant', 'success'),
      jsonb_build_object('label', 'Magistrate Files', 'value', c.magistrate_files::text, 'variant', 'default'),
      jsonb_build_object('label', 'ELC Files', 'value', c.elc_files::text, 'variant', CASE WHEN c.elc_files > 0 THEN 'default' ELSE 'warning' END),
      jsonb_build_object('label', 'Missing Files', 'value', c.missing_files::text, 'variant', CASE WHEN c.missing_files > 0 THEN 'danger' ELSE 'success' END),
      jsonb_build_object('label', 'Years Covered', 'value', c.years_covered::text, 'variant', 'default'),
      jsonb_build_object('label', 'Case Categories', 'value', c.case_categories::text, 'variant', 'default'),
      jsonb_build_object('label', 'Active Users', 'value', c.active_users::text, 'variant', 'default')
    ),
    'notices', COALESCE(nd.items, '[]'::jsonb),
    'memos', COALESCE(md.items, '[]'::jsonb),
    'broadcasts', COALESCE(bd.items, '[]'::jsonb),
    'approvals', '[]'::jsonb,
    'alerts', COALESCE(ga.items, '[]'::jsonb)
  )
  FROM counts c
  CROSS JOIN notices_data nd
  CROSS JOIN memos_data md
  CROSS JOIN broadcasts_data bd
  CROSS JOIN generated_alerts ga;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_dashboard_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_dashboard_data() TO service_role;

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
    'movementFrequency', '[{"week":"W1","checkouts":0,"returns":0},{"week":"W2","checkouts":0,"returns":0},{"week":"W3","checkouts":0,"returns":0},{"week":"W4","checkouts":0,"returns":0}]'::jsonb,
    'divisionStats', COALESCE((SELECT data FROM division_stats), '[]'::jsonb),
    'retrievalPerformance', '[]'::jsonb,
    'scanningPerformance', '[{"day":"Sun","scans":0},{"day":"Mon","scans":0},{"day":"Tue","scans":0},{"day":"Wed","scans":0},{"day":"Thu","scans":0},{"day":"Fri","scans":0},{"day":"Sat","scans":0}]'::jsonb,
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
