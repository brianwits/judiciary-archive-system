-- Judiciary Archive System — initial schema

CREATE TYPE public.user_role AS ENUM ('admin', 'staff', 'readonly');
CREATE TYPE public.case_status AS ENUM ('open', 'closed', 'archived');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role public.user_role NOT NULL DEFAULT 'readonly',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number text NOT NULL UNIQUE,
  title text NOT NULL,
  court text NOT NULL DEFAULT '',
  status public.case_status NOT NULL DEFAULT 'open',
  filed_date date,
  closed_date date,
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  title text NOT NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cases_search_idx ON public.cases USING gin (
  to_tsvector(
    'english',
    coalesce(case_number, '') || ' ' || coalesce(title, '') || ' ' || coalesce(description, '')
  )
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'readonly'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own_or_admin ON public.profiles
  FOR SELECT
  USING (id = auth.uid() OR public.get_user_role() = 'admin');

CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY cases_select_authenticated ON public.cases
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY cases_insert_staff_admin ON public.cases
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('staff', 'admin'));

CREATE POLICY cases_update_staff_admin ON public.cases
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('staff', 'admin'));

CREATE POLICY cases_delete_admin ON public.cases
  FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY documents_select_authenticated ON public.documents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY documents_insert_staff_admin ON public.documents
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('staff', 'admin'));

CREATE POLICY documents_update_staff_admin ON public.documents
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('staff', 'admin'));

CREATE POLICY documents_delete_admin ON public.documents
  FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'admin');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'case-documents',
  'case-documents',
  false,
  26214400,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
);

CREATE POLICY case_documents_select ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'case-documents');

CREATE POLICY case_documents_insert ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'case-documents'
    AND public.get_user_role() IN ('staff', 'admin')
  );

CREATE POLICY case_documents_update ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'case-documents'
    AND public.get_user_role() IN ('staff', 'admin')
  );

CREATE POLICY case_documents_delete ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'case-documents'
    AND public.get_user_role() = 'admin'
  );

CREATE OR REPLACE FUNCTION public.search_cases(search_query text)
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
  ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id uuid,
  new_role public.user_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.get_user_role() != 'admin' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.profiles
  SET role = new_role
  WHERE id = target_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_cases(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_role(uuid, public.user_role) TO authenticated;
