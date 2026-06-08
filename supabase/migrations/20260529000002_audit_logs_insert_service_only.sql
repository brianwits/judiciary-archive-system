-- Audit rows must not be insertable by arbitrary authenticated JWTs (forgery risk).
-- Application writes audit logs via service_role (createAdminClient); service_role bypasses RLS.
DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;
