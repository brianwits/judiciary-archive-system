-- Authoritative High Court and Magistrate Court case-type taxonomy.

CREATE TABLE public.case_types (
  case_type_id integer PRIMARY KEY,
  code text NOT NULL,
  case_type text NOT NULL,
  full_label text NOT NULL,
  court_level text NOT NULL CHECK (court_level IN ('High Court', 'Magistrate Court')),
  case_family text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT case_types_code_name_unique UNIQUE (code, case_type),
  CONSTRAINT case_types_full_label_consistent CHECK (full_label = code || ' - ' || case_type)
);

CREATE INDEX idx_case_types_court_family
  ON public.case_types (court_level, case_family, case_type_id)
  WHERE active;

CREATE INDEX idx_case_types_code
  ON public.case_types (code);

ALTER TABLE public.case_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY case_types_select_authenticated
  ON public.case_types FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.case_types TO authenticated, service_role;

INSERT INTO public.case_types (
  case_type_id, code, case_type, full_label, court_level, case_family
)
VALUES
  (31, 'MCCC', 'Magistrate Court Civil Case', 'MCCC - Magistrate Court Civil Case', 'Magistrate Court', 'Civil'),
  (32, 'MCCCMISC', 'Magistrate Court Civil Miscellaneous', 'MCCCMISC - Magistrate Court Civil Miscellaneous', 'Magistrate Court', 'Civil'),
  (33, 'MCCR', 'Magistrate Court Criminal Case', 'MCCR - Magistrate Court Criminal Case', 'Magistrate Court', 'Criminal'),
  (34, 'MCCRMISC', 'Magistrate Court Criminal Miscellaneous', 'MCCRMISC - Magistrate Court Criminal Miscellaneous', 'Magistrate Court', 'Criminal'),
  (35, 'MCTR', 'Magistrate Court Traffic Case', 'MCTR - Magistrate Court Traffic Case', 'Magistrate Court', 'Traffic'),
  (37, 'MCSUCC', 'Magistrate Court Succession Matter', 'MCSUCC - Magistrate Court Succession Matter', 'Magistrate Court', 'Succession & Probate'),
  (38, 'MCP&CPS', 'Magistrate Court Protection and Care - Police Station', 'MCP&CPS - Magistrate Court Protection and Care - Police Station', 'Magistrate Court', 'Children & Protection'),
  (40, 'MCCHCC', 'Magistrate Court Civil Cases - Children', 'MCCHCC - Magistrate Court Civil Cases - Children', 'Magistrate Court', 'Children & Protection'),
  (42, 'MCAC', 'Magistrate Court Anti-Corruption', 'MCAC - Magistrate Court Anti-Corruption', 'Magistrate Court', 'Anti-Corruption & Economic Crimes'),
  (61, 'MCCOMMSU', 'Magistrate Court Commercial Suits', 'MCCOMMSU - Magistrate Court Commercial Suits', 'Magistrate Court', 'Commercial'),
  (62, 'MCDC', 'Magistrate Court Divorce Case', 'MCDC - Magistrate Court Divorce Case', 'Magistrate Court', 'Family'),
  (64, 'MCRTC', 'Magistrate Court Rent Tribunal Cause', 'MCRTC - Magistrate Court Rent Tribunal Cause', 'Magistrate Court', 'Tribunal & Regulatory'),
  (70, 'MCACMISC', 'Magistrate Court Anti-Corruption Miscellaneous', 'MCACMISC - Magistrate Court Anti-Corruption Miscellaneous', 'Magistrate Court', 'Anti-Corruption & Economic Crimes'),
  (71, 'MCINQ', 'Inquest', 'MCINQ - Inquest', 'Magistrate Court', 'Criminal'),
  (72, 'MCSO', 'Sexual Offences', 'MCSO - Sexual Offences', 'Magistrate Court', 'Criminal'),
  (73, 'MCEO', 'Election Offences', 'MCEO - Election Offences', 'Magistrate Court', 'Election'),
  (83, 'MCP&CCO', 'Magistrate Court Protection and Care-Children Office', 'MCP&CCO - Magistrate Court Protection and Care-Children Office', 'Magistrate Court', 'Children & Protection'),
  (84, 'MCCHCR', 'Magistrate Court Criminal - Children', 'MCCHCR - Magistrate Court Criminal - Children', 'Magistrate Court', 'Children & Protection'),
  (92, 'MCWC', 'Magistrate Court Workmens Compensation', 'MCWC - Magistrate Court Workmens Compensation', 'Magistrate Court', 'Employment & Labour'),
  (93, 'MCELRC', 'Magistrate Court Employment and Labour Relations', 'MCELRC - Magistrate Court Employment and Labour Relations', 'Magistrate Court', 'Employment & Labour'),
  (95, 'MCELC', 'Magistrate Court Environment and Land Case', 'MCELC - Magistrate Court Environment and Land Case', 'Magistrate Court', 'Environment & Land'),
  (113, 'MCELCMISC', 'Environmental and Land Misc', 'MCELCMISC - Environmental and Land Misc', 'Magistrate Court', 'Environment & Land'),
  (116, 'MCPCR', 'Magistrate Court Petty Criminal', 'MCPCR - Magistrate Court Petty Criminal', 'Magistrate Court', 'Criminal'),
  (128, 'MCEP', 'Election Petition', 'MCEP - Election Petition', 'Magistrate Court', 'Election'),
  (178, 'MCSUCCMISC', 'Magistrate Court Succession Miscellaneous', 'MCSUCCMISC - Magistrate Court Succession Miscellaneous', 'Magistrate Court', 'Succession & Probate'),
  (184, 'MCCBLC', 'Magistrate Court County By- Laws Case', 'MCCBLC - Magistrate Court County By- Laws Case', 'Magistrate Court', 'Tribunal & Regulatory'),
  (185, 'MCPPC', 'Magistrate Court Physical Planning Case', 'MCPPC - Magistrate Court Physical Planning Case', 'Magistrate Court', 'Tribunal & Regulatory'),
  (186, 'MCPHC', 'Magistrate Court Public Health Case', 'MCPHC - Magistrate Court Public Health Case', 'Magistrate Court', 'Tribunal & Regulatory'),
  (229, 'MCCHSO', 'Sexual Offence - Children', 'MCCHSO - Sexual Offence - Children', 'Magistrate Court', 'Children & Protection'),
  (288, 'MCCGCR', 'Magistrates Court County Government Criminal Matters', 'MCCGCR - Magistrates Court County Government Criminal Matters', 'Magistrate Court', 'Criminal'),
  (289, 'MCCGCRMISC', 'Magistrates Court County Government Criminal Miscellaneous', 'MCCGCRMISC - Magistrates Court County Government Criminal Miscellaneous', 'Magistrate Court', 'Criminal'),
  (296, 'MGJCCR', 'Magistrates Gender Justice Criminal Case', 'MGJCCR - Magistrates Gender Justice Criminal Case', 'Magistrate Court', 'Gender Justice'),
  (297, 'MGJCC', 'Magistrates Gender Justice Civil Case', 'MGJCC - Magistrates Gender Justice Civil Case', 'Magistrate Court', 'Gender Justice'),
  (301, 'MCELRCMISC', 'Employment and Labour Miscellaneous', 'MCELRCMISC - Employment and Labour Miscellaneous', 'Magistrate Court', 'Employment & Labour'),
  (9, 'HCCRC', 'High Court Criminal Case', 'HCCRC - High Court Criminal Case', 'High Court', 'Criminal'),
  (10, 'HCCRMISCAPPL', 'High Court Criminal Miscellaneous Application', 'HCCRMISCAPPL - High Court Criminal Miscellaneous Application', 'High Court', 'Criminal'),
  (11, 'HCCRA', 'High Court Criminal Appeal', 'HCCRA - High Court Criminal Appeal', 'High Court', 'Criminal'),
  (12, 'HCCRREV', 'High Court Criminal Revision', 'HCCRREV - High Court Criminal Revision', 'High Court', 'Criminal'),
  (13, 'HCCOMM', 'High Court Commercial Suit', 'HCCOMM - High Court Commercial Suit', 'High Court', 'Commercial'),
  (14, 'HCCOMMMISC', 'High Court Commercial Miscellaneous', 'HCCOMMMISC - High Court Commercial Miscellaneous', 'High Court', 'Commercial'),
  (15, 'HCCOMMINP', 'High Court Commercial Insolvency Notice Petition', 'HCCOMMINP - High Court Commercial Insolvency Notice Petition', 'High Court', 'Commercial'),
  (16, 'HCCOMMITA', 'High Court Commercial Income Tax Appeal', 'HCCOMMITA - High Court Commercial Income Tax Appeal', 'High Court', 'Commercial'),
  (17, 'HCCOMMIC', 'High Court Commercial Insolvency Cause', 'HCCOMMIC - High Court Commercial Insolvency Cause', 'High Court', 'Commercial'),
  (18, 'HCCOMMIN', 'High Court Commercial Insolvency Notice', 'HCCOMMIN - High Court Commercial Insolvency Notice', 'High Court', 'Commercial'),
  (19, 'HCCC', 'High Court Civil Case', 'HCCC - High Court Civil Case', 'High Court', 'Civil'),
  (20, 'HCCCMISC', 'High Court Civil Case Miscellaneous', 'HCCCMISC - High Court Civil Case Miscellaneous', 'High Court', 'Civil'),
  (21, 'HCCA', 'High Court Civil Appeal', 'HCCA - High Court Civil Appeal', 'High Court', 'Civil'),
  (22, 'HCFA', 'High Court Family Appeal', 'HCFA - High Court Family Appeal', 'High Court', 'Family'),
  (23, 'HCFMISC', 'High Court Family Miscellaneous', 'HCFMISC - High Court Family Miscellaneous', 'High Court', 'Family'),
  (24, 'HCFP&A', 'High Court Family Probate and Administration', 'HCFP&A - High Court Family Probate and Administration', 'High Court', 'Succession & Probate'),
  (25, 'HCFDC', 'High Court Family Divorce Cause', 'HCFDC - High Court Family Divorce Cause', 'High Court', 'Family'),
  (26, 'HCFADOP', 'High Court Family Adoption', 'HCFADOP - High Court Family Adoption', 'High Court', 'Family'),
  (29, 'HCJR', 'High Court Judicial Review', 'HCJR - High Court Judicial Review', 'High Court', 'Judicial Review'),
  (30, 'HCJRMISC', 'High Court Judicial Review Miscellaneous', 'HCJRMISC - High Court Judicial Review Miscellaneous', 'High Court', 'Judicial Review'),
  (43, 'HCACECMISC', 'High Court Anti-corruption and Economic Crimes Miscellaneous', 'HCACECMISC - High Court Anti-corruption and Economic Crimes Miscellaneous', 'High Court', 'Anti-Corruption & Economic Crimes'),
  (58, 'HCCHRPET', 'High Court Constitution and Human Rights Petitions (Civil)', 'HCCHRPET - High Court Constitution and Human Rights Petitions (Civil)', 'High Court', 'Constitutional & Human Rights'),
  (59, 'HCCHRPETMISC', 'High Court Constitution and Human Rights Petitions Miscellaneous', 'HCCHRPETMISC - High Court Constitution and Human Rights Petitions Miscellaneous', 'High Court', 'Constitutional & Human Rights'),
  (76, 'HCJRELC', 'High Court Judicial Review ELC', 'HCJRELC - High Court Judicial Review ELC', 'High Court', 'Judicial Review'),
  (80, 'HCCHREPA', 'High Court Constitution and Human Rights Election Petition Appeal', 'HCCHREPA - High Court Constitution and Human Rights Election Petition Appeal', 'High Court', 'Election'),
  (81, 'HCCHRMEPA', 'High Court Constitution and Human Rights Miscellaneous Election Petition Appeal(MEPA)', 'HCCHRMEPA - High Court Constitution and Human Rights Miscellaneous Election Petition Appeal(MEPA)', 'High Court', 'Election'),
  (89, 'HCCHREP', 'High Court Constitution and Human Rights Election Petition', 'HCCHREP - High Court Constitution and Human Rights Election Petition', 'High Court', 'Election'),
  (108, 'HCFOS', 'High Court Family Originating Summons', 'HCFOS - High Court Family Originating Summons', 'High Court', 'Family'),
  (226, 'HCACECJR', 'High Court Anticorruption and Economic Crimes Judicial Review', 'HCACECJR - High Court Anticorruption and Economic Crimes Judicial Review', 'High Court', 'Anti-Corruption & Economic Crimes'),
  (247, 'HCCOMMARB', 'High Court Commercial Arbitration', 'HCCOMMARB - High Court Commercial Arbitration', 'High Court', 'Commercial'),
  (258, 'HCCHRPET', 'High Court Constitution and Human Rights Petitions (Criminal)', 'HCCHRPET - High Court Constitution and Human Rights Petitions (Criminal)', 'High Court', 'Constitutional & Human Rights'),
  (298, 'HCGJCR', 'High Court Gender Justice Criminal Case', 'HCGJCR - High Court Gender Justice Criminal Case', 'High Court', 'Gender Justice'),
  (299, 'HCGJCRA', 'High Court Gender Justice Criminal Appeal', 'HCGJCRA - High Court Gender Justice Criminal Appeal', 'High Court', 'Gender Justice'),
  (300, 'HCGJCA', 'High Court Gender Justice Civil Appeal', 'HCGJCA - High Court Gender Justice Civil Appeal', 'High Court', 'Gender Justice'),
  (343, 'HCCSCA', 'High Court Civil Small Claims Appeal', 'HCCSCA - High Court Civil Small Claims Appeal', 'High Court', 'Civil')
