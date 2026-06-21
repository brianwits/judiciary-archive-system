-- Canonicalize case-number prefixes while preserving previous numbers as aliases.

UPDATE public.case_categories
SET
  common_prefix = 'HCCR',
  updated_at = now()
WHERE code = 'HC_CRIMINAL';

INSERT INTO public.case_category_aliases (case_category_code, alias, alias_type, notes)
VALUES
  ('HC_CRIMINAL', 'HCCR', 'prefix', 'Canonical High Court criminal prefix.'),
  ('HC_CRIMINAL', 'HCR', 'legacy_prefix', 'Legacy High Court criminal prefix.'),
  ('HC_CRIMINAL', 'CR', 'legacy_prefix', 'Legacy generic criminal prefix.'),
  ('HC_CRIMINAL', 'CRI', 'legacy_prefix', 'Legacy generated criminal prefix.'),
  ('HC_CIVIL', 'CIV', 'legacy_prefix', 'Legacy generated civil prefix.')
ON CONFLICT (case_category_code, alias) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.case_number_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  case_number text NOT NULL CHECK (btrim(case_number) <> ''),
  normalized_case_number text GENERATED ALWAYS AS (lower(btrim(case_number))) STORED,
  source text NOT NULL DEFAULT 'case_update',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT case_number_aliases_normalized_unique UNIQUE (normalized_case_number)
);

CREATE INDEX IF NOT EXISTS idx_case_number_aliases_case_id
  ON public.case_number_aliases (case_id);

ALTER TABLE public.case_number_aliases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS case_number_aliases_select_authenticated ON public.case_number_aliases;
DROP POLICY IF EXISTS case_number_aliases_write_editors ON public.case_number_aliases;

CREATE POLICY case_number_aliases_select_authenticated ON public.case_number_aliases
  FOR SELECT TO authenticated USING (true);

CREATE POLICY case_number_aliases_write_editors ON public.case_number_aliases
  FOR ALL TO authenticated
  USING (public.user_can_edit_cases())
  WITH CHECK (public.user_can_edit_cases());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.case_number_aliases TO authenticated;
GRANT ALL ON TABLE public.case_number_aliases TO service_role;

CREATE OR REPLACE FUNCTION public.guard_case_number_against_aliases()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  alias_case_id uuid;
BEGIN
  SELECT alias.case_id
  INTO alias_case_id
  FROM public.case_number_aliases alias
  WHERE alias.normalized_case_number = lower(btrim(NEW.case_number))
  LIMIT 1;

  IF alias_case_id IS NOT NULL AND alias_case_id <> NEW.id THEN
    RAISE EXCEPTION 'Case number % is already used as a previous case number', NEW.case_number
      USING ERRCODE = '23505';
  END IF;

  IF alias_case_id = NEW.id THEN
    DELETE FROM public.case_number_aliases
    WHERE case_id = NEW.id
      AND normalized_case_number = lower(btrim(NEW.case_number));
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.preserve_previous_case_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF OLD.case_number IS DISTINCT FROM NEW.case_number THEN
    INSERT INTO public.case_number_aliases (case_id, case_number, source)
    VALUES (NEW.id, OLD.case_number, 'case_update')
    ON CONFLICT (normalized_case_number) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_alias_against_current_case_numbers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  current_case_id uuid;
BEGIN
  SELECT c.id
  INTO current_case_id
  FROM public.cases c
  WHERE lower(btrim(c.case_number)) = lower(btrim(NEW.case_number))
  LIMIT 1;

  IF current_case_id IS NOT NULL THEN
    RAISE EXCEPTION 'Alias % is already a current case number', NEW.case_number
      USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cases_guard_case_number_aliases ON public.cases;
CREATE TRIGGER cases_guard_case_number_aliases
  BEFORE INSERT OR UPDATE OF case_number ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.guard_case_number_against_aliases();

DROP TRIGGER IF EXISTS cases_preserve_previous_case_number ON public.cases;
CREATE TRIGGER cases_preserve_previous_case_number
  AFTER UPDATE OF case_number ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.preserve_previous_case_number();

