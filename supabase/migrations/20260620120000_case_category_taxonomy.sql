-- Canonical court case category taxonomy, alias tables, and archive/search backfill.

ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS case_category_code text;

CREATE TABLE IF NOT EXISTS public.case_categories (
  code text PRIMARY KEY,
  court_level text NOT NULL,
  division text NOT NULL,
  category_name text NOT NULL,
  common_prefix text NOT NULL,
  parent_category text NOT NULL,
  description text,
  example_case_number text,
  source_url text,
  confidence_level text,
  requires_registry_verification boolean NOT NULL DEFAULT false,
  archive_indexing_notes text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.case_category_aliases (
  id bigserial PRIMARY KEY,
  case_category_code text NOT NULL REFERENCES public.case_categories(code) ON DELETE CASCADE,
  alias text NOT NULL,
  alias_type text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (case_category_code, alias)
);

CREATE TABLE IF NOT EXISTS public.court_stations (
  code text PRIMARY KEY,
  station_name text NOT NULL,
  county text NOT NULL,
  court_rank text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.case_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  party_name text NOT NULL,
  party_role text NOT NULL,
  normalized_party_name text,
  id_number text,
  advocate_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.case_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  activity_date date,
  activity_time time,
  judicial_officer text,
  courtroom text,
  notes text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.case_special_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  metadata_key text NOT NULL,
  metadata_value text,
  metadata_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cases
  DROP CONSTRAINT IF EXISTS cases_case_category_code_fkey,
  ADD CONSTRAINT cases_case_category_code_fkey
    FOREIGN KEY (case_category_code) REFERENCES public.case_categories(code) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cases_case_category_code
  ON public.cases (case_category_code);

CREATE INDEX IF NOT EXISTS idx_cases_search_taxonomy
  ON public.cases USING gin (
    to_tsvector(
      'english',
      coalesce(case_number, '') || ' ' ||
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(plaintiff, '') || ' ' ||
      coalesce(defendant, '') || ' ' ||
      coalesce(case_type, '') || ' ' ||
      coalesce(case_category_code, '')
    )
  );

CREATE INDEX IF NOT EXISTS idx_case_categories_active
  ON public.case_categories (active, court_level, division);

CREATE INDEX IF NOT EXISTS idx_case_categories_name_lower
  ON public.case_categories (lower(category_name));

CREATE INDEX IF NOT EXISTS idx_case_categories_code_lower
  ON public.case_categories (lower(code));

CREATE INDEX IF NOT EXISTS idx_case_category_aliases_alias_lower
  ON public.case_category_aliases (lower(alias));

CREATE INDEX IF NOT EXISTS idx_case_parties_case_id
  ON public.case_parties (case_id);

CREATE INDEX IF NOT EXISTS idx_case_parties_normalized_party_name_lower
  ON public.case_parties (lower(normalized_party_name))
  WHERE normalized_party_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_case_parties_party_name_lower
  ON public.case_parties (lower(party_name));

CREATE INDEX IF NOT EXISTS idx_case_activities_case_date
  ON public.case_activities (case_id, activity_date DESC);

CREATE INDEX IF NOT EXISTS idx_case_special_metadata_case_key
  ON public.case_special_metadata (case_id, metadata_key);

ALTER TABLE public.case_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_category_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.court_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_special_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS case_categories_select_authenticated ON public.case_categories;
DROP POLICY IF EXISTS case_category_aliases_select_authenticated ON public.case_category_aliases;
DROP POLICY IF EXISTS court_stations_select_authenticated ON public.court_stations;
DROP POLICY IF EXISTS case_parties_select_authenticated ON public.case_parties;
DROP POLICY IF EXISTS case_parties_write_staff_admin ON public.case_parties;
DROP POLICY IF EXISTS case_activities_select_authenticated ON public.case_activities;
DROP POLICY IF EXISTS case_activities_write_staff_admin ON public.case_activities;
DROP POLICY IF EXISTS case_special_metadata_select_authenticated ON public.case_special_metadata;
DROP POLICY IF EXISTS case_special_metadata_write_staff_admin ON public.case_special_metadata;

CREATE POLICY case_categories_select_authenticated ON public.case_categories
  FOR SELECT TO authenticated USING (true);

CREATE POLICY case_category_aliases_select_authenticated ON public.case_category_aliases
  FOR SELECT TO authenticated USING (true);

CREATE POLICY court_stations_select_authenticated ON public.court_stations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY case_parties_select_authenticated ON public.case_parties
  FOR SELECT TO authenticated USING (true);

CREATE POLICY case_parties_write_staff_admin ON public.case_parties
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'ict_officer', 'registry_clerk', 'archivist', 'deputy_registrar'))
  WITH CHECK (public.get_user_role() IN ('admin', 'ict_officer', 'registry_clerk', 'archivist', 'deputy_registrar'));

CREATE POLICY case_activities_select_authenticated ON public.case_activities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY case_activities_write_staff_admin ON public.case_activities
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'ict_officer', 'registry_clerk', 'archivist', 'deputy_registrar'))
  WITH CHECK (public.get_user_role() IN ('admin', 'ict_officer', 'registry_clerk', 'archivist', 'deputy_registrar'));

CREATE POLICY case_special_metadata_select_authenticated ON public.case_special_metadata
  FOR SELECT TO authenticated USING (true);