ON CONFLICT (case_type_id) DO UPDATE SET
  code = EXCLUDED.code,
  case_type = EXCLUDED.case_type,
  full_label = EXCLUDED.full_label,
  court_level = EXCLUDED.court_level,
  case_family = EXCLUDED.case_family,
  active = true,
  updated_at = now();

ALTER TABLE public.cases
  ADD COLUMN case_type_id integer REFERENCES public.case_types(case_type_id) ON DELETE RESTRICT,
  ADD COLUMN case_family text;

CREATE INDEX idx_cases_case_type_created
  ON public.cases (case_type_id, created_at DESC)
  WHERE case_type_id IS NOT NULL;

CREATE INDEX idx_cases_family_filed_date
  ON public.cases (case_family, filed_date DESC)
  WHERE case_family IS NOT NULL;

-- Preserve the legacy broad type as the initial family value.
UPDATE public.cases
SET case_family = NULLIF(trim(case_type), '')
WHERE case_family IS NULL;

-- Only exact, unambiguous legacy categories are classified automatically.
UPDATE public.cases
SET case_type_id = CASE case_category_code
  WHEN 'HC_CRIMINAL' THEN 9
  WHEN 'HC_COMMERCIAL' THEN 13
  WHEN 'HC_CIVIL' THEN 19
  WHEN 'HC_CIVIL_APPEAL' THEN 21
  WHEN 'HC_CRIMINAL_APPEAL' THEN 11
  WHEN 'HC_CRIMINAL_REVISION' THEN 12
  WHEN 'MC_CRIMINAL' THEN 33
  WHEN 'MC_CIVIL' THEN 31
  WHEN 'MC_TRAFFIC' THEN 35
  WHEN 'MC_SUCCESSION' THEN 37
  WHEN 'MC_SEXUAL_OFFENCE' THEN 72
  ELSE case_type_id
