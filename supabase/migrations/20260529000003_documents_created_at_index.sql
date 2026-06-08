-- Speed dashboard "documents today" range scans on created_at
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);
