ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pj_number text,
  ADD COLUMN IF NOT EXISTS department text;

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
    'readonly'
  );
  RETURN NEW;
END;
$$;