END
WHERE case_type_id IS NULL;

-- Prefer an exact authoritative prefix when the legacy category is not decisive.
WITH prefix_match AS (
  SELECT c.id, min(ct.case_type_id) AS case_type_id
  FROM public.cases c
  JOIN public.case_types ct
    ON upper(regexp_replace(split_part(c.case_number, '/', 1), '[^A-Z0-9&]', '', 'g')) =
       upper(regexp_replace(ct.code, '[^A-Z0-9&]', '', 'g'))
  WHERE c.case_type_id IS NULL
  GROUP BY c.id
  HAVING count(*) = 1
)
UPDATE public.cases c
SET case_type_id = prefix_match.case_type_id
FROM prefix_match
WHERE c.id = prefix_match.id;

UPDATE public.cases c
SET case_family = ct.case_family
FROM public.case_types ct
WHERE ct.case_type_id = c.case_type_id;

-- High/Magistrate legacy categories are superseded; related-court definitions remain active.
UPDATE public.case_categories
SET active = false, updated_at = now()
WHERE court_level IN ('High Court', 'Magistrates Court');

COMMENT ON COLUMN public.cases.case_type IS
  'Deprecated broad family retained for compatibility; use case_family and case_type_id.';
COMMENT ON COLUMN public.cases.case_category_code IS
  'Legacy category retained for related-court and migration compatibility.';

