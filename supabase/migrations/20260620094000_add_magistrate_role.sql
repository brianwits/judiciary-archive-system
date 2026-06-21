-- Add magistrate as a first-class court role.
ALTER TYPE public.court_user_role ADD VALUE IF NOT EXISTS 'magistrate';
