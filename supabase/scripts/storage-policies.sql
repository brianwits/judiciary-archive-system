-- Run after Supabase storage service is up (local: after db:start; hosted: SQL Editor)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'case-documents',
  'case-documents',
  false,
  26214400,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS case_documents_select ON storage.objects;
DROP POLICY IF EXISTS case_documents_insert ON storage.objects;
DROP POLICY IF EXISTS case_documents_update ON storage.objects;
DROP POLICY IF EXISTS case_documents_delete ON storage.objects;

CREATE POLICY case_documents_select ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'case-documents');

CREATE POLICY case_documents_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'case-documents' AND public.user_can_upload_docs());

CREATE POLICY case_documents_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'case-documents' AND public.user_can_upload_docs());

CREATE POLICY case_documents_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'case-documents' AND public.user_is_admin());
