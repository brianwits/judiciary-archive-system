CREATE OR REPLACE FUNCTION public.ensure_profile_for_current_user()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_profile public.profiles;
  auth_user auth.users%ROWTYPE;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
  INTO current_profile
  FROM public.profiles
  WHERE id = current_user_id;

  IF FOUND THEN
    RETURN current_profile;
  END IF;

  SELECT *
  INTO auth_user
  FROM auth.users
  WHERE id = current_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Authenticated user % not found in auth.users', current_user_id;
  END IF;

  INSERT INTO public.profiles (
    id,
    full_name,
    pj_number,
    department,
    role,
    is_active
  )
  VALUES (
    auth_user.id,
    COALESCE(
      NULLIF(trim(auth_user.raw_user_meta_data->>'full_name'), ''),
      split_part(COALESCE(auth_user.email, 'unknown@placeholder.local'), '@', 1)
    ),
    NULLIF(trim(auth_user.raw_user_meta_data->>'pj_number'), ''),
    NULLIF(trim(auth_user.raw_user_meta_data->>'department'), ''),
    'judge'::public.court_user_role,
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    pj_number = COALESCE(public.profiles.pj_number, EXCLUDED.pj_number),
    department = COALESCE(public.profiles.department, EXCLUDED.department),
    is_active = COALESCE(public.profiles.is_active, EXCLUDED.is_active)
  RETURNING *
  INTO current_profile;

  RETURN current_profile;
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_profile_for_current_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_profile_for_current_user() TO authenticated;
