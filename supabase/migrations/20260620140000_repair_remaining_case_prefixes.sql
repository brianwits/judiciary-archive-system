-- Repair legacy records whose category or serial could not be derived by prefix-only migration.

UPDATE public.cases
SET
  case_category_code = CASE
    WHEN upper(btrim(court)) = 'MCCR' THEN 'MC_CRIMINAL'
    WHEN upper(btrim(court)) = 'MCSO' THEN 'MC_SEXUAL_OFFENCE'
    WHEN upper(btrim(court)) = 'ELC' THEN 'ELC_MATTER'
    WHEN lower(btrim(court)) = 'family division' THEN 'HC_FAMILY'
    WHEN case_number ~* '^CR[-/]' AND lower(btrim(court)) = 'high court' THEN 'HC_CRIMINAL'
    ELSE case_category_code
  END,
  case_type = CASE
    WHEN upper(btrim(court)) IN ('MCCR', 'MCSO') THEN 'Criminal'
    WHEN upper(btrim(court)) = 'ELC' THEN 'ELC'
    WHEN lower(btrim(court)) = 'family division' THEN 'Family'
    WHEN case_number ~* '^CR[-/]' AND lower(btrim(court)) = 'high court' THEN 'Criminal'
    ELSE case_type
  END,
  court_division = CASE
    WHEN upper(btrim(court)) IN ('MCCR', 'MCSO') THEN 'Magistrate Court'
    WHEN upper(btrim(court)) = 'ELC' THEN 'Environment & Land'
    WHEN lower(btrim(court)) = 'family division' THEN 'Family Division'
    WHEN case_number ~* '^CR[-/]' AND lower(btrim(court)) = 'high court' THEN 'High Court'
    ELSE court_division
  END,
  year = COALESCE(year, extract(year FROM filed_date)::integer)
WHERE upper(btrim(court)) IN ('MCCR', 'MCSO', 'ELC')
   OR lower(btrim(court)) = 'family division'
   OR (case_number ~* '^CR[-/]' AND lower(btrim(court)) = 'high court');

DO $$
DECLARE
  conflicts text;
BEGIN
  WITH candidates AS (
    SELECT
      c.id,
      c.case_number AS old_number,
      cc.common_prefix,
      COALESCE(c.year, extract(year FROM c.filed_date)::integer) AS case_year,
      canonical_alias.case_number AS canonical_alias,
      serial_alias.case_number AS serial_alias
    FROM public.cases c
    JOIN public.case_categories cc ON cc.code = c.case_category_code
    LEFT JOIN LATERAL (
      SELECT alias.case_number
      FROM public.case_number_aliases alias
      WHERE alias.case_id = c.id
        AND lower(split_part(alias.case_number, '/', 1)) = lower(cc.common_prefix)
      ORDER BY alias.created_at ASC
      LIMIT 1
    ) canonical_alias ON true
    LEFT JOIN LATERAL (
      SELECT alias.case_number
      FROM public.case_number_aliases alias
      WHERE alias.case_id = c.id
        AND alias.case_number ~* '^E[0-9]+/[0-9]{4}$'
      ORDER BY alias.created_at ASC
      LIMIT 1
    ) serial_alias ON true
    WHERE lower(cc.common_prefix) <> 'varies'
  ), targets AS (
    SELECT
      id,
      old_number,
      CASE
        WHEN lower(split_part(old_number, '/', 1)) = lower(common_prefix) THEN old_number
        WHEN canonical_alias IS NOT NULL THEN canonical_alias
        WHEN serial_alias IS NOT NULL THEN common_prefix || '/' || serial_alias
        WHEN old_number ~* '^E[0-9]+$' AND case_year IS NOT NULL
          THEN common_prefix || '/' || old_number || '/' || case_year::text
        WHEN old_number ~* '^[A-Z]+-[0-9]{4}-[A-Z0-9]+$'
          THEN common_prefix || '/' || split_part(old_number, '-', 3) || '/' || split_part(old_number, '-', 2)
        WHEN position('/' IN old_number) > 0
          AND split_part(old_number, '/', 1) ~* '^E?[0-9]+$'
          THEN common_prefix || '/' || old_number
        WHEN position('/' IN old_number) > 0
          THEN common_prefix || substring(old_number FROM position('/' IN old_number))
        WHEN case_year IS NOT NULL
          THEN common_prefix || '/' || old_number || '/' || case_year::text
        ELSE old_number
      END AS new_number
    FROM candidates
  ), collisions AS (
    SELECT target.old_number || ' -> ' || target.new_number AS detail
    FROM targets target
    JOIN public.cases existing
      ON lower(btrim(existing.case_number)) = lower(btrim(target.new_number))
     AND existing.id <> target.id
    WHERE target.old_number IS DISTINCT FROM target.new_number
    UNION ALL
    SELECT target.old_number || ' -> ' || target.new_number
    FROM targets target
    JOIN public.case_number_aliases alias
      ON alias.normalized_case_number = lower(btrim(target.new_number))
     AND alias.case_id <> target.id
    WHERE target.old_number IS DISTINCT FROM target.new_number
    UNION ALL
    SELECT min(target.old_number) || ' -> ' || target.new_number
    FROM targets target
    WHERE target.old_number IS DISTINCT FROM target.new_number
    GROUP BY lower(btrim(target.new_number)), target.new_number
    HAVING count(*) > 1
  )
  SELECT string_agg(detail, ', ' ORDER BY detail)
  INTO conflicts
  FROM collisions;

  IF conflicts IS NOT NULL THEN
    RAISE EXCEPTION 'Canonical case-number collision: %', conflicts
      USING ERRCODE = '23505';
  END IF;