DROP TRIGGER IF EXISTS case_number_aliases_guard_current_numbers ON public.case_number_aliases;
CREATE TRIGGER case_number_aliases_guard_current_numbers
  BEFORE INSERT OR UPDATE OF case_number, case_id ON public.case_number_aliases
  FOR EACH ROW EXECUTE FUNCTION public.guard_alias_against_current_case_numbers();

REVOKE ALL ON FUNCTION public.guard_case_number_against_aliases() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.preserve_previous_case_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.guard_alias_against_current_case_numbers() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  conflicts text;
BEGIN
  WITH targets AS (
    SELECT
      c.id,
      c.case_number AS old_number,
      cc.common_prefix || substring(c.case_number FROM position('/' IN c.case_number)) AS new_number
    FROM public.cases c
    JOIN public.case_categories cc ON cc.code = c.case_category_code
    WHERE position('/' IN c.case_number) > 0
      AND lower(cc.common_prefix) <> 'varies'
      AND lower(split_part(c.case_number, '/', 1)) <> lower(cc.common_prefix)
  ), collisions AS (
    SELECT target.old_number || ' -> ' || target.new_number AS detail
    FROM targets target
    JOIN public.cases existing
      ON lower(btrim(existing.case_number)) = lower(btrim(target.new_number))
     AND existing.id <> target.id
    UNION ALL
    SELECT target.old_number || ' -> ' || target.new_number
    FROM targets target
    JOIN public.case_number_aliases alias
      ON alias.normalized_case_number = lower(btrim(target.new_number))
     AND alias.case_id <> target.id
    UNION ALL
    SELECT min(target.old_number) || ' -> ' || target.new_number
    FROM targets target
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

UPDATE public.cases c
SET case_number = cc.common_prefix || substring(c.case_number FROM position('/' IN c.case_number))
FROM public.case_categories cc
WHERE cc.code = c.case_category_code
  AND position('/' IN c.case_number) > 0
  AND lower(cc.common_prefix) <> 'varies'
  AND lower(split_part(c.case_number, '/', 1)) <> lower(cc.common_prefix);

INSERT INTO public.case_number_aliases (case_id, case_number, source)
SELECT
  c.id,
  'HCR' || substring(c.case_number FROM position('/' IN c.case_number)),
  'canonical_prefix_migration'
FROM public.cases c
WHERE c.case_category_code = 'HC_CRIMINAL'
  AND split_part(c.case_number, '/', 1) = 'HCCR'
ON CONFLICT (normalized_case_number) DO NOTHING;

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
  case_category_code text,
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
SECURITY INVOKER
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
    c.case_category_code,
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
      WHEN EXISTS (
        SELECT 1 FROM public.case_number_aliases alias
        WHERE alias.case_id = c.id
          AND alias.normalized_case_number = input.code
      ) THEN 'case_number_alias'
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
      OR EXISTS (
        SELECT 1 FROM public.case_number_aliases alias
        WHERE alias.case_id = c.id
          AND alias.normalized_case_number = input.code
      )
    )
  ORDER BY
    CASE
      WHEN lower(c.case_number) = input.code THEN 1
      WHEN EXISTS (
        SELECT 1 FROM public.case_number_aliases alias
        WHERE alias.case_id = c.id
          AND alias.normalized_case_number = input.code
      ) THEN 2
      WHEN lower(c.qr_barcode) = input.code THEN 3
      ELSE 4
    END,
    c.updated_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.search_cases(
  search_query text,
  result_limit integer DEFAULT 25,
  result_offset integer DEFAULT 0
)
RETURNS SETOF public.cases
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH input AS (
    SELECT nullif(trim(search_query), '') AS q
  )
  SELECT c.*
  FROM public.cases c
  LEFT JOIN public.case_categories cc ON cc.code = c.case_category_code
  CROSS JOIN input
  WHERE input.q IS NULL
    OR to_tsvector(
      'english',
      coalesce(c.case_number, '') || ' ' ||
      coalesce(c.title, '') || ' ' ||
      coalesce(c.description, '') || ' ' ||
      coalesce(c.plaintiff, '') || ' ' ||
      coalesce(c.defendant, '') || ' ' ||
      coalesce(c.case_type, '') || ' ' ||
      coalesce(c.case_category_code, '') || ' ' ||
      coalesce(cc.category_name, '')
    ) @@ plainto_tsquery('english', input.q)
    OR c.case_number ILIKE '%' || input.q || '%'
    OR c.title ILIKE '%' || input.q || '%'
    OR c.description ILIKE '%' || input.q || '%'
    OR c.plaintiff ILIKE '%' || input.q || '%'
    OR c.defendant ILIKE '%' || input.q || '%'
    OR c.case_type ILIKE '%' || input.q || '%'
    OR c.case_category_code ILIKE '%' || input.q || '%'
    OR cc.category_name ILIKE '%' || input.q || '%'
    OR EXISTS (
      SELECT 1
      FROM public.case_category_aliases category_alias
      WHERE category_alias.case_category_code = cc.code
        AND category_alias.alias ILIKE '%' || input.q || '%'
    )
    OR EXISTS (
      SELECT 1
      FROM public.case_number_aliases number_alias
      WHERE number_alias.case_id = c.id
        AND number_alias.case_number ILIKE '%' || input.q || '%'
    )
    OR EXISTS (
      SELECT 1
      FROM public.case_parties party
      WHERE party.case_id = c.id
        AND (
          party.party_name ILIKE '%' || input.q || '%'
          OR coalesce(party.normalized_party_name, '') ILIKE '%' || input.q || '%'
        )
    )
  ORDER BY c.created_at DESC
  LIMIT LEAST(500, GREATEST(1, COALESCE(NULLIF(result_limit, 0), 25)))
  OFFSET GREATEST(COALESCE(result_offset, 0), 0);
