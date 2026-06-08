-- Separate audit taxonomy for deletes (was incorrectly logged as case_updated)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'audit_action'
      AND e.enumlabel = 'case_deleted'
  ) THEN
    ALTER TYPE public.audit_action ADD VALUE 'case_deleted';
  END IF;
END
$$;
