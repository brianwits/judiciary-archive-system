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

-- Demo cases
INSERT INTO public.cases (
  case_number, title, court, status, filed_date, description,
  case_type, case_category_code, court_station, court_division, year,
  plaintiff, defendant, archive_code, is_missing
)
VALUES
  (
    'HCCR/123/2025', 'Republic v. John Kamau', 'KBT', 'open', '2025-01-15',
    'Criminal matter — theft charges.',
    'Criminal', 'HC_CRIMINAL', 'KBT', 'High Court', 2025,
    'Republic', 'John Kamau', 'KBT-CR-2025-123', false
  ),
  (
    'ELC/E018/2023', 'Green Valley Ltd v. County Land Board', 'KBT', 'archived', '2023-03-10',
    'Environment and land dispute.',
    'ELC', 'ELC_MATTER', 'KBT', 'Environment & Land', 2023,
    'Green Valley Ltd', 'County Land Board', 'KBT-ELC-2023-E018', false
  ),
  (
    'COM/234/2024', 'Digital Corp v. Tech Solutions Ltd', 'NRB', 'pending_return', '2024-06-02',
    'Commercial contract dispute.',
    'Commercial', 'HC_COMMERCIAL', 'NRB', 'Commercial Division', 2024,
    'Digital Corp', 'Tech Solutions Ltd', 'NRB-COM-2024-234', false
  ),
  (
    'FAM/089/2025', 'Jane Wanjiru v. Peter Wanjiru', 'KBT', 'open', '2025-02-20',
    'Family division — custody matter.',
    'Family', 'HC_FAMILY', 'KBT', 'Family Division', 2025,
    'Jane Wanjiru', 'Peter Wanjiru', 'KBT-FAM-2025-089', false
  ),
  (
    'CON/012/2025', 'Citizens Coalition v. Attorney General', 'NRB', 'open', '2025-04-01',
    'Constitutional petition.',
    'Constitutional', 'HC_CONSTITUTIONAL', 'NRB', 'High Court', 2025,
    'Citizens Coalition', 'Attorney General', 'NRB-CON-2025-012', false
  )
ON CONFLICT (case_number) DO NOTHING;

INSERT INTO public.case_number_aliases (case_id, case_number, source)
SELECT c.id, alias.case_number, 'seed'
FROM (VALUES
  ('HCCR/123/2025', 'CR/123/2025'),
  ('HCCR/123/2025', 'HCR/123/2025')
) AS alias(current_case_number, case_number)
JOIN public.cases c ON c.case_number = alias.current_case_number
ON CONFLICT (normalized_case_number) DO NOTHING;

UPDATE public.cases c
SET
  shelf_location = v.shelf_location,
  location_id = v.location_id::uuid,
  judge = COALESCE(c.judge, v.judge)
FROM (VALUES
  ('HCCR/123/2025', 'Hon. Justice N. Muli', 'R1 › B1 › R1 › S4', '22222222-2222-2222-2222-222222222203'),
  ('ELC/E018/2023', 'Hon. Justice P. Owino', 'R2 › B1 › S3', '22222222-2222-2222-2222-222222222212'),
  ('FAM/089/2025', 'Hon. Justice L. Otieno', 'R3', '11111111-1111-1111-1111-111111111103'),
  ('CON/012/2025', 'Hon. Deputy Registrar — Constitutional', 'R5', '11111111-1111-1111-1111-111111111105')
) AS v(case_number, judge, shelf_location, location_id)
WHERE c.case_number = v.case_number;

-- Registry requests (linked to cases by case_number lookup)
INSERT INTO public.registry_requests (case_id, request_type, requester, status)
SELECT c.id, v.request_type, v.requester, v.status
FROM (VALUES
  ('HCCR/123/2025', 'Certified Copy', 'Adv. Kimani', 'pending'),
  ('FAM/089/2025', 'File Inspection', 'Jane Wanjiru', 'in_progress'),
  ('ELC/E018/2023', 'Archive Retrieval', 'Green Valley Ltd', 'completed'),
  ('COM/234/2024', 'Party Search', 'Digital Corp', 'pending'),
  ('CON/012/2025', 'Certified Copy', 'Citizens Coalition', 'pending')
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

-- File movement for COM/234/2024 (checked out)
INSERT INTO public.file_movements (case_id, destination_office, purpose, expected_return_date, status)
SELECT c.id, 'Commercial Registry', 'Review for hearing', CURRENT_DATE - 4, 'overdue'
FROM public.cases c
WHERE c.case_number = 'COM/234/2024'
  AND NOT EXISTS (
    SELECT 1 FROM public.file_movements fm WHERE fm.case_id = c.id AND fm.status = 'overdue'
  );
