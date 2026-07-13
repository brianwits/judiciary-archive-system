-- Seed data for local development and staging resets.
-- Requires at least one auth user (profiles are created via handle_new_user trigger).

-- Archive rooms
INSERT INTO public.archive_locations (id, parent_id, level, code, label, capacity, occupied_count, category)
VALUES
  ('11111111-1111-1111-1111-111111111101', NULL, 'room', 'R1', 'Room A - Civil Cases', 500, 423, 'Civil Cases'),
  ('11111111-1111-1111-1111-111111111102', NULL, 'room', 'R2', 'Room B - Criminal Cases', 400, 248, 'Criminal Cases'),
  ('11111111-1111-1111-1111-111111111103', NULL, 'room', 'R3', 'Room C - Family Cases', 300, 135, 'Family Cases'),
  ('11111111-1111-1111-1111-111111111104', NULL, 'room', 'R4', 'Room D - Commercial Cases', 350, 319, 'Commercial Cases'),
  ('11111111-1111-1111-1111-111111111105', NULL, 'room', 'R5', 'Room E - Constitutional', 200, 156, 'Constitutional'),
  ('11111111-1111-1111-1111-111111111106', NULL, 'room', 'R6', 'Room F - Probate & Misc', 450, 149, 'Probate & Misc')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.archive_locations (id, parent_id, level, code, label, capacity, occupied_count)
VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'bay', 'B1', 'Bay 1', 125, 105),
  ('22222222-2222-2222-2222-222222222202', '22222222-2222-2222-2222-222222222201', 'rack', 'R1', 'Rack 1', 42, 35),
  ('22222222-2222-2222-2222-222222222203', '22222222-2222-2222-2222-222222222202', 'shelf', 'S4', 'Shelf 4', 14, 12),
  ('22222222-2222-2222-2222-222222222211', '11111111-1111-1111-1111-111111111102', 'bay', 'B1', 'Bay 1', 100, 80),
  ('22222222-2222-2222-2222-222222222212', '22222222-2222-2222-2222-222222222211', 'shelf', 'S3', 'Shelf 3', 33, 22)
ON CONFLICT (id) DO NOTHING;

