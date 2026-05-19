-- Extended schema for full archive management system

-- New role enum (migrate from legacy)
DO $$ BEGIN
  CREATE TYPE public.court_user_role AS ENUM (
    'admin',
    'ict_officer',
    'registry_clerk',
    'archivist',
    'deputy_registrar',
    'judge'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Extend case status
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'missing';
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'pending_return';

-- Document category
DO $$ BEGIN
  CREATE TYPE public.document_category AS ENUM (
    'Pleadings',
    'Proceedings',
    'Rulings',
    'Orders',
    'Correspondence',
    'Exhibits'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.ocr_status AS ENUM ('pending', 'processing', 'complete', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.movement_status AS ENUM ('checked_out', 'in_transit', 'returned', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.audit_action AS ENUM (
    'login',
    'case_created',
    'case_updated',
    'file_moved',
    'file_archived',
    'document_uploaded',
    'file_missing',
    'role_changed',
    'file_checked_out',
    'file_checked_in'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.location_level AS ENUM ('room', 'bay', 'rack', 'shelf', 'box');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Extend cases table
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS case_type text DEFAULT '',
  ADD COLUMN IF NOT EXISTS court_station text DEFAULT '',
  ADD COLUMN IF NOT EXISTS court_division text DEFAULT '',
  ADD COLUMN IF NOT EXISTS year integer,
  ADD COLUMN IF NOT EXISTS plaintiff text DEFAULT '',
  ADD COLUMN IF NOT EXISTS defendant text DEFAULT '',
  ADD COLUMN IF NOT EXISTS judge text DEFAULT '',
  ADD COLUMN IF NOT EXISTS archive_code text,
  ADD COLUMN IF NOT EXISTS shelf_location text,
  ADD COLUMN IF NOT EXISTS location_id uuid,
  ADD COLUMN IF NOT EXISTS qr_barcode text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS is_missing boolean DEFAULT false;

-- Archive locations
CREATE TABLE IF NOT EXISTS public.archive_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.archive_locations(id) ON DELETE CASCADE,
  level public.location_level NOT NULL,
  code text NOT NULL,
  label text NOT NULL,
  capacity integer NOT NULL DEFAULT 0,
  occupied_count integer NOT NULL DEFAULT 0,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cases
  DROP CONSTRAINT IF EXISTS cases_location_id_fkey,
  ADD CONSTRAINT cases_location_id_fkey
    FOREIGN KEY (location_id) REFERENCES public.archive_locations(id) ON DELETE SET NULL;

-- File movements
CREATE TABLE IF NOT EXISTS public.file_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  checked_out_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  destination_office text NOT NULL,
  purpose text NOT NULL,
  expected_return_date date NOT NULL,
  actual_return_date date,
  status public.movement_status NOT NULL DEFAULT 'checked_out',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_file_movements_updated_at
  BEFORE UPDATE ON public.file_movements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Extend documents
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS category public.document_category DEFAULT 'Pleadings',
  ADD COLUMN IF NOT EXISTS ocr_status public.ocr_status DEFAULT 'pending';

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action public.audit_action NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Communications
CREATE TABLE IF NOT EXISTS public.notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  priority text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.memos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  reference text NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.registry_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  request_type text NOT NULL,
  requester text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.archive_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY archive_locations_select ON public.archive_locations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY file_movements_select ON public.file_movements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY file_movements_insert ON public.file_movements
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('staff', 'admin'));

CREATE POLICY audit_logs_select ON public.audit_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY notices_select ON public.notices
  FOR SELECT TO authenticated USING (true);

CREATE POLICY memos_select ON public.memos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY broadcasts_select ON public.broadcasts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY registry_requests_select ON public.registry_requests
  FOR SELECT TO authenticated USING (true);
