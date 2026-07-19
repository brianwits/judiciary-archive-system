CREATE OR REPLACE FUNCTION public.fetch_dashboard_data()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH case_counts AS (
    SELECT
      count(*)::int AS archived_files,
      count(*) FILTER (WHERE court_division ILIKE '%High Court%')::int AS high_court_files,
      count(*) FILTER (WHERE court_division ILIKE '%Magistrate%')::int AS magistrate_files,
      count(*) FILTER (
        WHERE court_division ILIKE '%Environment%' OR court_division ILIKE '%Land%'
      )::int AS elc_files,
      count(*) FILTER (WHERE is_missing = true OR status = 'missing')::int AS missing_files,
      count(DISTINCT year) FILTER (WHERE year IS NOT NULL)::int AS years_covered,
      count(DISTINCT case_category_code) FILTER (WHERE case_category_code IS NOT NULL)::int AS case_categories
    FROM public.cases
  ),
  operational_counts AS (
    SELECT
      (SELECT count(*)::int FROM public.profiles WHERE is_active = true) AS active_users,
      (SELECT count(*)::int FROM public.registry_requests WHERE status = 'pending') AS pending_registry,
      (SELECT count(*)::int FROM public.documents) AS documents_count,
      (SELECT count(*)::int FROM public.file_movements) AS movements_count
  ),
  counts AS (
    SELECT cc.*, oc.*
    FROM case_counts cc
    CROSS JOIN operational_counts oc
  ),
  notices_data AS (
    SELECT COALESCE(jsonb_agg(item ORDER BY created_at DESC), '[]'::jsonb) AS items
    FROM (
      SELECT
        jsonb_build_object(
          'id', n.id,
          'title', n.title,
          'body', n.body,
          'author', COALESCE(p.full_name, 'System'),
          'priority', n.priority,
          'createdAt', n.created_at
        ) AS item,
        n.created_at
      FROM public.notices n
      LEFT JOIN public.profiles p ON p.id = n.author_id
      ORDER BY n.created_at DESC
      LIMIT 5
    ) latest
  ),
  memos_data AS (
    SELECT COALESCE(jsonb_agg(item ORDER BY created_at DESC), '[]'::jsonb) AS items
    FROM (
      SELECT
        jsonb_build_object(
          'id', m.id,
          'title', m.title,
          'reference', m.reference,
          'author', COALESCE(p.full_name, 'System'),
          'createdAt', m.created_at
        ) AS item,
        m.created_at
      FROM public.memos m
      LEFT JOIN public.profiles p ON p.id = m.author_id
      ORDER BY m.created_at DESC
      LIMIT 5
    ) latest
  ),
  broadcasts_data AS (
    SELECT COALESCE(jsonb_agg(item ORDER BY created_at DESC), '[]'::jsonb) AS items
    FROM (
      SELECT
        jsonb_build_object(
          'id', b.id,
          'title', b.title,
          'message', b.message,
          'author', COALESCE(p.full_name, 'System'),
          'createdAt', b.created_at
        ) AS item,
        b.created_at
      FROM public.broadcasts b
      LEFT JOIN public.profiles p ON p.id = b.author_id
      ORDER BY b.created_at DESC
      LIMIT 5
    ) latest
  ),
  generated_alerts AS (
    SELECT COALESCE(jsonb_agg(alert ORDER BY sort_order), '[]'::jsonb) AS items
    FROM (
      SELECT 1 AS sort_order, jsonb_build_object(
        'id', 'alert-cts-live',
        'title', 'CTS live dataset active',
        'message', 'Dashboard and reports are reading the hosted Kabarnet closed-case CTS inventory.',
        'severity', 'info',
        'createdAt', now()
      ) AS alert
      UNION ALL
      SELECT 2, jsonb_build_object(
        'id', 'alert-elc-empty',
        'title', 'ELC subset has no rows',
        'message', 'The validated Kabarnet ELC closed-case export currently contains zero records.',
        'severity', 'warning',
        'createdAt', now()
      )
      FROM counts c
      WHERE c.elc_files = 0
      UNION ALL
      SELECT 3, jsonb_build_object(
        'id', 'alert-ops-empty',
        'title', 'Operational tables not populated',
        'message', 'Movements and documents are not yet seeded for the CTS closed-case dataset, so inventory metrics are shown instead.',
        'severity', 'warning',
        'createdAt', now()
      )
      FROM counts c
      WHERE c.documents_count = 0 AND c.movements_count = 0
      UNION ALL
      SELECT 4, jsonb_build_object(
        'id', 'alert-missing-files',
        'title', 'Missing files recorded',
        'message', c.missing_files || ' case file(s) are flagged as missing in the current archive inventory.',
        'severity', 'warning',
        'createdAt', now()
      )
      FROM counts c
      WHERE c.missing_files > 0
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
    'notices', nd.items,
    'memos', md.items,
    'broadcasts', bd.items,
    'approvals', '[]'::jsonb,
    'alerts', ga.items
  )
  FROM counts c
  CROSS JOIN notices_data nd
  CROSS JOIN memos_data md
  CROSS JOIN broadcasts_data bd
  CROSS JOIN generated_alerts ga;
$$;

REVOKE ALL ON FUNCTION public.fetch_dashboard_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_dashboard_data() TO authenticated, service_role;