-- Filtered operational and taxonomy report in one database round-trip.
DROP FUNCTION IF EXISTS public.fetch_report_data();

CREATE FUNCTION public.fetch_report_data(
  p_from date DEFAULT NULL,
  p_to date DEFAULT NULL,
  p_court_level text DEFAULT NULL,
  p_case_type_id integer DEFAULT NULL,
  p_case_family text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH bounds AS (
    SELECT
      COALESCE(p_from, (current_date - INTERVAL '24 months')::date) AS from_date,
      COALESCE(p_to, current_date) AS to_date
  ),
  case_data AS MATERIALIZED (
    SELECT
      c.id,
      c.created_at,
      c.filed_date,
      c.status,
      c.is_missing,
      c.court_division,
      c.case_type_id,
      COALESCE(ct.case_family, c.case_family, c.case_type, 'Unclassified') AS case_family,
      ct.code,
      ct.case_type AS case_type_name,
      ct.full_label,
      ct.court_level
    FROM public.cases c
    LEFT JOIN public.case_types ct ON ct.case_type_id = c.case_type_id
    CROSS JOIN bounds b
    WHERE COALESCE(c.filed_date, c.created_at::date) BETWEEN b.from_date AND b.to_date
      AND (p_court_level IS NULL OR ct.court_level = p_court_level)
      AND (p_case_type_id IS NULL OR c.case_type_id = p_case_type_id)
      AND (p_case_family IS NULL OR COALESCE(ct.case_family, c.case_family, c.case_type) = p_case_family)
  ),
  movement_data AS MATERIALIZED (
    SELECT m.created_at, m.status, m.expected_return_date, m.actual_return_date, m.case_id
    FROM public.file_movements m
    JOIN case_data c ON c.id = m.case_id
    CROSS JOIN bounds b
    WHERE m.created_at::date BETWEEN b.from_date AND b.to_date
  ),
  doc_data AS MATERIALIZED (
    SELECT d.created_at
    FROM public.documents d
    JOIN case_data c ON c.id = d.case_id
    CROSS JOIN bounds b
    WHERE d.created_at::date BETWEEN b.from_date AND b.to_date
  ),
  monthly_agg AS (
    SELECT
      to_char(created_at, 'Mon') AS month_label,
      to_char(created_at, 'YYYY-MM') AS month_key,
      count(*)::int AS total,
      count(*) FILTER (WHERE is_missing OR status = 'missing')::int AS missing_count
    FROM case_data
    GROUP BY 1, 2
  ),
  recent_months AS (
    SELECT * FROM monthly_agg ORDER BY month_key DESC LIMIT 6
  ),
  archive_growth AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object('month', month_label, 'count', running_total)
      ORDER BY month_key
    ), '[]'::jsonb) AS data
    FROM (
      SELECT month_key, month_label,
        sum(total) OVER (ORDER BY month_key ROWS UNBOUNDED PRECEDING)::int AS running_total
      FROM monthly_agg
    ) totals
    WHERE month_key IN (SELECT month_key FROM recent_months)
  ),
  missing_trend AS (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object('month', month_label, 'count', missing_count)
      ORDER BY month_key
    ), '[]'::jsonb) AS data
    FROM recent_months
  ),
  week_buckets AS (
    SELECT
      'W' || (4 - gs) AS week,
      now() - (gs + 1) * INTERVAL '7 days' AS start_ts,
      now() - gs * INTERVAL '7 days' AS end_ts
    FROM generate_series(0, 3) gs
  ),
  movement_frequency AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'week', week,
      'checkouts', checkouts,
      'returns', returns
    ) ORDER BY start_ts), '[]'::jsonb) AS data
    FROM (
      SELECT wb.week, wb.start_ts,
        count(m.*) FILTER (WHERE m.status IN ('checked_out', 'in_transit', 'overdue'))::int AS checkouts,
        count(m.*) FILTER (WHERE m.status = 'returned')::int AS returns
      FROM week_buckets wb
      LEFT JOIN movement_data m ON m.created_at >= wb.start_ts AND m.created_at < wb.end_ts
      GROUP BY wb.week, wb.start_ts
    ) grouped
  ),
  division_stats AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('name', name, 'value', value) ORDER BY value DESC), '[]'::jsonb) AS data
    FROM (
      SELECT COALESCE(court_level, court_division, 'Unclassified') AS name, count(*)::int AS value
      FROM case_data GROUP BY 1 ORDER BY 2 DESC LIMIT 8
    ) grouped
  ),
  retrieval_performance AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('division', division, 'avgHours', avg_hours) ORDER BY avg_hours DESC), '[]'::jsonb) AS data
    FROM (
      SELECT COALESCE(c.court_level, c.court_division, 'Unclassified') AS division,
        round(avg((m.actual_return_date - m.expected_return_date) * 24)::numeric, 1) AS avg_hours
      FROM movement_data m
      JOIN case_data c ON c.id = m.case_id
      WHERE m.actual_return_date IS NOT NULL AND m.expected_return_date < m.actual_return_date
      GROUP BY 1 ORDER BY 2 DESC NULLS LAST LIMIT 8
    ) grouped
  ),
  scanning_performance AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'day', CASE dow WHEN 0 THEN 'Sun' WHEN 1 THEN 'Mon' WHEN 2 THEN 'Tue' WHEN 3 THEN 'Wed' WHEN 4 THEN 'Thu' WHEN 5 THEN 'Fri' ELSE 'Sat' END,
      'scans', scans
    ) ORDER BY dow), '[]'::jsonb) AS data
    FROM (
      SELECT extract(dow FROM created_at)::int AS dow, count(*)::int AS scans
      FROM doc_data GROUP BY 1
    ) grouped
  ),
  court_level_stats AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('name', name, 'value', value) ORDER BY name), '[]'::jsonb) AS data
    FROM (
      SELECT COALESCE(court_level, 'Legacy / unclassified') AS name, count(*)::int AS value
      FROM case_data GROUP BY 1
    ) grouped
  ),
  family_stats AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('name', case_family, 'value', value) ORDER BY value DESC, case_family), '[]'::jsonb) AS data
    FROM (
      SELECT case_family, count(*)::int AS value FROM case_data GROUP BY 1
    ) grouped
  ),
  case_type_stats AS (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'caseTypeId', case_type_id,
      'code', COALESCE(code, 'UNCLASSIFIED'),
      'name', COALESCE(case_type_name, 'Pending review'),
      'fullLabel', COALESCE(full_label, 'Pending review'),
      'courtLevel', COALESCE(court_level, 'Legacy / unclassified'),
      'family', case_family,
      'value', value
    ) ORDER BY value DESC, code, case_type_id), '[]'::jsonb) AS data
    FROM (
      SELECT case_type_id, code, case_type_name, full_label, court_level, case_family, count(*)::int AS value
      FROM case_data GROUP BY 1, 2, 3, 4, 5, 6
    ) grouped
  )
  SELECT jsonb_build_object(
    'archiveGrowth', (SELECT data FROM archive_growth),
    'missingTrend', (SELECT data FROM missing_trend),
    'movementFrequency', (SELECT data FROM movement_frequency),
    'divisionStats', (SELECT data FROM division_stats),
    'retrievalPerformance', (SELECT data FROM retrieval_performance),
    'scanningPerformance', (SELECT data FROM scanning_performance),
    'courtLevelStats', (SELECT data FROM court_level_stats),
    'familyStats', (SELECT data FROM family_stats),
    'caseTypeStats', (SELECT data FROM case_type_stats),
    'unclassifiedCount', (SELECT count(*)::int FROM case_data WHERE case_type_id IS NULL),
    'totalCases', (SELECT count(*)::int FROM case_data),
    'filters', jsonb_build_object(
      'from', (SELECT from_date FROM bounds),
      'to', (SELECT to_date FROM bounds),
      'courtLevel', p_court_level,
      'caseTypeId', p_case_type_id,
      'caseFamily', p_case_family
    )
  );