CREATE POLICY case_special_metadata_write_staff_admin ON public.case_special_metadata
  FOR ALL TO authenticated
  USING (public.get_user_role() IN ('admin', 'ict_officer', 'registry_clerk', 'archivist', 'deputy_registrar'))
  WITH CHECK (public.get_user_role() IN ('admin', 'ict_officer', 'registry_clerk', 'archivist', 'deputy_registrar'));

WITH case_category_seed AS (
  SELECT *
  FROM jsonb_to_recordset(
    $$[
      {
        "code": "MC_CRIMINAL",
        "court_level": "Magistrates Court",
        "division": "Criminal",
        "category_name": "Magistrates Criminal Case",
        "common_prefix": "MCCR",
        "parent_category": "Criminal",
        "description": "Criminal proceedings filed before the Magistrates' Court.",
        "example_case_number": "MCCR/E377/2025",
        "source_url": "https://new.kenyalaw.org/akn/ke/doc/cause-list-weekly/kemc/2025-10-13/24/eng%402025-10-13/source.pdf",
        "confidence_level": "High",
        "requires_registry_verification": true,
        "archive_indexing_notes": "Index by accused, offence, station, year, and ODPP or police reference.",
        "notes": "Observed in Kenya Law cause-list snippets.",
        "aliases": ["MCCR", "MCCr", "MC CR", "MCCR/E format"]
      },
      {
        "code": "MC_CIVIL",
        "court_level": "Magistrates Court",
        "division": "Civil",
        "category_name": "Magistrates Civil Case",
        "common_prefix": "MCCC",
        "parent_category": "Civil",
        "description": "Civil dispute handled by the Magistrates' Court.",
        "example_case_number": "MCCC E001 of 2024",
        "source_url": "https://new.kenyalaw.org/causelists/",
        "confidence_level": "Medium",
        "requires_registry_verification": true,
        "archive_indexing_notes": "Index by plaintiff, defendant, claim type, amount, station, and year.",
        "notes": "Prefix family is plausible but needs station-level confirmation.",
        "aliases": ["MCCC", "MCCc", "MC Civil", "Civil Case"]
      },
      {
        "code": "MC_TRAFFIC",
        "court_level": "Magistrates Court",
        "division": "Traffic",
        "category_name": "Magistrates Traffic Case",
        "common_prefix": "MCTR",
        "parent_category": "Traffic",
        "description": "Traffic matter before the Magistrates' Court.",
        "example_case_number": "MCTR/E057/2026",
        "source_url": "https://new.kenyalaw.org/akn/ke/doc/cause-list-daily/kemc/2026-06-10/1/eng%402026-06-10",
        "confidence_level": "High",
        "requires_registry_verification": true,
        "archive_indexing_notes": "Index by vehicle registration, traffic offence, station, and year.",
        "notes": "Observed in Kenya Law cause-list snippets.",
        "aliases": ["MCTR", "MCT", "MC Traffic"]
      },
      {
        "code": "MC_SUCCESSION",
        "court_level": "Magistrates Court",
        "division": "Succession",
        "category_name": "Magistrates Succession Cause",
        "common_prefix": "MCSUCC",
        "parent_category": "Succession",
        "description": "Succession matter filed in a Magistrates' Court registry.",
        "example_case_number": "MCSUCC/E254/2025",
        "source_url": "https://new.kenyalaw.org/akn/ke/doc/cause-list-daily/kemc/2026-05-29/1/eng%402026-05-29",
        "confidence_level": "High",
        "requires_registry_verification": true,
        "archive_indexing_notes": "Index by deceased, petitioner, objector, grant status, and filing year.",
        "notes": "Succession is a major archive category, not a civil sub-type.",
        "aliases": ["MCSUCC", "MCSucc", "Succession Cause"]
      },
      {
        "code": "MC_SEXUAL_OFFENCE",
        "court_level": "Magistrates Court",
        "division": "Sexual Offence",
        "category_name": "Magistrates Sexual Offence Case",
        "common_prefix": "MCSO",
        "parent_category": "Criminal",
        "description": "Sexual offence matter handled at magistrate level.",
        "example_case_number": "MCSO/E019/2023",
        "source_url": "https://new.kenyalaw.org/akn/ke/doc/cause-list-daily/kemc/2026-02-18/1/eng%402026-02-18",
        "confidence_level": "Medium",
        "requires_registry_verification": true,
        "archive_indexing_notes": "Add confidentiality controls and protect party names where required.",
        "notes": "Sensitive/protected matter; verify local registry labeling.",
        "aliases": ["MCSO", "MC SO", "Sexual Offence Case"]
      },
      {
        "code": "MC_ELC",
        "court_level": "Magistrates Court",
        "division": "Environment and Land",
        "category_name": "Magistrates ELC-related Matter",
        "common_prefix": "MCELRC",
        "parent_category": "ELC",
        "description": "Environment and Land related matter at magistrate level.",
        "example_case_number": "MCELRC/E008/2025",
        "source_url": "https://new.kenyalaw.org/akn/ke/doc/cause-list-weekly/kemc/2026-02-16/12/eng%402026-02-16/source.pdf",
        "confidence_level": "Medium",
        "requires_registry_verification": true,
        "archive_indexing_notes": "Index by parcel number, land registry, subject property, and station.",
        "notes": "Observed prefix family varies in public materials.",
        "aliases": ["MCELRC", "MCELC", "MELC"]
      },
      {
        "code": "MC_MISC",
        "court_level": "Magistrates Court",
        "division": "Miscellaneous",
        "category_name": "Magistrates Miscellaneous Case",
        "common_prefix": "MCMisc",
        "parent_category": "Miscellaneous",
        "description": "Miscellaneous matter in a magistrate registry.",
        "example_case_number": "MCMisc E012 of 2024",
        "source_url": "https://new.kenyalaw.org/causelists/",
        "confidence_level": "Low",
        "requires_registry_verification": true,
        "archive_indexing_notes": "Use this as a temporary bucket until subtype is confirmed.",
        "notes": "Use with manual registry review.",
        "aliases": ["MCMisc", "MC Misc", "MCMC", "Misc."]
      },
      {
        "code": "MC_CHILDREN",
        "court_level": "Magistrates Court",
        "division": "Children / Family",
        "category_name": "Children's / Maintenance Matter",
        "common_prefix": "varies",
        "parent_category": "Family / Religious",
        "description": "Children or maintenance matter handled in a protected/family registry path.",
        "example_case_number": "CC E004 of 2024",
        "source_url": "https://judiciary.go.ke/",
        "confidence_level": "Low",
        "requires_registry_verification": true,
        "archive_indexing_notes": "Protect minor identities and support confidentiality flags.",
        "notes": "Labeling is registry dependent.",
        "aliases": ["varies", "Child", "Maintenance", "CC"]
      },
      {
        "code": "HC_CIVIL",
        "court_level": "High Court",
        "division": "Civil",
        "category_name": "High Court Civil Case",
        "common_prefix": "HCCC",
        "parent_category": "Civil",
        "description": "Civil matter before the High Court.",
        "example_case_number": "HCCC No. 71 of 2012",
        "source_url": "https://new.kenyalaw.org/akn/ke/judgment/kehc/2014/2807/eng%402014-09-26/source",
        "confidence_level": "High",
        "requires_registry_verification": false,
        "archive_indexing_notes": "Index by parties, claim type, subject matter, station, and year.",
        "notes": "Observed in Kenya Law judgments.",
        "aliases": ["HCCC", "HCCc", "Civil Case"]
      },
      {
        "code": "HC_CRIMINAL",
        "court_level": "High Court",
        "division": "Criminal",
        "category_name": "High Court Criminal Case",
        "common_prefix": "HCR",
        "parent_category": "Criminal",
        "description": "Criminal matter before the High Court.",
        "example_case_number": "HCR NO. 13 OF 2014",
        "source_url": "https://new.kenyalaw.org/akn/ke/judgment/kehc/2014/4664/eng%402014-06-05",
        "confidence_level": "High",
        "requires_registry_verification": false,
        "archive_indexing_notes": "Index by accused, offence, bond/bail, judge, station, and year.",
        "notes": "Observed in Kenya Law judgments.",
        "aliases": ["HCR", "HCCR", "HCr", "Criminal Case"]
      },
      {
        "code": "HC_CRIMINAL_REVISION",
        "court_level": "High Court",
        "division": "Criminal Revision",
        "category_name": "Criminal Revision",
        "common_prefix": "HCR REV",
        "parent_category": "Criminal",
        "description": "Revision of a criminal record or decision.",
        "example_case_number": "HCR REV 5 OF 2017",
        "source_url": "https://new.kenyalaw.org/akn/ke/judgment/kehc/2019/6649/eng%402019-06-13/source",
        "confidence_level": "High",
        "requires_registry_verification": false,
        "archive_indexing_notes": "Index by original case, revision number, judge, and outcome.",
        "notes": "Revision matters are explicitly visible in Kenyan judgment text.",
        "aliases": ["HCR REV", "HCR Rev", "Revision"]
      },
      {
        "code": "HC_CIVIL_APPEAL",
        "court_level": "High Court",
        "division": "Civil Appeal",
        "category_name": "Civil Appeal",
        "common_prefix": "HCA",
        "parent_category": "Appeal",
        "description": "Civil appeal lodged in the High Court.",
        "example_case_number": "HCA No. 48 of 2013",
        "source_url": "https://kenyalaw.org/akn/ke/judgment/keca/2014/616/eng%402014-05-02",
        "confidence_level": "Medium",
        "requires_registry_verification": true,
        "archive_indexing_notes": "Index by appellant, respondent, lower-court origin, and year.",
        "notes": "Prefix naming varies across stations and historical records.",
        "aliases": ["HCA", "HCCA", "Appeal"]
      },
      {
        "code": "HC_CRIMINAL_APPEAL",
        "court_level": "High Court",
        "division": "Criminal Appeal",
        "category_name": "Criminal Appeal",
        "common_prefix": "HCRA",
        "parent_category": "Appeal",
        "description": "Criminal appeal from a lower court decision.",
        "example_case_number": "HCRA No. 25 of 2017",
        "source_url": "https://new.kenyalaw.org/akn/ke/judgment/kehc/2018/2593/eng%402018-10-04",
        "confidence_level": "Medium",
        "requires_registry_verification": true,
        "archive_indexing_notes": "Index by appellant, offence, originating court, and year.",
        "notes": "Historical naming varies.",
        "aliases": ["HCRA", "HCCR(A)", "HCRA"]
      },
      {
        "code": "HC_MISC",
        "court_level": "High Court",
        "division": "Miscellaneous / Judicial Review",
        "category_name": "Miscellaneous Application / Judicial Review",
        "common_prefix": "HCMisc",
        "parent_category": "Miscellaneous",
        "description": "Miscellaneous application, including judicial review paths.",
        "example_case_number": "HCMISC APP No. 99 of 2013",
        "source_url": "https://new.kenyalaw.org/akn/ke/judgment/kehc/2014/6817/eng%402014-03-03/source.pdf",
        "confidence_level": "High",
        "requires_registry_verification": false,
        "archive_indexing_notes": "Capture application subtype, relief sought, station, and year.",
        "notes": "Judicial review appears explicitly in public materials.",
        "aliases": ["HCMisc", "HC Misc", "HCMISC", "JR"]
      },
      {
        "code": "HC_PETITION",
        "court_level": "High Court",
        "division": "Petition",
        "category_name": "Constitutional / Human Rights Petition",
        "common_prefix": "HCPet",
        "parent_category": "Petition",
        "description": "Constitutional or human-rights style petition in the High Court.",
        "example_case_number": "H.C.E.P. No. 1 of 2017",
        "source_url": "https://new.kenyalaw.org/akn/ke/judgment/keca/2018/536/eng%402018-06-14",
        "confidence_level": "Medium",
        "requires_registry_verification": true,
        "archive_indexing_notes": "Index petition subtype, constitutional issue, parties, and judge.",
        "notes": "Election-petition naming is especially inconsistent.",
        "aliases": ["HCPet", "HC Petition", "HCEP", "Petition"]
      },
      {
        "code": "HC_SUCCESSION",
        "court_level": "High Court",
        "division": "Succession / Probate",
        "category_name": "Succession Cause / Probate & Administration",
        "common_prefix": "HCSC",
        "parent_category": "Succession",
        "description": "Probate or succession matter in the High Court.",
        "example_case_number": "HCSC No. 1346 of 2006",
        "source_url": "https://new.kenyalaw.org/akn/ke/judgment/kehc/2015/1680/eng%402015-10-23",
        "confidence_level": "High",
        "requires_registry_verification": false,
        "archive_indexing_notes": "Index by deceased, personal representative, grant status, and assets.",
        "notes": "Public probate/succession search support is explicit.",
        "aliases": ["HCSC", "HCS C", "Probate Cause", "Administration Cause"]
      },
      {
        "code": "HC_ELECTION_PETITION",
        "court_level": "High Court",
        "division": "Election Petition",
        "category_name": "Election Petition",
        "common_prefix": "HCEP",
        "parent_category": "Petition",
        "description": "Election petition filed in or linked to the High Court.",
        "example_case_number": "HCEP No. 1 of 2017",
        "source_url": "https://new.kenyalaw.org/akn/ke/judgment/kehc/2013/5775/eng%402013-06-18",
        "confidence_level": "Medium",
        "requires_registry_verification": true,
        "archive_indexing_notes": "Index by constituency, candidate, election cycle, and outcome.",
        "notes": "Election petition naming should be verified against registry practice.",
        "aliases": ["HCEP", "Election Petition", "HC EP"]
      },
      {
        "code": "ELC_MATTER",
        "court_level": "Related Court",
        "division": "Environment and Land Court",
        "category_name": "ELC Matter",
        "common_prefix": "ELC",
        "parent_category": "Land",
        "description": "Environment and Land Court matter.",
        "example_case_number": "ELC No. 1389 of 2004",
        "source_url": "https://new.kenyalaw.org/akn/ke/judgment/kehc/2021/12692/eng%402021-03-05",
        "confidence_level": "Medium",
        "requires_registry_verification": true,
        "archive_indexing_notes": "Index by parcel number, land registry, and subject property.",
        "notes": "Often appears through legacy and current naming variants.",
        "aliases": ["ELC", "HCC/ELC legacy forms"]
      },
      {
        "code": "ELRC_MATTER",
        "court_level": "Related Court",
        "division": "Employment and Labour Relations Court",
        "category_name": "ELRC Matter",
        "common_prefix": "KEELRC",
        "parent_category": "Labour",
        "description": "Employment and labour relations matter.",
        "example_case_number": "ELRC Nairobi Daily Cause List",
        "source_url": "https://new.kenyalaw.org/causelists/KEELRC/",
        "confidence_level": "High",
        "requires_registry_verification": false,
        "archive_indexing_notes": "Index by claimant, respondent, division, station, and hearing date.",
        "notes": "Public cause lists are broadly available.",
        "aliases": ["KEELRC", "ELRC", "Industrial Court legacy"]
      },
      {
        "code": "SCC_MATTER",
        "court_level": "Related Court",
        "division": "Small Claims Court",
        "category_name": "Small Claims Matter",
        "common_prefix": "SCC",
        "parent_category": "Civil",
        "description": "Small Claims Court matter.",
        "example_case_number": "SCC / Civil Division cause list",
        "source_url": "https://new.kenyalaw.org/causelists/SCC/",
        "confidence_level": "High",
        "requires_registry_verification": false,
        "archive_indexing_notes": "Index by claim amount, parties, station, date, and decision.",
        "notes": "Small Claims is separate from the Magistrates' Court.",
        "aliases": ["SCC", "Small Claims", "SCC Civil Division"]
      },
      {
        "code": "KADHI_MATTER",
        "court_level": "Related Court",
        "division": "Kadhis' Court",
        "category_name": "Kadhis' Matter",
        "common_prefix": "KEKC",
        "parent_category": "Family / Religious",
        "description": "Matter handled in the Kadhis' Court.",
        "example_case_number": "Kadhi's Court cause list",
        "source_url": "https://new.kenyalaw.org/causelists/KEKC/",
        "confidence_level": "High",
        "requires_registry_verification": false,
        "archive_indexing_notes": "Index by family-law topic, inheritance issue, station, and date.",
        "notes": "Public cause-list archive is available.",
        "aliases": ["KEKC", "Kadhi", "Kadhis Court"]
      },
      {
        "code": "TRIBUNAL_MATTER",
        "court_level": "Related Court",
        "division": "Tribunal / Appeal",
        "category_name": "Tribunal Matter",
        "common_prefix": "varies",
        "parent_category": "Tribunal",
        "description": "Tribunal matter or appeal path from a tribunal.",
        "example_case_number": "Tribunal cause list entry",
        "source_url": "https://new.kenyalaw.org/causelists/",
        "confidence_level": "Medium",
        "requires_registry_verification": true,
        "archive_indexing_notes": "Index by original forum, appeal path, division, officer, and date.",
        "notes": "Tribunal naming is highly forum-specific.",
        "aliases": ["varies", "Appeal", "Review", "Tribunal-specific"]
      }
    ]$$::jsonb
  ) AS seed(
    code text,
    court_level text,
    division text,
    category_name text,
    common_prefix text,
    parent_category text,
    description text,
    example_case_number text,
    source_url text,
    confidence_level text,
    requires_registry_verification boolean,
    archive_indexing_notes text,
    notes text,
    aliases jsonb
  )
)
INSERT INTO public.case_categories (
  code,
  court_level,
  division,
  category_name,
  common_prefix,
  parent_category,
  description,
  example_case_number,
  source_url,
  confidence_level,
  requires_registry_verification,
  archive_indexing_notes,
  notes
)
SELECT
  code,
  court_level,
  division,
  category_name,
  common_prefix,
  parent_category,
  description,
  example_case_number,
  source_url,
  confidence_level,
  requires_registry_verification,
  archive_indexing_notes,
  notes
