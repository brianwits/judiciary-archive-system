-- CTS alignment layer: source provenance, custody events, sync tables, and searchable CTS identifiers.

-- ---------------------------------------------------------------------------
-- Location and reference taxonomy extensions
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  ALTER TYPE public.location_level ADD VALUE IF NOT EXISTS 'station';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.location_level ADD VALUE IF NOT EXISTS 'section';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.location_level ADD VALUE IF NOT EXISTS 'bundle';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.court_stations
  ADD COLUMN IF NOT EXISTS source_id text;

ALTER TABLE public.case_categories
  ADD COLUMN IF NOT EXISTS source_id text;

ALTER TABLE public.case_types
  ADD COLUMN IF NOT EXISTS source_id text;

CREATE TABLE IF NOT EXISTS public.court_divisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_code text REFERENCES public.court_stations(code) ON DELETE SET NULL,
  source_id text,
  code text NOT NULL,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT court_divisions_code_unique UNIQUE (code)
);

ALTER TABLE public.court_divisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS court_divisions_select_authenticated ON public.court_divisions;
CREATE POLICY court_divisions_select_authenticated ON public.court_divisions
  FOR SELECT TO authenticated USING (true);

GRANT SELECT ON TABLE public.court_divisions TO authenticated, service_role;

DROP TRIGGER IF EXISTS set_court_divisions_updated_at ON public.court_divisions;
CREATE TRIGGER set_court_divisions_updated_at
  BEFORE UPDATE ON public.court_divisions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Case provenance and search helpers
-- ---------------------------------------------------------------------------

ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS source_system text,
  ADD COLUMN IF NOT EXISTS source_case_id text,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS case_number_raw text,
  ADD COLUMN IF NOT EXISTS case_number_normalized text,
  ADD COLUMN IF NOT EXISTS source_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_record_hash text;

UPDATE public.cases
SET case_number_raw = COALESCE(case_number_raw, case_number),
    case_number_normalized = COALESCE(case_number_normalized, lower(btrim(COALESCE(case_number_raw, case_number, ''))))
WHERE case_number_raw IS NULL
   OR case_number_normalized IS NULL;

CREATE OR REPLACE FUNCTION public.sync_case_number_projections()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.case_number_raw IS NULL OR btrim(NEW.case_number_raw) = '' THEN
    NEW.case_number_raw := NEW.case_number;
  END IF;

  IF NEW.case_number IS NULL OR btrim(NEW.case_number) = '' THEN
    NEW.case_number := NEW.case_number_raw;
  END IF;

  NEW.case_number_normalized := lower(btrim(COALESCE(NEW.case_number_raw, NEW.case_number, '')));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cases_sync_case_number_projections ON public.cases;
CREATE TRIGGER cases_sync_case_number_projections
  BEFORE INSERT OR UPDATE OF case_number, case_number_raw ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.sync_case_number_projections();

CREATE INDEX IF NOT EXISTS idx_cases_case_number_normalized
  ON public.cases (case_number_normalized)
  WHERE case_number_normalized IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cases_tracking_number_lower
  ON public.cases (lower(tracking_number))
  WHERE tracking_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cases_source_case_id
  ON public.cases (source_case_id)
  WHERE source_case_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cases_source_updated_at
  ON public.cases (source_updated_at DESC)
  WHERE source_updated_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.external_source_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system text NOT NULL,
  entity_type text NOT NULL,
  source_id text NOT NULL,
  local_id uuid NOT NULL,
  source_updated_at timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT external_source_mappings_unique UNIQUE (source_system, entity_type, source_id)
);

ALTER TABLE public.external_source_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS external_source_mappings_select_authenticated ON public.external_source_mappings;
CREATE POLICY external_source_mappings_select_authenticated ON public.external_source_mappings
  FOR SELECT TO authenticated USING (true);

GRANT SELECT ON TABLE public.external_source_mappings TO authenticated, service_role;
GRANT ALL ON TABLE public.external_source_mappings TO service_role;

ALTER TABLE public.case_parties
  ADD COLUMN IF NOT EXISTS source_system text,
  ADD COLUMN IF NOT EXISTS source_id text,
  ADD COLUMN IF NOT EXISTS source_updated_at timestamptz;

