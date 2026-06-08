-- Cached dashboard reads use the Supabase service_role JWT (`createAdminClient`).
-- Grants were only given to `authenticated`, so RPCs failed with insufficient privilege under service_role.

GRANT EXECUTE ON FUNCTION public.archive_location_display_path(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.list_archive_stored_cases(integer, integer) TO service_role;