FROM case_category_seed
ON CONFLICT (code) DO UPDATE SET
  court_level = EXCLUDED.court_level,
  division = EXCLUDED.division,
  category_name = EXCLUDED.category_name,
  common_prefix = EXCLUDED.common_prefix,
  parent_category = EXCLUDED.parent_category,
  description = EXCLUDED.description,
  example_case_number = EXCLUDED.example_case_number,
  source_url = EXCLUDED.source_url,
  confidence_level = EXCLUDED.confidence_level,
  requires_registry_verification = EXCLUDED.requires_registry_verification,
  archive_indexing_notes = EXCLUDED.archive_indexing_notes,
  notes = EXCLUDED.notes,
  active = true,
  updated_at = now();

WITH case_category_seed_aliases AS (
  SELECT *
  FROM jsonb_to_recordset(
    $$[
      {
        "code": "MC_CRIMINAL",
        "notes": "Observed in Kenya Law cause-list snippets.",
        "aliases": ["MCCR", "MCCr", "MC CR", "MCCR/E format"]
      },
      {
        "code": "MC_CIVIL",
        "notes": "Prefix family is plausible but needs station-level confirmation.",
        "aliases": ["MCCC", "MCCc", "MC Civil", "Civil Case"]
      },
      {
        "code": "MC_TRAFFIC",
        "notes": "Observed in Kenya Law cause-list snippets.",
        "aliases": ["MCTR", "MCT", "MC Traffic"]
      },
      {
        "code": "MC_SUCCESSION",
        "notes": "Succession is a major archive category, not a civil sub-type.",
        "aliases": ["MCSUCC", "MCSucc", "Succession Cause"]
      },
      {
        "code": "MC_SEXUAL_OFFENCE",
        "notes": "Sensitive/protected matter; verify local registry labeling.",
        "aliases": ["MCSO", "MC SO", "Sexual Offence Case"]
      },
      {
        "code": "MC_ELC",
        "notes": "Observed prefix family varies in public materials.",
        "aliases": ["MCELRC", "MCELC", "MELC"]
      },
      {
        "code": "MC_MISC",
        "notes": "Use with manual registry review.",
        "aliases": ["MCMisc", "MC Misc", "MCMC", "Misc."]
      },
      {
        "code": "MC_CHILDREN",
        "notes": "Labeling is registry dependent.",
        "aliases": ["varies", "Child", "Maintenance", "CC"]
      },
      {
        "code": "HC_CIVIL",
        "notes": "Observed in Kenya Law judgments.",
        "aliases": ["HCCC", "HCCc", "Civil Case"]
      },
      {
        "code": "HC_CRIMINAL",
        "notes": "Observed in Kenya Law judgments.",
        "aliases": ["HCR", "HCCR", "HCr", "Criminal Case"]
      },
      {
        "code": "HC_CRIMINAL_REVISION",
        "notes": "Revision matters are explicitly visible in Kenyan judgment text.",
        "aliases": ["HCR REV", "HCR Rev", "Revision"]
      },
      {
        "code": "HC_CIVIL_APPEAL",
        "notes": "Prefix naming varies across stations and historical records.",
        "aliases": ["HCA", "HCCA", "Appeal"]
      },
      {
        "code": "HC_CRIMINAL_APPEAL",
        "notes": "Historical naming varies.",
        "aliases": ["HCRA", "HCCR(A)", "HCRA"]
      },
      {
        "code": "HC_MISC",
        "notes": "Judicial review appears explicitly in public materials.",
        "aliases": ["HCMisc", "HC Misc", "HCMISC", "JR"]
      },
      {
        "code": "HC_PETITION",
        "notes": "Election-petition naming is especially inconsistent.",
        "aliases": ["HCPet", "HC Petition", "HCEP", "Petition"]
      },
      {
        "code": "HC_SUCCESSION",
        "notes": "Public probate/succession search support is explicit.",
        "aliases": ["HCSC", "HCS C", "Probate Cause", "Administration Cause"]
      },
      {
        "code": "HC_ELECTION_PETITION",
        "notes": "Election petition naming should be verified against registry practice.",
        "aliases": ["HCEP", "Election Petition", "HC EP"]
      },
      {
        "code": "ELC_MATTER",
        "notes": "Often appears through legacy and current naming variants.",
        "aliases": ["ELC", "HCC/ELC legacy forms"]
      },
      {
        "code": "ELRC_MATTER",
        "notes": "Public cause lists are broadly available.",
        "aliases": ["KEELRC", "ELRC", "Industrial Court legacy"]
      },
      {
        "code": "SCC_MATTER",
        "notes": "Small Claims is separate from the Magistrates' Court.",
        "aliases": ["SCC", "Small Claims", "SCC Civil Division"]
      },
      {
        "code": "KADHI_MATTER",
        "notes": "Public cause-list archive is available.",
        "aliases": ["KEKC", "Kadhi", "Kadhis Court"]
      },
      {
        "code": "TRIBUNAL_MATTER",
        "notes": "Tribunal naming is highly forum-specific.",
        "aliases": ["varies", "Appeal", "Review", "Tribunal-specific"]
      }
    ]$$::jsonb
  ) AS seed(
    code text,
    notes text,
    aliases jsonb
  )
)
INSERT INTO public.case_category_aliases (case_category_code, alias, alias_type, notes)
SELECT
  seed.code,
  alias.value,
  'prefix',
  seed.notes
