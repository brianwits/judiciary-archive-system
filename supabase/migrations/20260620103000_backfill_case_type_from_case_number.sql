-- Backfill legacy case types so criminal matters do not render as Civil.
-- This only updates rows where the case number prefix clearly identifies the matter type.

WITH normalized AS (
  SELECT
    c.id,
    CASE upper(split_part(c.case_number, '/', 1))
      WHEN 'CR' THEN 'Criminal'
      WHEN 'CIV' THEN 'Civil'
      WHEN 'ELC' THEN 'ELC'
      WHEN 'FAM' THEN 'Family'
      WHEN 'COM' THEN 'Commercial'
      WHEN 'CON' THEN 'Constitutional'
      WHEN 'PRO' THEN 'Probate'
      ELSE NULL
    END AS inferred_case_type,
    upper(
      COALESCE(
        NULLIF(c.court_station, ''),
        CASE
          WHEN upper(NULLIF(c.court, '')) IN ('KBT', 'NRB', 'MSA', 'KSM', 'NKR') THEN upper(c.court)
          ELSE NULL
        END,
        'KBT'
      )
    ) AS normalized_station,
    COALESCE(NULLIF(split_part(c.case_number, '/', 2), ''), c.case_number) AS normalized_case_no,
    COALESCE(c.year, EXTRACT(YEAR FROM COALESCE(c.filed_date::date, c.created_at::date))::int) AS normalized_year
  FROM public.cases c
)
UPDATE public.cases c
SET
  case_type = n.inferred_case_type,
  archive_code = n.normalized_station || '-' || upper(left(n.inferred_case_type, 3)) || '-' || n.normalized_year::text || '-' || upper(regexp_replace(n.normalized_case_no, '[^a-zA-Z0-9]', '', 'g'))
FROM normalized n
WHERE c.id = n.id
  AND n.inferred_case_type IS NOT NULL
  AND (
    COALESCE(c.case_type, '') = ''
    OR c.case_type IS DISTINCT FROM n.inferred_case_type
    OR c.archive_code IS DISTINCT FROM (
      n.normalized_station || '-' || upper(left(n.inferred_case_type, 3)) || '-' || n.normalized_year::text || '-' || upper(regexp_replace(n.normalized_case_no, '[^a-zA-Z0-9]', '', 'g'))
    )
  );