$$;

CREATE OR REPLACE FUNCTION public.search_cases_count(search_query text)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH input AS (
    SELECT nullif(trim(search_query), '') AS q
  )
  SELECT count(*)::bigint
  FROM public.cases c
  LEFT JOIN public.case_categories cc ON cc.code = c.case_category_code
  CROSS JOIN input
  WHERE input.q IS NULL
    OR to_tsvector(
      'english',
      coalesce(c.case_number, '') || ' ' ||
      coalesce(c.title, '') || ' ' ||
      coalesce(c.description, '') || ' ' ||
      coalesce(c.plaintiff, '') || ' ' ||
      coalesce(c.defendant, '') || ' ' ||
      coalesce(c.case_type, '') || ' ' ||
      coalesce(c.case_category_code, '') || ' ' ||
      coalesce(cc.category_name, '')
    ) @@ plainto_tsquery('english', input.q)
    OR c.case_number ILIKE '%' || input.q || '%'
    OR c.title ILIKE '%' || input.q || '%'
    OR c.description ILIKE '%' || input.q || '%'
    OR c.plaintiff ILIKE '%' || input.q || '%'
    OR c.defendant ILIKE '%' || input.q || '%'
    OR c.case_type ILIKE '%' || input.q || '%'
    OR c.case_category_code ILIKE '%' || input.q || '%'
    OR cc.category_name ILIKE '%' || input.q || '%'
    OR EXISTS (
      SELECT 1
      FROM public.case_category_aliases category_alias
      WHERE category_alias.case_category_code = cc.code
        AND category_alias.alias ILIKE '%' || input.q || '%'
    )
    OR EXISTS (
      SELECT 1
      FROM public.case_number_aliases number_alias
      WHERE number_alias.case_id = c.id
        AND number_alias.case_number ILIKE '%' || input.q || '%'
    )
    OR EXISTS (
      SELECT 1
      FROM public.case_parties party
      WHERE party.case_id = c.id
        AND (
          party.party_name ILIKE '%' || input.q || '%'
          OR coalesce(party.normalized_party_name, '') ILIKE '%' || input.q || '%'
        )
    );
$$;

GRANT EXECUTE ON FUNCTION public.lookup_case_for_scan(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_cases(text, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_cases_count(text) TO authenticated, service_role;