FROM case_category_seed_aliases seed
CROSS JOIN LATERAL jsonb_array_elements_text(seed.aliases) AS alias(value)
ON CONFLICT (case_category_code, alias) DO NOTHING;

INSERT INTO public.case_categories (
  code,
  court_level,
  division,
  category_name,
  common_prefix,
  parent_category,
  description,
  example_case_number,
  source_url,
  confidence_level,
  requires_registry_verification,
  archive_indexing_notes,
  notes
)
VALUES
  ('HC_FAMILY', 'High Court', 'Family', 'High Court Family Case', 'FAM', 'Family', 'Family matter before the High Court.', 'FAM/089/2025', 'https://highcourt.judiciary.go.ke/court-registry/', 'High', false, 'Index by parties, child references, maintenance orders, and registry.', 'App-critical canonical family category.'),
  ('HC_COMMERCIAL', 'High Court', 'Commercial', 'High Court Commercial Case', 'COM', 'Commercial', 'Commercial matter before the High Court.', 'COM/234/2024', 'https://highcourt.judiciary.go.ke/court-registry/', 'High', false, 'Index by parties, claim amount, subject matter, and registry.', 'App-critical canonical commercial category.'),
  ('HC_CONSTITUTIONAL', 'High Court', 'Constitutional', 'High Court Constitutional Case', 'CON', 'Constitutional', 'Constitutional matter before the High Court.', 'CON/012/2025', 'https://highcourt.judiciary.go.ke/court-registry/', 'High', false, 'Index by constitutional issue, parties, and registry.', 'App-critical canonical constitutional category.'),
  ('HC_PROBATE', 'High Court', 'Probate / Succession', 'High Court Probate Cause', 'PRO', 'Probate', 'Probate and succession matter before the High Court.', 'PRO/078/2022', 'https://efiling.court.go.ke/auth/probate_matters', 'High', false, 'Index by deceased, personal representative, grant status, and assets.', 'App-critical canonical probate category.')
