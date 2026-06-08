-- Paginate search_cases in SQL to avoid loading full result sets into the API layer.
DROP FUNCTION IF EXISTS public.search_cases(text);

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
  SELECT *
  FROM public.cases
  WHERE
    search_query IS NULL
    OR search_query = ''
    OR to_tsvector(
      'english',
      coalesce(case_number, '') || ' ' || coalesce(title, '') || ' ' || coalesce(description, '')
    ) @@ plainto_tsquery('english', search_query)
    OR case_number ILIKE '%' || search_query || '%'
    OR title ILIKE '%' || search_query || '%'
  ORDER BY created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(result_limit, 25), 100))
  OFFSET GREATEST(0, COALESCE(result_offset, 0));
$$;

REVOKE ALL ON FUNCTION public.search_cases(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_cases(text, integer, integer) TO authenticated;
