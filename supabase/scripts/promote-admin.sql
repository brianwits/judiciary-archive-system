-- Run after creating your first auth user in the Supabase dashboard.
-- Replace the email below, then execute in the SQL editor.

UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@court.go.ke' LIMIT 1
);