ON CONFLICT (code) DO UPDATE SET
  court_level = EXCLUDED.court_level,
  division = EXCLUDED.division,
  category_name = EXCLUDED.category_name,
  common_prefix = EXCLUDED.common_prefix,
  parent_category = EXCLUDED.parent_category,
  description = EXCLUDED.description,
  example_case_number = EXCLUDED.example_case_number,
  source_url = EXCLUDED.source_url,
  confidence_level = EXCLUDED.confidence_level,
  requires_registry_verification = EXCLUDED.requires_registry_verification,
  archive_indexing_notes = EXCLUDED.archive_indexing_notes,
  notes = EXCLUDED.notes,
  active = true,
  updated_at = now();

INSERT INTO public.court_stations (code, station_name, county, court_rank)
VALUES
  ('KBT', 'Kibera', 'Nairobi', 'High Court Registry'),
  ('NRB', 'Nairobi', 'Nairobi', 'High Court Registry'),
  ('MSA', 'Mombasa', 'Mombasa', 'Magistrates Registry'),
  ('KSM', 'Kisumu', 'Kisumu', 'Magistrates Registry'),
  ('NKR', 'Nakuru', 'Nakuru', 'Magistrates Registry')
ON CONFLICT (code) DO UPDATE SET
  station_name = EXCLUDED.station_name,
  county = EXCLUDED.county,
  court_rank = EXCLUDED.court_rank,
  active = true;

