-- Add first-class scan audit support and exact scan lookup helpers.
-- SAFE: additive enum value, indexes, and RPC/function updates only.

ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'file_scanned';

CREATE INDEX IF NOT EXISTS idx_cases_scan_case_number_lower
  ON public.cases (lower(case_number));

CREATE INDEX IF NOT EXISTS idx_cases_scan_qr_barcode_lower
  ON public.cases (lower(qr_barcode))
  WHERE qr_barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cases_scan_archive_code_lower
  ON public.cases (lower(archive_code))
  WHERE archive_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created_at
  ON public.audit_logs (action, created_at DESC);

CREATE OR REPLACE FUNCTION public.lookup_case_for_scan(scan_code text)
RETURNS TABLE (
  id uuid,
  case_number text,
  title text,
  court text,
  status public.case_status,
  filed_date date,
  closed_date date,
  description text,
  case_type text,
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
  created_at timestamptz,
  updated_at timestamptz,
  matched_by text
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH input AS (
    SELECT lower(trim(scan_code)) AS code
  )
  SELECT
    c.id,
    c.case_number,
    c.title,
    c.court,
    c.status,
    c.filed_date,
    c.closed_date,
    c.description,
    c.case_type,
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
    c.created_at,
    c.updated_at,
    CASE
      WHEN lower(c.case_number) = input.code THEN 'case_number'
      WHEN lower(c.qr_barcode) = input.code THEN 'qr_barcode'
      ELSE 'archive_code'
    END AS matched_by
  FROM public.cases c
  CROSS JOIN input
  WHERE input.code <> ''
    AND (
      lower(c.case_number) = input.code
      OR lower(c.qr_barcode) = input.code
      OR lower(c.archive_code) = input.code
    )
  ORDER BY
    CASE
      WHEN lower(c.case_number) = input.code THEN 1
      WHEN lower(c.qr_barcode) = input.code THEN 2
      ELSE 3
    END,
    c.updated_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_case_for_scan(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_case_for_scan(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_case_for_scan(text) TO service_role;

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
      (SELECT count(*)::int FROM public.audit_logs
        WHERE action::text = 'file_scanned'
          AND created_at >= CURRENT_DATE
          AND created_at < CURRENT_DATE + INTERVAL '1 day')                                                AS scanned_today,
      (SELECT count(*)::int FROM public.profiles)                                                          AS active_users,
      (SELECT count(*)::int FROM public.file_movements WHERE status = 'overdue')                           AS overdue_count
  ),
  alerts_data AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', 'alert-' || fm.id,
        'title', 'Overdue Return',
        'message', COALESCE(c.case_number, 'Case') || ' overdue since ' || fm.expected_return_date::text,
        'severity', 'danger',
        'createdAt', COALESCE(fm.updated_at, now())
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
        'title', r.request_type || ' - ' || COALESCE(c.case_number, ''),
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
                      SELECT jsonb_array_elements(COALESCE(ad.overdue_alerts, '[]'::jsonb)) AS el
                      FROM alerts_data ad
                      UNION ALL
                      SELECT ma.alert AS el
                      FROM missing_alert ma
                      WHERE ma.alert IS NOT NULL
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

CREATE OR REPLACE FUNCTION public.fetch_report_data()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  now_ts timestamptz := now();
  case_since timestamptz := now_ts - INTERVAL '24 months';
  scan_since timestamptz := now_ts - INTERVAL '120 days';
  result_json jsonb;
BEGIN
  WITH case_data AS (
    SELECT id, created_at, status, is_missing, court_division
    FROM public.cases
    WHERE created_at >= case_since
    LIMIT 4000
  ),
  movement_data AS (
    SELECT created_at, status, expected_return_date, actual_return_date, case_id
    FROM public.file_movements
    WHERE created_at >= case_since
    LIMIT 5000
  ),
  scan_data AS (
    SELECT created_at
    FROM public.audit_logs
    WHERE action::text = 'file_scanned'
      AND created_at >= scan_since
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
        sm.month_key,
        sm.month_label,
        sum(sm.total) OVER (
          ORDER BY sm.month_key ROWS UNBOUNDED PRECEDING
        )::int AS count,
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
    FROM (
      SELECT *
      FROM sorted_months
      ORDER BY month_key DESC
      LIMIT 6
    ) sm
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
        'checkouts', COALESCE((
          SELECT count(*)::int
          FROM movement_data m
          WHERE m.created_at >= wb.start_ts
            AND m.created_at < wb.end_ts
            AND m.status IN ('checked_out', 'in_transit', 'overdue')
        ), 0),
        'returns', COALESCE((
          SELECT count(*)::int
          FROM movement_data m
          WHERE m.created_at >= wb.start_ts
            AND m.created_at < wb.end_ts
            AND m.status = 'returned'
        ), 0)
      )
      ORDER BY wb.start_ts ASC
    ) AS data
    FROM week_buckets wb
  ),
  division_stats AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', COALESCE(court_division, 'High Court'),
        'value', cnt
      )
      ORDER BY cnt DESC
    ) AS data
    FROM (
      SELECT
        COALESCE(court_division, 'High Court') AS court_division,
        count(*)::int AS cnt
      FROM case_data
      GROUP BY court_division
      ORDER BY cnt DESC
      LIMIT 5
    ) divisions
  ),
  retrieval_perf AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'division', performance.division,
        'avgHours', performance.avg_hours
      )
      ORDER BY performance.avg_hours DESC
    ) AS data
    FROM (
      SELECT
        COALESCE(cd.court_division, 'High Court') AS division,
        round(
          avg((m.actual_return_date - m.expected_return_date) * 24)::numeric,
          1
        ) AS avg_hours
      FROM movement_data m
      LEFT JOIN case_data cd ON cd.id = m.case_id
      WHERE m.actual_return_date IS NOT NULL
        AND m.expected_return_date < m.actual_return_date
      GROUP BY cd.court_division
      ORDER BY avg_hours DESC NULLS LAST
      LIMIT 5
    ) performance
  ),
  scanning_perf AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'day', CASE dow
          WHEN 0 THEN 'Sun'
          WHEN 1 THEN 'Mon'
          WHEN 2 THEN 'Tue'
          WHEN 3 THEN 'Wed'
          WHEN 4 THEN 'Thu'
          WHEN 5 THEN 'Fri'
          WHEN 6 THEN 'Sat'
        END,
        'scans', cnt
      )
      ORDER BY dow ASC
    ) AS data
    FROM (
      SELECT extract(dow FROM created_at)::int AS dow, count(*)::int AS cnt
      FROM scan_data
      GROUP BY extract(dow FROM created_at)
    ) scans
  )
  SELECT jsonb_build_object(
    'archiveGrowth',
      COALESCE(
        (SELECT data FROM archive_growth),
        '[{"month":"N/A","count":0}]'::jsonb
      ),
    'missingTrend',
      COALESCE(
        (SELECT data FROM missing_trend),
        '[{"month":"N/A","count":0}]'::jsonb
      ),
    'movementFrequency',
      COALESCE(
        (SELECT data FROM movement_freq),
        '[{"week":"W1","checkouts":0,"returns":0}]'::jsonb
      ),
    'divisionStats',
      COALESCE(
        (SELECT data FROM division_stats),
        '[{"name":"High Court","value":0}]'::jsonb
      ),
    'retrievalPerformance',
      COALESCE(
        (SELECT data FROM retrieval_perf),
        '[{"division":"High Court","avgHours":0}]'::jsonb
      ),
    'scanningPerformance',
      COALESCE(
        (SELECT data FROM scanning_perf),
        '[{"day":"Mon","scans":0},{"day":"Tue","scans":0},{"day":"Wed","scans":0},{"day":"Thu","scans":0},{"day":"Fri","scans":0}]'::jsonb
      )
  ) INTO result_json;

  RETURN result_json;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_report_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_report_data() TO service_role;
