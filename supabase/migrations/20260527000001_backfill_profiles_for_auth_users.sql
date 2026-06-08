-- Backfill public.profiles for auth.users rows missing a profile (e.g. pre-trigger users,
-- Dashboard-created users, or restores where the trigger did not run).
-- Default role: judge (court_user_role).

INSERT INTO public.profiles (
  id,
  full_name,
  pj_number,
  department,
  role,
  is_active
)
SELECT
  u.id,
  COALESCE(
    NULLIF(trim(u.raw_user_meta_data->>'full_name'), ''),
    split_part(coalesce(u.email, 'unknown@placeholder.local'), '@', 1)
  ),
  NULLIF(trim(u.raw_user_meta_data->>'pj_number'), ''),
  NULLIF(trim(u.raw_user_meta_data->>'department'), ''),
  'judge'::public.court_user_role,
  true
FROM auth.users AS u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles AS p WHERE p.id = u.id
);