$$;

REVOKE ALL ON FUNCTION public.fetch_report_data(date, date, text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fetch_report_data(date, date, text, integer, text) TO authenticated, service_role;

-- Keep archive and scan RPCs classification-complete.
DROP FUNCTION public.lookup_case_for_scan(text);

CREATE FUNCTION public.lookup_case_for_scan(scan_code text)
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
  case_type_id integer,
  case_family text,
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
SECURITY INVOKER
SET search_path = public
AS $$
  WITH input AS (SELECT lower(trim(scan_code)) AS code)
  SELECT
    c.id, c.case_number, c.title, c.court, c.status, c.filed_date, c.closed_date,
    c.description, c.case_type, c.case_type_id, c.case_family, c.case_category_code,
    c.court_station, c.court_division, c.year, c.plaintiff, c.defendant, c.judge,
    c.archive_code, c.shelf_location, c.location_id, c.qr_barcode, c.notes,
    c.is_missing, c.created_by, c.created_at, c.updated_at,
    CASE
      WHEN lower(c.case_number) = input.code THEN 'case_number'
      WHEN EXISTS (
        SELECT 1 FROM public.case_number_aliases alias
        WHERE alias.case_id = c.id AND alias.normalized_case_number = input.code
      ) THEN 'case_number_alias'
      WHEN lower(c.qr_barcode) = input.code THEN 'qr_barcode'
      ELSE 'archive_code'
    END
  FROM public.cases c
  CROSS JOIN input
  WHERE input.code <> '' AND (
    lower(c.case_number) = input.code
    OR lower(c.qr_barcode) = input.code
    OR lower(c.archive_code) = input.code
    OR EXISTS (
      SELECT 1 FROM public.case_number_aliases alias
      WHERE alias.case_id = c.id AND alias.normalized_case_number = input.code
    )
  )
  ORDER BY
    CASE
      WHEN lower(c.case_number) = input.code THEN 1
      WHEN EXISTS (
        SELECT 1 FROM public.case_number_aliases alias
        WHERE alias.case_id = c.id AND alias.normalized_case_number = input.code
      ) THEN 2
      WHEN lower(c.qr_barcode) = input.code THEN 3
      ELSE 4
    END,
    c.updated_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_case_for_scan(text) TO authenticated, service_role;

DROP FUNCTION public.list_archive_stored_cases(integer, integer);

CREATE FUNCTION public.list_archive_stored_cases(
  result_limit integer DEFAULT 300,
  result_offset integer DEFAULT 0
)
RETURNS TABLE (
  case_id uuid,
  case_number text,
  title text,
  case_type text,
  case_type_id integer,
  case_family text,
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
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.case_number,
    c.title,
    c.case_type,
    c.case_type_id,
    c.case_family,
    c.case_category_code,
    cc.category_name,
    c.court_station,
    c.court_division,
    c.year,
    c.plaintiff,
    c.defendant,
    c.judge,
    c.status,
    c.archive_code,
    c.shelf_location,
    c.filed_date,
    public.archive_location_display_path(c.location_id),
    count(*) OVER ()
  FROM public.cases c
  LEFT JOIN public.case_categories cc ON cc.code = c.case_category_code
  WHERE c.location_id IS NOT NULL
  ORDER BY c.case_number ASC
  LIMIT LEAST(500, GREATEST(1, COALESCE(NULLIF(result_limit, 0), 300)))
  OFFSET GREATEST(COALESCE(result_offset, 0), 0);
$$;

GRANT EXECUTE ON FUNCTION public.list_archive_stored_cases(integer, integer) TO authenticated, service_role;

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
  WITH input AS (SELECT nullif(trim(search_query), '') AS q)
  SELECT c.*
  FROM public.cases c
  LEFT JOIN public.case_types ct ON ct.case_type_id = c.case_type_id
  LEFT JOIN public.case_categories cc ON cc.code = c.case_category_code
  CROSS JOIN input
  WHERE input.q IS NULL
    OR to_tsvector('english',
      coalesce(c.case_number, '') || ' ' || coalesce(c.title, '') || ' ' ||
      coalesce(c.description, '') || ' ' || coalesce(c.plaintiff, '') || ' ' ||
      coalesce(c.defendant, '') || ' ' || coalesce(c.case_family, '') || ' ' ||
      coalesce(ct.code, '') || ' ' || coalesce(ct.case_type, '') || ' ' ||
      coalesce(ct.full_label, '') || ' ' || coalesce(cc.category_name, '')
    ) @@ plainto_tsquery('english', input.q)
    OR c.case_number ILIKE '%' || input.q || '%'
    OR c.title ILIKE '%' || input.q || '%'
    OR c.plaintiff ILIKE '%' || input.q || '%'
    OR c.defendant ILIKE '%' || input.q || '%'
    OR c.case_family ILIKE '%' || input.q || '%'
    OR ct.code ILIKE '%' || input.q || '%'
    OR ct.case_type ILIKE '%' || input.q || '%'
    OR ct.full_label ILIKE '%' || input.q || '%'
    OR cc.category_name ILIKE '%' || input.q || '%'
    OR EXISTS (
      SELECT 1 FROM public.case_number_aliases number_alias
      WHERE number_alias.case_id = c.id AND number_alias.case_number ILIKE '%' || input.q || '%'
    )
    OR EXISTS (
      SELECT 1 FROM public.case_parties party
      WHERE party.case_id = c.id AND (
        party.party_name ILIKE '%' || input.q || '%'
        OR coalesce(party.normalized_party_name, '') ILIKE '%' || input.q || '%'
      )
    )
  ORDER BY c.created_at DESC
  LIMIT LEAST(100, GREATEST(1, COALESCE(NULLIF(result_limit, 0), 25)))
  OFFSET GREATEST(COALESCE(result_offset, 0), 0);
$$;

CREATE OR REPLACE FUNCTION public.search_cases_count(search_query text)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH input AS (SELECT nullif(trim(search_query), '') AS q)
  SELECT count(*)::bigint
  FROM public.cases c
  LEFT JOIN public.case_types ct ON ct.case_type_id = c.case_type_id
  LEFT JOIN public.case_categories cc ON cc.code = c.case_category_code
  CROSS JOIN input
  WHERE input.q IS NULL
    OR to_tsvector('english',
      coalesce(c.case_number, '') || ' ' || coalesce(c.title, '') || ' ' ||
      coalesce(c.description, '') || ' ' || coalesce(c.plaintiff, '') || ' ' ||
      coalesce(c.defendant, '') || ' ' || coalesce(c.case_family, '') || ' ' ||
      coalesce(ct.code, '') || ' ' || coalesce(ct.case_type, '') || ' ' ||
      coalesce(ct.full_label, '') || ' ' || coalesce(cc.category_name, '')
    ) @@ plainto_tsquery('english', input.q)
    OR c.case_number ILIKE '%' || input.q || '%'
    OR c.title ILIKE '%' || input.q || '%'
    OR c.plaintiff ILIKE '%' || input.q || '%'
    OR c.defendant ILIKE '%' || input.q || '%'
    OR c.case_family ILIKE '%' || input.q || '%'
    OR ct.code ILIKE '%' || input.q || '%'
    OR ct.case_type ILIKE '%' || input.q || '%'
    OR ct.full_label ILIKE '%' || input.q || '%'
    OR cc.category_name ILIKE '%' || input.q || '%'
    OR EXISTS (
      SELECT 1 FROM public.case_number_aliases number_alias
      WHERE number_alias.case_id = c.id AND number_alias.case_number ILIKE '%' || input.q || '%'
    )
    OR EXISTS (
      SELECT 1 FROM public.case_parties party
      WHERE party.case_id = c.id AND (
        party.party_name ILIKE '%' || input.q || '%'
        OR coalesce(party.normalized_party_name, '') ILIKE '%' || input.q || '%'
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.search_cases(text, integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.search_cases_count(text) TO authenticated, service_role;
