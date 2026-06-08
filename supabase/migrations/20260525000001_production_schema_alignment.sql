-- Production schema alignment: court roles, RLS write policies, performance indexes

-- ---------------------------------------------------------------------------
-- Role migration: user_role -> court_user_role
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_court public.court_user_role;

UPDATE public.profiles
SET role_court = CASE role::text
  WHEN 'admin' THEN 'admin'::public.court_user_role
  WHEN 'staff' THEN 'registry_clerk'::public.court_user_role
  WHEN 'readonly' THEN 'judge'::public.court_user_role
  ELSE COALESCE(role_court, 'judge'::public.court_user_role)
END
WHERE role_court IS NULL;

ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.profiles DROP COLUMN role;
ALTER TABLE public.profiles RENAME COLUMN role_court TO role;
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'judge'::public.court_user_role;

DROP FUNCTION IF EXISTS public.admin_update_user_role(uuid, public.user_role);

DROP TYPE IF EXISTS public.user_role;

-- ---------------------------------------------------------------------------
-- Permission helper functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
  SELECT public.get_user_role() IN (
    'admin', 'registry_clerk', 'deputy_registrar'
  );
$$;

-- ---------------------------------------------------------------------------
-- Auth trigger: default new users to judge
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, pj_number, department, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'pj_number',
    NEW.raw_user_meta_data->>'department',
    'judge'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id uuid,
  new_role public.court_user_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.user_can_manage_users() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.profiles
  SET role = new_role
  WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_user_role(uuid, public.court_user_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_can_edit_cases() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_can_move_files() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_can_upload_docs() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_can_manage_archive() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_can_manage_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_can_view_audit() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_can_manage_registry() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(uuid, public.court_user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_edit_cases() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_move_files() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_upload_docs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_manage_archive() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_manage_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_view_audit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_manage_registry() TO authenticated;

-- ---------------------------------------------------------------------------
-- Recreate core RLS policies with court roles
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS profiles_select_own_or_admin ON public.profiles;
DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;

CREATE POLICY profiles_select_own_or_admin ON public.profiles
  FOR SELECT
  USING (id = (SELECT auth.uid()) OR public.user_can_manage_users());

CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE
  USING (public.user_can_manage_users());

DROP POLICY IF EXISTS cases_insert_staff_admin ON public.cases;
DROP POLICY IF EXISTS cases_update_staff_admin ON public.cases;
DROP POLICY IF EXISTS cases_delete_admin ON public.cases;

CREATE POLICY cases_insert_editors ON public.cases
  FOR INSERT TO authenticated
  WITH CHECK (public.user_can_edit_cases());

CREATE POLICY cases_update_editors ON public.cases
  FOR UPDATE TO authenticated
  USING (public.user_can_edit_cases());

CREATE POLICY cases_delete_admin ON public.cases
  FOR DELETE TO authenticated
  USING (public.user_is_admin());

DROP POLICY IF EXISTS documents_insert_staff_admin ON public.documents;
DROP POLICY IF EXISTS documents_update_staff_admin ON public.documents;
DROP POLICY IF EXISTS documents_delete_admin ON public.documents;

CREATE POLICY documents_insert_uploaders ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (public.user_can_upload_docs());

CREATE POLICY documents_update_uploaders ON public.documents
  FOR UPDATE TO authenticated
  USING (public.user_can_upload_docs());

CREATE POLICY documents_delete_admin ON public.documents
  FOR DELETE TO authenticated
  USING (public.user_is_admin());

DROP POLICY IF EXISTS file_movements_insert ON public.file_movements;

CREATE POLICY file_movements_insert ON public.file_movements
  FOR INSERT TO authenticated
  WITH CHECK (public.user_can_move_files());

CREATE POLICY file_movements_update ON public.file_movements
  FOR UPDATE TO authenticated
  USING (public.user_can_move_files());

-- Extended table write policies
DROP POLICY IF EXISTS archive_locations_select ON public.archive_locations;

CREATE POLICY archive_locations_select ON public.archive_locations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY archive_locations_insert ON public.archive_locations
  FOR INSERT TO authenticated
  WITH CHECK (public.user_can_manage_archive());

CREATE POLICY archive_locations_update ON public.archive_locations
  FOR UPDATE TO authenticated
  USING (public.user_can_manage_archive());

CREATE POLICY archive_locations_delete ON public.archive_locations
  FOR DELETE TO authenticated
  USING (public.user_is_admin());

CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS audit_logs_select ON public.audit_logs;

CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.user_can_view_audit() OR user_id = auth.uid());

CREATE POLICY notices_insert ON public.notices
  FOR INSERT TO authenticated
  WITH CHECK (public.user_is_admin() OR public.get_user_role() IN ('ict_officer', 'deputy_registrar'));

CREATE POLICY notices_update ON public.notices
  FOR UPDATE TO authenticated
  USING (public.user_is_admin() OR public.get_user_role() IN ('ict_officer', 'deputy_registrar'));

CREATE POLICY memos_insert ON public.memos
  FOR INSERT TO authenticated
  WITH CHECK (public.user_is_admin() OR public.get_user_role() IN ('ict_officer', 'deputy_registrar'));

CREATE POLICY memos_update ON public.memos
  FOR UPDATE TO authenticated
  USING (public.user_is_admin() OR public.get_user_role() IN ('ict_officer', 'deputy_registrar'));

CREATE POLICY broadcasts_insert ON public.broadcasts
  FOR INSERT TO authenticated
  WITH CHECK (public.user_is_admin() OR public.get_user_role() = 'ict_officer');

CREATE POLICY broadcasts_update ON public.broadcasts
  FOR UPDATE TO authenticated
  USING (public.user_is_admin() OR public.get_user_role() = 'ict_officer');

CREATE POLICY registry_requests_insert ON public.registry_requests
  FOR INSERT TO authenticated
  WITH CHECK (public.user_can_manage_registry());

CREATE POLICY registry_requests_update ON public.registry_requests
  FOR UPDATE TO authenticated
  USING (public.user_can_manage_registry());

-- ---------------------------------------------------------------------------
-- Performance indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_file_movements_case_id ON public.file_movements(case_id);
CREATE INDEX IF NOT EXISTS idx_file_movements_status_return ON public.file_movements(status, expected_return_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_archive_locations_parent_id ON public.archive_locations(parent_id);
CREATE INDEX IF NOT EXISTS idx_cases_status_filed ON public.cases(status, filed_date);
CREATE INDEX IF NOT EXISTS idx_registry_requests_status ON public.registry_requests(status, created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cases_archive_code ON public.cases(archive_code) WHERE archive_code IS NOT NULL;