UPDATE public.cases
SET case_category_code = CASE
  WHEN lower(coalesce(case_type, '')) = 'criminal' AND lower(coalesce(court_division, '')) LIKE '%magistrate%' THEN 'MC_CRIMINAL'
  WHEN lower(coalesce(case_type, '')) = 'criminal' THEN 'HC_CRIMINAL'
  WHEN lower(coalesce(case_type, '')) = 'civil' AND lower(coalesce(court_division, '')) LIKE '%magistrate%' THEN 'MC_CIVIL'
  WHEN lower(coalesce(case_type, '')) = 'civil' THEN 'HC_CIVIL'
  WHEN lower(coalesce(case_type, '')) = 'traffic' THEN 'MC_TRAFFIC'
  WHEN lower(coalesce(case_type, '')) = 'succession' THEN 'MC_SUCCESSION'
  WHEN lower(coalesce(case_type, '')) = 'elc' AND lower(coalesce(court_division, '')) LIKE '%magistrate%' THEN 'MC_ELC'
  WHEN lower(coalesce(case_type, '')) = 'elc' THEN 'ELC_MATTER'
  WHEN lower(coalesce(case_type, '')) = 'family' THEN 'HC_FAMILY'
  WHEN lower(coalesce(case_type, '')) = 'commercial' THEN 'HC_COMMERCIAL'
  WHEN lower(coalesce(case_type, '')) = 'constitutional' THEN 'HC_CONSTITUTIONAL'
  WHEN lower(coalesce(case_type, '')) = 'probate' THEN 'HC_PROBATE'
  ELSE case_category_code