ALTER TABLE public.case_activities
  ADD COLUMN IF NOT EXISTS source_system text,
  ADD COLUMN IF NOT EXISTS source_id text,
  ADD COLUMN IF NOT EXISTS source_event_id text,
  ADD COLUMN IF NOT EXISTS source_updated_at timestamptz;

ALTER TABLE public.case_special_metadata
  ADD COLUMN IF NOT EXISTS source_system text,
  ADD COLUMN IF NOT EXISTS source_id text,
  ADD COLUMN IF NOT EXISTS source_updated_at timestamptz;

ALTER TABLE public.archive_locations
  ADD COLUMN IF NOT EXISTS station_id text REFERENCES public.court_stations(code) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- ---------------------------------------------------------------------------
-- CTS storage, custody, and digitization
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.file_volumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  volume_number integer NOT NULL DEFAULT 1,
  archive_code text NOT NULL,
  barcode text,
  condition text NOT NULL DEFAULT 'good',
  page_count integer,
  confidentiality_class text NOT NULL DEFAULT 'internal',
  retention_class text NOT NULL DEFAULT 'case_file',
  legal_hold boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'unregistered',
  source_system text,
  source_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT file_volumes_barcode_unique UNIQUE (barcode),
  CONSTRAINT file_volumes_status_check CHECK (status IN ('unregistered', 'in_archive', 'requested', 'issued', 'in_transit', 'in_custody', 'returned', 'verified', 'missing', 'damaged', 'legal_hold', 'recovered')),
  CONSTRAINT file_volumes_condition_check CHECK (condition IN ('good', 'fair', 'damaged', 'missing', 'sealed'))
);

CREATE INDEX IF NOT EXISTS idx_file_volumes_case_id
  ON public.file_volumes (case_id, volume_number);

ALTER TABLE public.file_volumes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS file_volumes_select_authenticated ON public.file_volumes;
DROP POLICY IF EXISTS file_volumes_write_archive_roles ON public.file_volumes;

CREATE POLICY file_volumes_select_authenticated ON public.file_volumes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY file_volumes_write_archive_roles ON public.file_volumes
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'registry_clerk', 'archivist', 'deputy_registrar', 'ict_officer'))
  WITH CHECK (public.get_user_role() IN ('admin', 'registry_clerk', 'archivist', 'deputy_registrar', 'ict_officer'));

GRANT SELECT ON TABLE public.file_volumes TO authenticated, service_role;
GRANT ALL ON TABLE public.file_volumes TO service_role;

DROP TRIGGER IF EXISTS set_file_volumes_updated_at ON public.file_volumes;
CREATE TRIGGER set_file_volumes_updated_at
  BEFORE UPDATE ON public.file_volumes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.storage_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_volume_id uuid NOT NULL REFERENCES public.file_volumes(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.archive_locations(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  active boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_storage_assignments_active_volume
  ON public.storage_assignments (file_volume_id)
  WHERE active;

ALTER TABLE public.storage_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS storage_assignments_select_authenticated ON public.storage_assignments;
DROP POLICY IF EXISTS storage_assignments_write_archive_roles ON public.storage_assignments;

CREATE POLICY storage_assignments_select_authenticated ON public.storage_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY storage_assignments_write_archive_roles ON public.storage_assignments
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'registry_clerk', 'archivist', 'deputy_registrar'))
  WITH CHECK (public.get_user_role() IN ('admin', 'registry_clerk', 'archivist', 'deputy_registrar'));

GRANT SELECT ON TABLE public.storage_assignments TO authenticated, service_role;
GRANT ALL ON TABLE public.storage_assignments TO service_role;

