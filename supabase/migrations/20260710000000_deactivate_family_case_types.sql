-- Deactivate Family case types removed from the codebase taxonomy.
--
-- The following case type IDs have been removed from CASE_TYPE_DEFINITIONS
-- in src/data/case-types.ts as part of removing the "Family" case type:
--   22  HCFA     - High Court Family Appeal
--   23  HCFMISC  - High Court Family Miscellaneous
--   25  HCFDC   - High Court Family Divorce Cause
--   26  HCFADOP - High Court Family Adoption
--   62  MCDC    - Magistrate Court Divorce Case
--   108 HCFOS   - High Court Family Originating Summons
--
-- Note: ID 24 (HCFP&A) is kept active with case_family 'Succession & Probate'.

BEGIN;

-- 1. Deactivate the Family case types so they no longer appear in type dropdowns
--    or authoritative classification for new cases.
UPDATE public.case_types
SET active = false, updated_at = now()
WHERE case_type_id IN (22, 23, 25, 26, 62, 108);

-- 2. For existing cases that reference these deactivated type IDs, reset their
--    case_type_id to null and clear the case_family so they drop to "pending_review"
--    classification. The case_category_code is preserved for audit/reference.
UPDATE public.cases
SET case_type_id = NULL,
    case_family  = NULL,
    updated_at   = now()
WHERE case_type_id IN (22, 23, 25, 26, 62, 108);

COMMIT;