-- Demo cases loaded from Kabarnet CTS data (Magistrate + High Court)
INSERT INTO public.cases (
  case_number, title, court, status, filed_date, closed_date, description,
  case_type, case_type_id, case_family, case_category_code,
  court_station, court_division, year,
  plaintiff, defendant, archive_code, is_missing, notes,
  source_system, source_case_id, case_number_raw
)
VALUES
  (
    'MCCR/E319/2023', 'Republic v. Kenneth Matala Rotich', 'KBT', 'closed', '2023-06-06', '2025-08-21',
    'Criminal case — Magistrate Court Criminal Case.',
    'Criminal', 33, 'Criminal', 'MC_CRIMINAL',
    'Kabarnet', 'Magistrate Court', 2023,
    'Republic', 'Kenneth Matala Rotich', 'KBT-MCCR-2023-E319', false, 'MCCR - Magistrate Court Criminal Case',
    'cts_kabarnet', 'MCCR/E319/2023', 'MCCR/E319/2023'
  ),
  (
    'MCCC/E038/2024', 'Willy Kipyegen Tuitoek v. Maguna Andu Wholesalers (K) Ltd', 'KBT', 'closed', '2024-07-31', NULL,
    'Civil matter — Magistrate Court Civil Case.',
    'Civil', 31, 'Civil', 'MC_CIVIL',
    'Kabarnet', 'Magistrate Court', 2024,
    'Willy Kipyegen Tuitoek', 'Maguna Andu Wholesalers (K) Ltd', 'KBT-MCCC-2024-E038', false, 'MCCC - Magistrate Court Civil Case',
    'cts_kabarnet', 'MCCC/E038/2024', 'MCCC/E038/2024'
  ),
  (
    'MCTR/E028/2024', 'Republic v. Dennis Kariuki', 'KBT', 'closed', '2024-10-15', '2024-10-15',
    'Traffic case — Magistrate Court Traffic Case.',
    'Traffic', 35, 'Traffic', 'MC_TRAFFIC',
    'Kabarnet', 'Magistrate Court', 2024,
    'Republic', 'Dennis Kariuki', 'KBT-MCTR-2024-E028', false, 'MCTR - Magistrate Court Traffic Case',
    'cts_kabarnet', 'MCTR/E028/2024', 'MCTR/E028/2024'
  ),
  (
    'MCSO/E007/2024', 'Republic v. Joshua Chebor', 'KBT', 'closed', '2024-05-29', NULL,
    'Sexual offences case.',
    'Criminal', 72, 'Criminal', 'MC_SEXUAL_OFFENCE',
    'Kabarnet', 'Magistrate Court', 2024,
    'Republic', 'Joshua Chebor', 'KBT-MCSO-2024-E007', false, 'MCSO - Sexual Offences',
    'cts_kabarnet', 'MCSO/E007/2024', 'MCSO/E007/2024'
  ),
  (
    'MCCHCR/E002/2024', 'Republic v. Peter Kiplimo Chirchir', 'KBT', 'closed', '2024-01-30', NULL,
    'Children criminal case.',
    'Criminal', 84, 'Children & Protection', 'MC_CRIMINAL',
    'Kabarnet', 'Magistrate Court', 2024,
    'Republic', 'Peter Kiplimo Chirchir', 'KBT-MCCHCR-2024-E002', false, 'MCCHCR - Magistrate Court Criminal - Children',
    'cts_kabarnet', 'MCCHCR/E002/2024', 'MCCHCR/E002/2024'
  ),
  (
    'MCCRMISC/E041/2024', 'Republic v. Edwin Kimosop and John Kibet', 'KBT', 'closed', '2024-08-12', NULL,
    'Criminal miscellaneous case.',
    'Criminal', 34, 'Criminal', 'MC_CRIMINAL',
    'Kabarnet', 'Magistrate Court', 2024,
    'Republic', 'Edwin Kimosop and John Kibet', 'KBT-MCCRMISC-2024-E041', false, 'MCCRMISC - Magistrate Court Criminal Miscellaneous',
    'cts_kabarnet', 'MCCRMISC/E041/2024', 'MCCRMISC/E041/2024'
  ),
  (
    'HCCRC/94/2017', 'Republic v. Francis Kiprotich Tallam and Maxwell Kipkoech Kosgei', 'KBT', 'closed', '2017-12-27', '2023-07-06',
    'High Court criminal case.',
    'Criminal', 9, 'Criminal', 'HC_CRIMINAL',
    'Kabarnet', 'High Court', 2017,
    'Republic', 'Francis Kiprotich Tallam and Maxwell Kipkoech Kosgei', 'KBT-HCCRC-2017-094', false, 'HCCRC - High Court Criminal Case',
    'cts_kabarnet', 'HCCRC/94/2017', 'HCCRC/94/2017'
  ),
  (
    'HCCRMISCAPPL/E054/2024', 'Republic v. John Kamau Mwangi', 'KBT', 'closed', '2024-12-19', NULL,
    'High Court criminal miscellaneous application.',
    'Criminal', 10, 'Criminal', 'HC_CRIMINAL',
    'Kabarnet', 'High Court', 2024,
    'Republic', 'John Kamau Mwangi', 'KBT-HCCRMISC-2024-E054', false, 'HCCRMISCAPPL - High Court Criminal Miscellaneous Application',
    'cts_kabarnet', 'HCCRMISCAPPL/E054/2024', 'HCCRMISCAPPL/E054/2024'
  )
ON CONFLICT (case_number) DO NOTHING;

INSERT INTO public.case_number_aliases (case_id, case_number, source)
SELECT c.id, alias.case_number, 'seed'
FROM (VALUES
  ('MCCR/E319/2023', 'MCCR/E319/2023'),
  ('HCCRC/94/2017', 'HCCRC/94/2017'),
  ('HCCRC/94/2017', 'HC.CR.C/94/2017')
) AS alias(current_case_number, case_number)
JOIN public.cases c ON c.case_number = alias.current_case_number
ON CONFLICT (normalized_case_number) DO NOTHING;

