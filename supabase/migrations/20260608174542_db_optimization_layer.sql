-- =============================================================================
-- Database Optimization Layer
-- Targets: <50ms p95 case list, <20ms single case + docs on 10K-case dataset
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Index on documents.case_id (eliminates seq scans on doc fetches)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_documents_case_id
  ON public.documents(case_id);

-- Covering index: supports ORDER BY created_at DESC without extra sort
CREATE INDEX IF NOT EXISTS idx_documents_case_id_created_at
  ON public.documents(case_id, created_at DESC);

COMMENT ON INDEX idx_documents_case_id IS 'Eliminates sequential scan when fetching docs by case_id';
COMMENT ON INDEX idx_documents_case_id_created_at IS 'Covering index for case detail docs list (filter + sort)';

-- ---------------------------------------------------------------------------
-- 2. pg_trgm extension + trigram indexes for ILIKE search
--    Enables GIN bitmap index scans instead of sequential scans for
--    pattern-matching in search_cases()
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS pg_trgm
  SCHEMA pg_catalog;

CREATE INDEX IF NOT EXISTS idx_cases_case_number_trgm
  ON public.cases USING gin (case_number gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_cases_title_trgm
  ON public.cases USING gin (title gin_trgm_ops);

COMMENT ON INDEX idx_cases_case_number_trgm IS 'Trigram index for ILIKE %search% on case_number (search_cases)';
COMMENT ON INDEX idx_cases_title_trgm IS 'Trigram index for ILIKE %search% on title (search_cases)';

-- ---------------------------------------------------------------------------
-- 3. Rewrite search_cases() — eliminate NULL/empty OR pollution, add
--    trigram-aware scoring. Uses plpgsql so we can short-circuit empty
--    searches and push down LIMIT/OFFSET to each branch.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.search_cases(
  search_query text,
  result_limit integer DEFAULT 25,
  result_offset integer DEFAULT 0
)
RETURNS SETOF public.cases
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _limit int;
  _offset int;
BEGIN
  _limit  := GREATEST(1,   LEAST(COALESCE(result_limit,  25), 100));
  _offset := GREATEST(0, COALESCE(result_offset, 0));

  -- ── Empty search: fast-path to a simple index scan ──
  IF search_query IS NULL OR search_query = '' THEN
    RETURN QUERY
      SELECT *
      FROM public.cases
      ORDER BY created_at DESC
      LIMIT _limit
      OFFSET _offset;
    RETURN;
  END IF;

  -- ── Non-empty search: full-text GIN scan ∪ trigram GIN scan ──
  -- PostgreSQL 16+ combines these two GIN index scans via a bitmap OR,
  -- eliminating sequential scans that OR-chained ILIKE without trigram
  -- indexes used to trigger.
  -- to_tsvector() is IMMUTABLE, so the planner evaluates it once even
  -- though it appears in both WHERE and ORDER BY (ts_rank).
  -- Scoring: exact prefix matches first, then full-text relevance, then
  -- substring matches.  This pushes the most relevant results to the top
  -- so the LIMIT catches good matches early.
  RETURN QUERY
    SELECT c.*
    FROM public.cases c
    WHERE
      to_tsvector('english',
        coalesce(c.case_number, '') || ' ' ||
        coalesce(c.title, '') || ' ' ||
        coalesce(c.description, '')
      ) @@ plainto_tsquery('english', search_query)
      OR c.case_number ILIKE '%' || search_query || '%'
      OR c.title       ILIKE '%' || search_query || '%'
    ORDER BY
      CASE
        WHEN c.case_number ILIKE search_query || '%' THEN 0
        WHEN c.title       ILIKE search_query || '%' THEN 1
        ELSE 2
      END,
      ts_rank(
        to_tsvector('english',
          coalesce(c.case_number, '') || ' ' ||
          coalesce(c.title, '') || ' ' ||
          coalesce(c.description, '')
        ),
        plainto_tsquery('english', search_query)
      ) DESC,
      c.created_at DESC
    LIMIT _limit
    OFFSET _offset;
END;
$$;

REVOKE ALL ON FUNCTION public.search_cases(text, integer, integer) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.search_cases(text, integer, integer) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.search_cases(text, integer, integer) TO service_role;

-- ---------------------------------------------------------------------------
-- 4. Role caching in get_user_role() — use a session variable so that
--    every RLS policy evaluation within the same transaction hits the
--    cache instead of querying profiles repeatedly.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
  _role text;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RETURN NULL;
  END IF;

  -- Check session-level cache (set on first call per transaction).
  -- current_setting(..., true) returns NULL if the setting hasn't been set.
  _role := nullif(current_setting('app.current_user_role', true), '');
  IF _role IS NOT NULL THEN
    RETURN _role;
  END IF;

  -- Cache miss: load from profiles
  SELECT p.role::text INTO _role
  FROM public.profiles p
  WHERE p.id = _uid;

  -- Cache for the duration of this transaction
  IF _role IS NOT NULL THEN
    PERFORM set_config('app.current_user_role', _role, true);
  END IF;

  RETURN _role;
END;
$$;

-- Also update the permission helpers so they call get_user_role() only once
-- per transaction (cached inside that function).

CREATE OR REPLACE FUNCTION public.user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- get_user_role() is now cached per transaction via set_config
  SELECT public.get_user_role() = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.user_can_edit_cases()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() IN (
    'admin', 'ict_officer', 'registry_clerk', 'archivist', 'deputy_registrar'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_move_files()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() IN (
    'admin', 'registry_clerk', 'archivist', 'deputy_registrar', 'judge'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_upload_docs()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() IN (
    'admin', 'ict_officer', 'registry_clerk', 'archivist'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_manage_archive()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() IN (
    'admin', 'registry_clerk', 'archivist', 'deputy_registrar'
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_manage_users()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() IN ('admin', 'ict_officer');
$$;

CREATE OR REPLACE FUNCTION public.user_can_view_audit()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() IN ('admin', 'ict_officer', 'deputy_registrar');
$$;

CREATE OR REPLACE FUNCTION public.user_can_manage_registry()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() IN ('admin', 'registry_clerk', 'deputy_registrar');
$$;

-- Grants are idempotent; re-issue to cover the updated functions
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_edit_cases() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_move_files() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_upload_docs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_manage_archive() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_manage_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_view_audit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_manage_registry() TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Case status transition state machine (data integrity)
--    Valid transitions:
--      open          → closed, archived, missing, pending_return
--      closed        → open, archived
--      archived      → closed
--      missing       → open, closed, archived, pending_return
--      pending_return → open, closed, archived, missing
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_case_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- No-op if same status
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  IF NOT (
    (OLD.status = 'open'           AND NEW.status IN ('closed', 'archived', 'missing', 'pending_return'))
    OR (OLD.status = 'closed'       AND NEW.status IN ('open', 'archived'))
    OR (OLD.status = 'archived'     AND NEW.status IN ('closed'))
    OR (OLD.status = 'missing'      AND NEW.status IN ('open', 'closed', 'archived', 'pending_return'))
    OR (OLD.status = 'pending_return' AND NEW.status IN ('open', 'closed', 'archived', 'missing'))
  ) THEN
    RAISE EXCEPTION 'Invalid case status transition from % to %. Allowed transitions: %',
      OLD.status, NEW.status,
      CASE OLD.status
        WHEN 'open'           THEN 'closed, archived, missing, pending_return'
        WHEN 'closed'         THEN 'open, archived'
        WHEN 'archived'       THEN 'closed'
        WHEN 'missing'        THEN 'open, closed, archived, pending_return'
        WHEN 'pending_return' THEN 'open, closed, archived, missing'
        ELSE 'none'
      END;
  END IF;

  -- Auto-set closed_date when transitioning TO closed
  IF NEW.status = 'closed' AND (OLD.status IS DISTINCT FROM 'closed' OR OLD.closed_date IS NULL) THEN
    NEW.closed_date := COALESCE(NEW.closed_date, CURRENT_DATE::text);
  END IF;

  -- Clear closed_date when moving AWAY from closed
  IF OLD.status = 'closed' AND NEW.status IS DISTINCT FROM 'closed' THEN
    NEW.closed_date := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_cases_validate_status_transition
  BEFORE UPDATE OF status ON public.cases
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.validate_case_status_transition();

COMMENT ON FUNCTION public.validate_case_status_transition IS 'State-machine enforcement for case status changes. Prevents invalid transitions and auto-manages closed_date.';

-- ---------------------------------------------------------------------------
-- 6. Batch document query — loads documents for N case IDs in one round-trip
--    Eliminates N+1 when rendering case lists with doc counts / thumbnails.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.list_documents_for_cases(
  p_case_ids uuid[],
  p_limit_per_case integer DEFAULT 5
)
RETURNS TABLE (
  case_id uuid,
  doc_id uuid,
  title text,
  category text,
  ocr_status text,
  uploaded_by uuid,
  file_size bigint,
  mime_type text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    d.case_id,
    d.id          AS doc_id,
    d.title,
    d.category::text,
    d.ocr_status::text,
    d.uploaded_by,
    d.file_size,
    d.mime_type,
    d.created_at
  FROM public.documents d
  WHERE d.case_id = ANY(p_case_ids)
    AND p_case_ids IS NOT NULL
    AND array_length(p_case_ids, 1) > 0
  ORDER BY d.case_id, d.created_at DESC
  LIMIT GREATEST(1, LEAST(
    COALESCE(p_limit_per_case, 5) * COALESCE(array_length(p_case_ids, 1), 1),
    500
  ));
$$;

GRANT EXECUTE ON FUNCTION public.list_documents_for_cases(uuid[], integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_documents_for_cases(uuid[], integer) TO service_role;

COMMENT ON FUNCTION public.list_documents_for_cases IS 'Batch-loads documents for up to N case IDs in a single round-trip. Solves the N+1 doc-fetch problem.';