END;
$$;

WITH candidates AS (
  SELECT
    c.id,
    c.case_number AS old_number,
    cc.common_prefix,
    COALESCE(c.year, extract(year FROM c.filed_date)::integer) AS case_year,
    canonical_alias.case_number AS canonical_alias,
    serial_alias.case_number AS serial_alias
  FROM public.cases c
  JOIN public.case_categories cc ON cc.code = c.case_category_code
  LEFT JOIN LATERAL (
    SELECT alias.case_number
    FROM public.case_number_aliases alias
    WHERE alias.case_id = c.id
      AND lower(split_part(alias.case_number, '/', 1)) = lower(cc.common_prefix)
    ORDER BY alias.created_at ASC
    LIMIT 1
  ) canonical_alias ON true
  LEFT JOIN LATERAL (
    SELECT alias.case_number
    FROM public.case_number_aliases alias
    WHERE alias.case_id = c.id
      AND alias.case_number ~* '^E[0-9]+/[0-9]{4}$'
    ORDER BY alias.created_at ASC
    LIMIT 1
  ) serial_alias ON true
  WHERE lower(cc.common_prefix) <> 'varies'
), targets AS (
  SELECT
    id,
    old_number,
    CASE
      WHEN lower(split_part(old_number, '/', 1)) = lower(common_prefix) THEN old_number
      WHEN canonical_alias IS NOT NULL THEN canonical_alias
      WHEN serial_alias IS NOT NULL THEN common_prefix || '/' || serial_alias
      WHEN old_number ~* '^E[0-9]+$' AND case_year IS NOT NULL
        THEN common_prefix || '/' || old_number || '/' || case_year::text
      WHEN old_number ~* '^[A-Z]+-[0-9]{4}-[A-Z0-9]+$'
        THEN common_prefix || '/' || split_part(old_number, '-', 3) || '/' || split_part(old_number, '-', 2)
      WHEN position('/' IN old_number) > 0
        AND split_part(old_number, '/', 1) ~* '^E?[0-9]+$'
        THEN common_prefix || '/' || old_number
      WHEN position('/' IN old_number) > 0
        THEN common_prefix || substring(old_number FROM position('/' IN old_number))
      WHEN case_year IS NOT NULL
        THEN common_prefix || '/' || old_number || '/' || case_year::text
      ELSE old_number
    END AS new_number
  FROM candidates
)
UPDATE public.cases c
SET case_number = target.new_number
FROM targets target
WHERE c.id = target.id
  AND target.old_number IS DISTINCT FROM target.new_number;

DO $$
DECLARE
  unresolved text;
BEGIN
  SELECT string_agg(c.case_number, ', ' ORDER BY c.case_number)
  INTO unresolved
  FROM public.cases c
  LEFT JOIN public.case_categories cc ON cc.code = c.case_category_code
  WHERE c.case_category_code IS NULL
     OR (
       lower(cc.common_prefix) <> 'varies'
       AND lower(split_part(c.case_number, '/', 1)) <> lower(cc.common_prefix)
     );

  IF unresolved IS NOT NULL THEN
    RAISE EXCEPTION 'Cases still require category or prefix review: %', unresolved;
  END IF;
END;
$$;