UPDATE public.cases c
SET
  shelf_location = v.shelf_location,
  location_id = v.location_id::uuid,
  judge = COALESCE(c.judge, v.judge)
FROM (VALUES
  ('MCCR/E319/2023', 'Hon. E. K. Makori', 'R1 › B1 › R1 › S4', '22222222-2222-2222-2222-222222222203'),
  ('MCCC/E038/2024', 'Hon. P. K. Too', 'R2 › B1 › S3', '22222222-2222-2222-2222-222222222212'),
  ('HCCRC/94/2017', 'Hon. Justice N. Muli', 'R4', '11111111-1111-1111-1111-111111111104'),
  ('HCCRMISCAPPL/E054/2024', 'Hon. Justice P. O. Otieno', 'R5', '11111111-1111-1111-1111-111111111105')
) AS v(case_number, judge, shelf_location, location_id)
WHERE c.case_number = v.case_number;

-- Registry requests (linked to cases by case_number lookup)
INSERT INTO public.registry_requests (case_id, request_type, requester, status)
SELECT c.id, v.request_type, v.requester, v.status
FROM (VALUES
  ('MCCR/E319/2023', 'Certified Copy', 'Adv. Kimani', 'pending'),
  ('MCCC/E038/2024', 'Party Search', 'Willy Kipyegen Tuitoek', 'in_progress'),
  ('MCCHCR/E002/2024', 'File Inspection', 'Peter Kiplimo Chirchir', 'pending'),
  ('HCCRC/94/2017', 'Archive Retrieval', 'Republic Prosecution', 'completed'),
  ('HCCRMISCAPPL/E054/2024', 'Certified Copy', 'Adv. Mwangi', 'pending')
) AS v(case_number, request_type, requester, status)
JOIN public.cases c ON c.case_number = v.case_number;

-- Dashboard notices (author_id nullable for seed)
INSERT INTO public.notices (title, body, priority)
VALUES
  ('Archive Room R4 Near Capacity', 'Room D commercial cases at 91% occupancy. Consider redistribution.', 'high'),
  ('Quarterly Audit Scheduled', 'Physical file audit begins June 1, 2026. All departments to prepare.', 'normal'),
  ('New Scanning Protocol', 'All new filings must be scanned within 48 hours of receipt.', 'normal');

INSERT INTO public.memos (title, reference)
VALUES
  ('File Retrieval Procedures Update', 'MEMO/REG/2026/045'),
  ('Archive Code Standardization', 'MEMO/ICT/2026/012');

INSERT INTO public.broadcasts (title, message)
VALUES
  ('System Maintenance Window', 'Scheduled maintenance on May 25, 2026 from 22:00 to 02:00 EAT.'),
  ('New User Training', 'Archive system training for registry staff on May 22, 2026.');

-- File movement for HCCRC/94/2017 (checked out)
INSERT INTO public.file_movements (case_id, destination_office, purpose, expected_return_date, status)
SELECT c.id, 'High Court Registry', 'Review for mention', CURRENT_DATE - 4, 'overdue'
FROM public.cases c
WHERE c.case_number = 'HCCRC/94/2017'
  AND NOT EXISTS (
    SELECT 1 FROM public.file_movements fm WHERE fm.case_id = c.id AND fm.status = 'overdue'
  );

-- File movement for MCTR/E028/2024 (recent check-in)
INSERT INTO public.file_movements (case_id, destination_office, purpose, expected_return_date, actual_return_date, status)
SELECT c.id, 'Traffic Registry', 'Sentencing hearing', CURRENT_DATE - 10, CURRENT_DATE - 3, 'returned'
FROM public.cases c
WHERE c.case_number = 'MCTR/E028/2024'
  AND NOT EXISTS (
    SELECT 1 FROM public.file_movements fm WHERE fm.case_id = c.id AND fm.status = 'returned'
  );
