-- Standardize court staff emails and add user lifecycle audit actions.
-- Safe additive migration: enum values plus deterministic email backfill.

ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'user_created';
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'user_deleted';
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'file_scanned';

WITH legacy_duplicates AS (
  SELECT legacy.id
  FROM auth.users AS legacy
  JOIN auth.users AS standardized
    ON lower(standardized.email) = regexp_replace(lower(legacy.email), '@courts\.go\.ke$', '@court.go.ke')
   AND split_part(lower(standardized.email), '@', 1) = split_part(lower(legacy.email), '@', 1)
   AND standardized.id <> legacy.id
  WHERE lower(legacy.email) LIKE '%@courts.go.ke'
)
DELETE FROM auth.users
WHERE id IN (SELECT id FROM legacy_duplicates);

UPDATE auth.users
SET email = regexp_replace(lower(email), '@courts\.go\.ke$', '@court.go.ke')
WHERE lower(email) LIKE '%@courts.go.ke';
