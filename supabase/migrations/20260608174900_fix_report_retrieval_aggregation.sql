-- Fix nested aggregate use in fetch_report_data retrieval performance.

CREATE OR REPLACE FUNCTION public.fetch_report_data()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  now_ts timestamptz := now();
  case_since timestamptz := now_ts - INTERVAL '24 months';
  doc_since timestamptz := now_ts - INTERVAL '120 days';
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
      FROM doc_data
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
