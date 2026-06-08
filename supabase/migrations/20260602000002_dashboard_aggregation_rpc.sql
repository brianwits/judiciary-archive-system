-- Aggregate all dashboard KPIs + feed data in a single server-side call.
-- Replaces the 12 parallel queries that were previously run in the app layer.
-- Returns JSONB so the client can extend the shape without schema changes.

CREATE OR REPLACE FUNCTION public.fetch_dashboard_data()
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH counts AS (
    SELECT
      (SELECT count(*)::int FROM public.cases WHERE status = 'open')                                       AS open_cases,
      (SELECT count(*)::int FROM public.cases WHERE is_missing = true OR status = 'missing')               AS missing_cases,
      (SELECT count(*)::int FROM public.cases WHERE status = 'archived')                                   AS archived_cases,
      (SELECT count(*)::int FROM public.file_movements WHERE status IN ('checked_out','in_transit','overdue')) AS pending_returns,
      (SELECT count(*)::int FROM public.registry_requests WHERE status = 'pending')                        AS pending_registry,
      (SELECT count(*)::int FROM public.documents
        WHERE created_at >= CURRENT_DATE AND created_at < CURRENT_DATE + INTERVAL '1 day')                 AS scanned_today,
      (SELECT count(*)::int FROM public.profiles)                                                          AS active_users,
      (SELECT count(*)::int FROM public.file_movements WHERE status = 'overdue')                           AS overdue_count
  ),
  alerts_data AS (
    -- Overdue-return alerts
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', 'alert-' || fm.id,
        'title', 'Overdue Return',
        'message', COALESCE(c.case_number, 'Case') || ' overdue since ' || fm.expected_return_date::text,
        'severity', 'danger',
        'createdAt', fm.updated_at
      )
      ORDER BY fm.expected_return_date ASC
    ) AS overdue_alerts
    FROM public.file_movements fm
    LEFT JOIN public.cases c ON c.id = fm.case_id
    WHERE fm.status = 'overdue'
    LIMIT 5
  ),
  missing_alert AS (
    SELECT
      CASE WHEN counts.missing_cases > 0
        THEN jsonb_build_object(
               'id', 'alert-missing',
               'title', 'Missing Files',
               'message', counts.missing_cases || ' case file(s) marked missing',
               'severity', 'warning',
               'createdAt', now()::text
             )
        ELSE NULL
      END AS alert
    FROM counts
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
  registry_requests_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', rr.id,
        'caseNumber', COALESCE(c.case_number, ''),
        'requestType', rr.request_type,
        'requester', rr.requester,
        'status', rr.status,
        'createdAt', rr.created_at
      )
      ORDER BY rr.created_at DESC
    ) AS items
    FROM public.registry_requests rr
    LEFT JOIN public.cases c ON c.id = rr.case_id
  ),
  approvals_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'title', r.request_type || ' — ' || COALESCE(c.case_number, ''),
        'requester', r.requester,
        'type', r.request_type,
        'status', 'pending',
        'createdAt', r.created_at
      )
      ORDER BY r.created_at DESC
    ) AS items
    FROM public.registry_requests r
    LEFT JOIN public.cases c ON c.id = r.case_id
    WHERE r.status = 'pending'
    LIMIT 5
  )
  SELECT jsonb_build_object(
    'activeCasesCount',   c.open_cases,
    'registryRequestsCount', c.pending_registry,
    'kpis', jsonb_build_array(
      jsonb_build_object('label', 'Active Files',       'value', c.open_cases::text,         'variant', 'success'),
      jsonb_build_object('label', 'Archived Files',     'value', c.archived_cases::text,     'variant', 'default'),
      jsonb_build_object('label', 'Missing Files',      'value', c.missing_cases::text,      'variant', 'danger'),
      jsonb_build_object('label', 'Pending Returns',    'value', c.pending_returns::text,    'variant', 'warning'),
      jsonb_build_object('label', 'Scanned Today',      'value', c.scanned_today::text,      'variant', 'success'),
      jsonb_build_object('label', 'Registry Requests',  'value', c.pending_registry::text,   'variant', 'default'),
      jsonb_build_object('label', 'Audit Flags',        'value', (c.overdue_count + CASE WHEN c.missing_cases > 0 THEN 1 ELSE 0 END)::text, 'variant', 'warning'),
      jsonb_build_object('label', 'Active Users',       'value', c.active_users::text,       'variant', 'default')
    ),
    'notices',    COALESCE(nd.items, '[]'::jsonb),
    'memos',      COALESCE(md.items, '[]'::jsonb),
    'broadcasts', COALESCE(bd.items, '[]'::jsonb),
    'approvals',  COALESCE(apd.items, '[]'::jsonb),
    'alerts',     COALESCE(
                    (SELECT jsonb_agg(el) FROM (
                      SELECT ad2.overdue_alerts AS el FROM alerts_data ad2
                      UNION ALL
                      SELECT jsonb_build_array(ma.alert) FROM missing_alert ma WHERE ma.alert IS NOT NULL
                    ) sub),
                    '[]'::jsonb
                  )
  )
  FROM counts c
  CROSS JOIN alerts_data ad
  CROSS JOIN missing_alert ma
  CROSS JOIN notices_data nd
  CROSS JOIN memos_data md
  CROSS JOIN broadcasts_data bd
  CROSS JOIN registry_requests_data rd
  CROSS JOIN approvals_data apd;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_dashboard_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_dashboard_data() TO service_role;