CREATE TABLE IF NOT EXISTS public.movement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_volume_id uuid NOT NULL REFERENCES public.file_volumes(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason_code text,
  reason_text text NOT NULL,
  destination_type text NOT NULL,
  destination_id text,
  same_court boolean NOT NULL DEFAULT true,
  associated_case_event_id uuid REFERENCES public.case_activities(id) ON DELETE SET NULL,
  priority text NOT NULL DEFAULT 'normal',
  expected_return_at timestamptz,
  status text NOT NULL DEFAULT 'draft',
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at timestamptz,
  idempotency_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT movement_requests_status_check CHECK (status IN ('draft', 'submitted', 'approved', 'ready_for_issue', 'issued', 'accepted', 'return_initiated', 'returned', 'verified', 'closed', 'rejected', 'cancelled', 'overdue')),
  CONSTRAINT movement_requests_priority_check CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

CREATE INDEX IF NOT EXISTS idx_movement_requests_file_volume_id
  ON public.movement_requests (file_volume_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_movement_requests_idempotency_key
  ON public.movement_requests (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.movement_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS movement_requests_select_authenticated ON public.movement_requests;
DROP POLICY IF EXISTS movement_requests_write_move_roles ON public.movement_requests;

CREATE POLICY movement_requests_select_authenticated ON public.movement_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY movement_requests_write_move_roles ON public.movement_requests
  FOR ALL TO authenticated
  USING (public.user_can_move_files())
  WITH CHECK (public.user_can_move_files());

GRANT SELECT ON TABLE public.movement_requests TO authenticated, service_role;
GRANT ALL ON TABLE public.movement_requests TO service_role;

DROP TRIGGER IF EXISTS set_movement_requests_updated_at ON public.movement_requests;
CREATE TRIGGER set_movement_requests_updated_at
  BEFORE UPDATE ON public.movement_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.custody_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_request_id uuid REFERENCES public.movement_requests(id) ON DELETE CASCADE,
  file_volume_id uuid NOT NULL REFERENCES public.file_volumes(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_location_id uuid REFERENCES public.archive_locations(id) ON DELETE SET NULL,
  from_custodian_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  to_location_id uuid REFERENCES public.archive_locations(id) ON DELETE SET NULL,
  to_custodian_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scan_method text,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_custody_events_file_volume_id
  ON public.custody_events (file_volume_id, occurred_at DESC);

ALTER TABLE public.custody_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS custody_events_select_authenticated ON public.custody_events;
DROP POLICY IF EXISTS custody_events_write_move_roles ON public.custody_events;

CREATE POLICY custody_events_select_authenticated ON public.custody_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY custody_events_write_move_roles ON public.custody_events
  FOR INSERT TO authenticated
  WITH CHECK (public.user_can_move_files());

GRANT SELECT ON TABLE public.custody_events TO authenticated, service_role;
GRANT INSERT ON TABLE public.custody_events TO authenticated, service_role;
GRANT ALL ON TABLE public.custody_events TO service_role;

CREATE TABLE IF NOT EXISTS public.document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  storage_path text NOT NULL,
  checksum_sha256 text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT document_versions_unique_version UNIQUE (document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id
  ON public.document_versions (document_id, version_number DESC);

ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS document_versions_select_authenticated ON public.document_versions;
DROP POLICY IF EXISTS document_versions_write_upload_roles ON public.document_versions;

CREATE POLICY document_versions_select_authenticated ON public.document_versions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY document_versions_write_upload_roles ON public.document_versions
  FOR ALL TO authenticated
  USING (public.user_can_upload_docs())
  WITH CHECK (public.user_can_upload_docs());

GRANT SELECT ON TABLE public.document_versions TO authenticated, service_role;
GRANT ALL ON TABLE public.document_versions TO service_role;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS file_volume_id uuid REFERENCES public.file_volumes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_document_id text,
  ADD COLUMN IF NOT EXISTS checksum_sha256 text,
  ADD COLUMN IF NOT EXISTS ocr_confidence numeric(5,2),
  ADD COLUMN IF NOT EXISTS confidentiality_class text,
  ADD COLUMN IF NOT EXISTS source_system text,
  ADD COLUMN IF NOT EXISTS source_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS set_documents_updated_at ON public.documents;
CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.registry_requests
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS assigned_officer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS source_event_id text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS set_registry_requests_updated_at ON public.registry_requests;
CREATE TRIGGER set_registry_requests_updated_at
  BEFORE UPDATE ON public.registry_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS idx_registry_requests_idempotency_key
  ON public.registry_requests (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Sync runs and exceptions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system text NOT NULL,
  schema_version text NOT NULL,
  cursor_value text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  read_count integer NOT NULL DEFAULT 0,
  created_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  rejected_count integer NOT NULL DEFAULT 0,
  reconciled_count integer NOT NULL DEFAULT 0,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sync_runs_status_check CHECK (status IN ('running', 'succeeded', 'failed', 'partial', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_sync_runs_source_started
  ON public.sync_runs (source_system, started_at DESC);

ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sync_runs_select_admins ON public.sync_runs;
CREATE POLICY sync_runs_select_admins ON public.sync_runs
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('admin', 'ict_officer'));

GRANT SELECT ON TABLE public.sync_runs TO authenticated, service_role;
GRANT ALL ON TABLE public.sync_runs TO service_role;

DROP TRIGGER IF EXISTS set_sync_runs_updated_at ON public.sync_runs;
CREATE TRIGGER set_sync_runs_updated_at
  BEFORE UPDATE ON public.sync_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.sync_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id uuid NOT NULL REFERENCES public.sync_runs(id) ON DELETE CASCADE,
  source_entity text NOT NULL,
  source_id text NOT NULL,
  error_code text NOT NULL,
  payload_redacted jsonb,
  status text NOT NULL DEFAULT 'open',
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sync_exceptions_status_check CHECK (status IN ('open', 'investigating', 'resolved', 'ignored'))
);

CREATE INDEX IF NOT EXISTS idx_sync_exceptions_sync_run_id
  ON public.sync_exceptions (sync_run_id, created_at DESC);

ALTER TABLE public.sync_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sync_exceptions_select_admins ON public.sync_exceptions;
CREATE POLICY sync_exceptions_select_admins ON public.sync_exceptions
  FOR SELECT TO authenticated
  USING (public.get_user_role() IN ('admin', 'ict_officer', 'deputy_registrar'));

GRANT SELECT ON TABLE public.sync_exceptions TO authenticated, service_role;
GRANT ALL ON TABLE public.sync_exceptions TO service_role;

-- ---------------------------------------------------------------------------
-- CTS-aware search and scan lookup
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.search_cases(
  search_query text,
  result_limit integer DEFAULT NULL,
  result_offset integer DEFAULT NULL
)
RETURNS SETOF public.cases
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH input AS (
    SELECT
      lower(btrim(COALESCE(search_query, ''))) AS q,
      COALESCE(NULLIF(result_limit, 0), 50) AS limit_value,
      GREATEST(COALESCE(result_offset, 0), 0) AS offset_value
  )
  SELECT c.*
  FROM public.cases c
  CROSS JOIN input
  WHERE input.q = ''
    OR to_tsvector(
      'english',
      coalesce(c.case_number, '') || ' ' ||
      coalesce(c.case_number_raw, '') || ' ' ||
      coalesce(c.case_number_normalized, '') || ' ' ||
      coalesce(c.tracking_number, '') || ' ' ||
      coalesce(c.title, '') || ' ' ||
      coalesce(c.description, '') || ' ' ||
      coalesce(c.plaintiff, '') || ' ' ||
      coalesce(c.defendant, '') || ' ' ||
      coalesce(c.archive_code, '')
    ) @@ plainto_tsquery('english', input.q)
    OR lower(c.case_number) = input.q
    OR lower(COALESCE(c.case_number_raw, '')) = input.q
    OR lower(COALESCE(c.case_number_normalized, '')) = input.q
    OR lower(COALESCE(c.tracking_number, '')) = input.q
    OR lower(COALESCE(c.source_case_id, '')) = input.q
    OR lower(COALESCE(c.archive_code, '')) = input.q
    OR EXISTS (
      SELECT 1
      FROM public.case_parties p
      WHERE p.case_id = c.id
        AND (
          lower(p.party_name) LIKE '%' || input.q || '%'
          OR lower(COALESCE(p.normalized_party_name, '')) LIKE '%' || input.q || '%'
        )
    )
  ORDER BY c.created_at DESC
  LIMIT (SELECT limit_value FROM input)
  OFFSET (SELECT offset_value FROM input);
$$;

CREATE OR REPLACE FUNCTION public.lookup_case_for_scan(scan_code text)
RETURNS TABLE (
  id uuid,
  case_number text,
  case_number_raw text,
  case_number_normalized text,
  title text,
  court text,
  status public.case_status,
  filed_date date,
  closed_date date,
  description text,
  case_type text,
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
  source_case_id text,
  source_system text,
  source_updated_at timestamptz,
  tracking_number text,
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
    c.case_number_raw,
    c.case_number_normalized,
    c.title,
    c.court,
    c.status,
    c.filed_date,
    c.closed_date,
    c.description,
    c.case_type,
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
  c.source_case_id,
  c.source_system,
  c.source_updated_at,
  c.source_record_hash,
  c.tracking_number,
  c.created_at,
  c.updated_at,
    CASE
      WHEN lower(c.case_number) = input.code THEN 'case_number'
      WHEN lower(COALESCE(c.case_number_normalized, '')) = input.code THEN 'case_number_normalized'
      WHEN lower(COALESCE(c.tracking_number, '')) = input.code THEN 'tracking_number'
      WHEN lower(COALESCE(c.qr_barcode, '')) = input.code THEN 'qr_barcode'
      ELSE 'archive_code'
    END AS matched_by
  FROM public.cases c
  CROSS JOIN input
  WHERE input.code <> ''
    AND (
      lower(c.case_number) = input.code
      OR lower(COALESCE(c.case_number_raw, '')) = input.code
      OR lower(COALESCE(c.case_number_normalized, '')) = input.code
      OR lower(COALESCE(c.tracking_number, '')) = input.code
      OR lower(COALESCE(c.qr_barcode, '')) = input.code
      OR lower(COALESCE(c.archive_code, '')) = input.code
    )
  ORDER BY
    CASE
      WHEN lower(c.case_number) = input.code THEN 1
      WHEN lower(COALESCE(c.case_number_raw, '')) = input.code THEN 2
      WHEN lower(COALESCE(c.case_number_normalized, '')) = input.code THEN 3
      WHEN lower(COALESCE(c.tracking_number, '')) = input.code THEN 4
      WHEN lower(COALESCE(c.qr_barcode, '')) = input.code THEN 5
      ELSE 6
    END,
    c.updated_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.search_cases_count(search_query text)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH input AS (SELECT lower(btrim(COALESCE(search_query, ''))) AS q)
  SELECT count(*)::bigint
  FROM public.cases c
  CROSS JOIN input
  WHERE input.q = ''
    OR to_tsvector(
      'english',
      coalesce(c.case_number, '') || ' ' ||
      coalesce(c.case_number_raw, '') || ' ' ||
      coalesce(c.case_number_normalized, '') || ' ' ||
      coalesce(c.tracking_number, '') || ' ' ||
      coalesce(c.title, '') || ' ' ||
      coalesce(c.description, '') || ' ' ||
      coalesce(c.plaintiff, '') || ' ' ||
      coalesce(c.defendant, '') || ' ' ||
      coalesce(c.archive_code, '')
    ) @@ plainto_tsquery('english', input.q)
    OR lower(c.case_number) = input.q
    OR lower(COALESCE(c.case_number_raw, '')) = input.q
    OR lower(COALESCE(c.case_number_normalized, '')) = input.q
    OR lower(COALESCE(c.tracking_number, '')) = input.q
    OR lower(COALESCE(c.source_case_id, '')) = input.q
    OR lower(COALESCE(c.archive_code, '')) = input.q
    OR EXISTS (
      SELECT 1
      FROM public.case_parties p
      WHERE p.case_id = c.id
        AND (
          lower(p.party_name) LIKE '%' || input.q || '%'
          OR lower(COALESCE(p.normalized_party_name, '')) LIKE '%' || input.q || '%'
        )
    );
$$;

REVOKE ALL ON FUNCTION public.search_cases(text, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_cases_count(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lookup_case_for_scan(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_cases(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_cases_count(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_case_for_scan(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_case_for_scan(text) TO service_role;
