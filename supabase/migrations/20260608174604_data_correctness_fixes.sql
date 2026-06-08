-- Case search count, document batching per case, document counts, audit enum extensions.

-- ---------------------------------------------------------------------------
-- 1. search_cases_count — accurate pagination totals for text search
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.search_cases_count(search_query text)
RETURNS bigint
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _total bigint;
BEGIN
  IF search_query IS NULL OR search_query = '' THEN
    SELECT COUNT(*)::bigint INTO _total FROM public.cases;
    RETURN _total;
  END IF;

  SELECT COUNT(*)::bigint INTO _total
  FROM public.cases c
  WHERE
    to_tsvector('english',
      coalesce(c.case_number, '') || ' ' ||
      coalesce(c.title, '') || ' ' ||
      coalesce(c.description, '')
    ) @@ plainto_tsquery('english', search_query)
    OR c.case_number ILIKE '%' || search_query || '%'
    OR c.title       ILIKE '%' || search_query || '%';

  RETURN _total;
END;
$$;

REVOKE ALL ON FUNCTION public.search_cases_count(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_cases_count(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_cases_count(text) TO service_role;

-- ---------------------------------------------------------------------------
-- 2. list_documents_for_cases — true per-case limit via ROW_NUMBER
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
    ranked.case_id,
    ranked.doc_id,
    ranked.title,
    ranked.category,
    ranked.ocr_status,
    ranked.uploaded_by,
    ranked.file_size,
    ranked.mime_type,
    ranked.created_at
  FROM (
    SELECT
      d.case_id,
      d.id          AS doc_id,
      d.title,
      d.category::text,
      d.ocr_status::text,
      d.uploaded_by,
      d.file_size,
      d.mime_type,
      d.created_at,
      ROW_NUMBER() OVER (
        PARTITION BY d.case_id
        ORDER BY d.created_at DESC
      ) AS rn
    FROM public.documents d
    WHERE d.case_id = ANY(p_case_ids)
      AND p_case_ids IS NOT NULL
      AND array_length(p_case_ids, 1) > 0
  ) ranked
  WHERE ranked.rn <= GREATEST(1, LEAST(COALESCE(p_limit_per_case, 5), 100));
$$;

-- ---------------------------------------------------------------------------
-- 3. count_documents_for_cases — accurate document counts on case lists
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.count_documents_for_cases(p_case_ids uuid[])
RETURNS TABLE (case_id uuid, document_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT d.case_id, COUNT(*)::bigint AS document_count
  FROM public.documents d
  WHERE d.case_id = ANY(p_case_ids)
    AND p_case_ids IS NOT NULL
    AND array_length(p_case_ids, 1) > 0
  GROUP BY d.case_id;
$$;

GRANT EXECUTE ON FUNCTION public.count_documents_for_cases(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_documents_for_cases(uuid[]) TO service_role;

COMMENT ON FUNCTION public.count_documents_for_cases IS
  'Returns document counts per case ID for list views (not capped like preview batch RPC).';

-- ---------------------------------------------------------------------------
-- 4. Audit action enum extensions
-- ---------------------------------------------------------------------------

ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'registry_request_created';
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'registry_request_updated';
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'document_deleted';