END
WHERE coalesce(case_category_code, '') = '';

DROP FUNCTION IF EXISTS public.lookup_case_for_scan(text);
DROP FUNCTION IF EXISTS public.list_archive_stored_cases(integer, integer);

CREATE OR REPLACE FUNCTION public.lookup_case_for_scan(scan_code text)
RETURNS TABLE (
  id uuid,
  case_number text,
  title text,
  court text,
  status public.case_status,
  filed_date date,
  closed_date date,
  description text,
  case_type text,
  case_category_code text,
  court_station text,
  court_division text,
  year integer,
  plaintiff text,
  defendant text,
  judge text,
  archive_code text,
  shelf_location text,
  location_id uuid,
  qr_barcode text,
  notes text,
  is_missing boolean,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  matched_by text
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH input AS (
    SELECT lower(trim(scan_code)) AS code
  )
  SELECT
    c.id,
    c.case_number,
    c.title,
    c.court,
    c.status,
    c.filed_date,
    c.closed_date,
    c.description,
    c.case_type,
    c.case_category_code,
    c.court_station,
    c.court_division,
    c.year,
    c.plaintiff,
    c.defendant,
    c.judge,
    c.archive_code,
    c.shelf_location,
    c.location_id,
    c.qr_barcode,
    c.notes,
    c.is_missing,
    c.created_by,
    c.created_at,
    c.updated_at,
    CASE
      WHEN lower(c.case_number) = input.code THEN 'case_number'
      WHEN lower(c.qr_barcode) = input.code THEN 'qr_barcode'
      ELSE 'archive_code'
    END AS matched_by
  FROM public.cases c
  CROSS JOIN input
  WHERE input.code <> ''
    AND (
      lower(c.case_number) = input.code
      OR lower(c.qr_barcode) = input.code
      OR lower(c.archive_code) = input.code
    )
  ORDER BY
    CASE
      WHEN lower(c.case_number) = input.code THEN 1
      WHEN lower(c.qr_barcode) = input.code THEN 2
      ELSE 3
    END,
    c.updated_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.search_cases(
  search_query text,
  result_limit integer DEFAULT 25,
  result_offset integer DEFAULT 0
)
RETURNS SETOF public.cases
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH input AS (
    SELECT nullif(trim(search_query), '') AS q
  )
  SELECT c.*
  FROM public.cases c
  LEFT JOIN public.case_categories cc ON cc.code = c.case_category_code
  CROSS JOIN input
  WHERE input.q IS NULL
    OR to_tsvector(
      'english',
      coalesce(c.case_number, '') || ' ' ||
      coalesce(c.title, '') || ' ' ||
      coalesce(c.description, '') || ' ' ||
      coalesce(c.plaintiff, '') || ' ' ||
      coalesce(c.defendant, '') || ' ' ||
      coalesce(c.case_type, '') || ' ' ||
      coalesce(c.case_category_code, '') || ' ' ||
      coalesce(cc.category_name, '')
    ) @@ plainto_tsquery('english', input.q)
    OR c.case_number ILIKE '%' || input.q || '%'
    OR c.title ILIKE '%' || input.q || '%'
    OR c.description ILIKE '%' || input.q || '%'
    OR c.plaintiff ILIKE '%' || input.q || '%'
    OR c.defendant ILIKE '%' || input.q || '%'
    OR c.case_type ILIKE '%' || input.q || '%'
    OR c.case_category_code ILIKE '%' || input.q || '%'
    OR cc.category_name ILIKE '%' || input.q || '%'
    OR EXISTS (
      SELECT 1
      FROM public.case_category_aliases a
      WHERE a.case_category_code = cc.code
        AND a.alias ILIKE '%' || input.q || '%'
    )
    OR EXISTS (
      SELECT 1
      FROM public.case_parties p
      WHERE p.case_id = c.id
        AND (
          p.party_name ILIKE '%' || input.q || '%'
          OR coalesce(p.normalized_party_name, '') ILIKE '%' || input.q || '%'
        )
    )
  ORDER BY c.created_at DESC
  LIMIT LEAST(500, GREATEST(1, COALESCE(NULLIF(result_limit, 0), 25)))
  OFFSET GREATEST(COALESCE(result_offset, 0), 0);
$$;

CREATE OR REPLACE FUNCTION public.search_cases_count(search_query text)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH input AS (
    SELECT nullif(trim(search_query), '') AS q
  )
  SELECT count(*)::bigint
  FROM public.cases c
  LEFT JOIN public.case_categories cc ON cc.code = c.case_category_code
  CROSS JOIN input
  WHERE input.q IS NULL
    OR to_tsvector(
      'english',
      coalesce(c.case_number, '') || ' ' ||
      coalesce(c.title, '') || ' ' ||
      coalesce(c.description, '') || ' ' ||
      coalesce(c.plaintiff, '') || ' ' ||
      coalesce(c.defendant, '') || ' ' ||
      coalesce(c.case_type, '') || ' ' ||
      coalesce(c.case_category_code, '') || ' ' ||
      coalesce(cc.category_name, '')
    ) @@ plainto_tsquery('english', input.q)
    OR c.case_number ILIKE '%' || input.q || '%'
    OR c.title ILIKE '%' || input.q || '%'
    OR c.description ILIKE '%' || input.q || '%'
    OR c.plaintiff ILIKE '%' || input.q || '%'
    OR c.defendant ILIKE '%' || input.q || '%'
    OR c.case_type ILIKE '%' || input.q || '%'
    OR c.case_category_code ILIKE '%' || input.q || '%'
    OR cc.category_name ILIKE '%' || input.q || '%'
    OR EXISTS (
      SELECT 1
      FROM public.case_category_aliases a
      WHERE a.case_category_code = cc.code
        AND a.alias ILIKE '%' || input.q || '%'
    )
    OR EXISTS (
      SELECT 1
      FROM public.case_parties p
      WHERE p.case_id = c.id
        AND (
          p.party_name ILIKE '%' || input.q || '%'
          OR coalesce(p.normalized_party_name, '') ILIKE '%' || input.q || '%'
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.list_archive_stored_cases(
  result_limit integer DEFAULT 300,
  result_offset integer DEFAULT 0
)
RETURNS TABLE (
  case_id uuid,
  case_number text,
  title text,
  case_type text,
  case_category_code text,
  case_category_name text,
  court_station text,
  court_division text,
  year integer,
  plaintiff text,
  defendant text,
  judge text,
  status public.case_status,
  archive_code text,
  shelf_location text,
  filed_date date,
  storage_path text,
  matching_total bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH capped AS (
    SELECT
      c.id AS lid,
      c.case_number AS l_case_number,
      c.title AS l_title,
      c.case_type AS l_case_type,
      c.case_category_code AS l_case_category_code,
      cc.category_name AS l_case_category_name,
      c.court_station AS l_court_station,
      c.court_division AS l_court_division,
      c.year AS l_year,
      c.plaintiff AS l_plaintiff,
      c.defendant AS l_defendant,
      c.judge AS l_judge,
      c.status AS l_status,
      c.archive_code AS l_archive_code,
      c.shelf_location AS l_shelf_location,
      c.filed_date AS l_filed_date,
      public.archive_location_display_path(c.location_id) AS l_storage_path,
      count(*) OVER () AS l_matching_total
    FROM public.cases c
    LEFT JOIN public.case_categories cc ON cc.code = c.case_category_code
    WHERE c.location_id IS NOT NULL
    ORDER BY c.case_number ASC
    LIMIT LEAST(500, GREATEST(1, COALESCE(NULLIF(result_limit, 0), 300)))
    OFFSET GREATEST(COALESCE(result_offset, 0), 0)
  )
  SELECT
    capped.lid,
    capped.l_case_number,
    capped.l_title,
    capped.l_case_type,
    capped.l_case_category_code,
    capped.l_case_category_name,
    capped.l_court_station,
    capped.l_court_division,
    capped.l_year,
    capped.l_plaintiff,
    capped.l_defendant,
    capped.l_judge,
    capped.l_status,
    capped.l_archive_code,
    capped.l_shelf_location,
    capped.l_filed_date,
    capped.l_storage_path,
    capped.l_matching_total
  FROM capped;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_case_for_scan(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_case_for_scan(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.search_cases(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_cases(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.search_cases_count(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_cases_count(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.list_archive_stored_cases(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_archive_stored_cases(integer, integer) TO service_role;

GRANT SELECT ON TABLE public.case_categories TO authenticated;
GRANT SELECT ON TABLE public.case_category_aliases TO authenticated;
GRANT SELECT ON TABLE public.court_stations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.case_parties TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.case_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.case_special_metadata TO authenticated;
