-- =============================================================================
-- Perf Test Seed — 10K+ Cases, Documents, and Movements for Benchmarking
-- =============================================================================
-- Run:  psql "$DATABASE_URL" -f supabase/seed/perf-test.sql
-- Or:   \i supabase/seed/perf-test.sql   (inside psql)
-- =============================================================================
-- Schema:  judiciary archive system (supabase/migrations/*.sql)
-- Targets: <50ms p95 case list, <20ms single case + docs
-- =============================================================================

-- Clean up any previous perf test data first
DELETE FROM public.file_movements fm
  USING public.cases c
  WHERE fm.case_id = c.id AND c.case_number LIKE 'PERF/%';

DELETE FROM public.documents d
  USING public.cases c
  WHERE d.case_id = c.id AND c.case_number LIKE 'PERF/%';

DELETE FROM public.cases WHERE case_number LIKE 'PERF/%';

DO $$
DECLARE
  -- Timing
  v_start        timestamptz := clock_timestamp();
  v_t1           timestamptz;
  v_t2           timestamptz;
  v_t3           timestamptz;
  v_t4           timestamptz;

  -- Config
  v_total        CONSTANT int  := 12000;  -- total cases to generate

  -- Data arrays for random generation
  v_types        text[] := ARRAY['Civil','Criminal','ELC','Family','Commercial','Constitutional','Probate'];
  v_stations     text[] := ARRAY['KBT','NRB','MSA','KSM','NKR'];
  v_firsts       text[] := ARRAY['James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda',
                                'David','Elizabeth','William','Barbara','Richard','Susan','Joseph','Jessica'];
  v_lasts        text[] := ARRAY['Kamau','Otieno','Mwangi','Njoki','Ochieng','Wanjiku','Kiprop','Chebet',
                                'Mutua','Nyambura','Kariuki','Akinyi','Ndegwa','Wambui','Kosgei','Hassan'];
  v_judges       text[] := ARRAY['Hon. Justice N. Muli','Hon. Justice P. Owino','Hon. Justice L. Otieno',
                                'Hon. Justice M. Kamau','Hon. Justice S. Njeri','Hon. Justice R. Ochieng',
                                'Hon. Justice A. Akinyi','Hon. Justice D. Wanjiku'];
  v_doc_cats     text[] := ARRAY['Pleadings','Proceedings','Rulings','Orders','Correspondence','Exhibits'];
  v_offices      text[] := ARRAY['Registry','Judge Chambers','Courtroom 1','Courtroom 2','High Court',
                                'Appeals Office','Library','Admin Block','Archive','Scanning Room',
                                'Deputy Registrar','Magistrate Court'];
  v_purposes     text[] := ARRAY['Review for ruling','Party inspection','Hearing','Digitization',
                                'Mediation review','Appeal preparation','File retrieval',
                                'Audit check','Transfer to archives','Document scanning'];
  v_rooms        uuid[] := ARRAY[
    '11111111-1111-1111-1111-111111111101',
    '11111111-1111-1111-1111-111111111102',
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111106'
  ];

  -- Counters
  v_case_count    int := 0;
  v_doc_count     int := 0;
  v_mov_count     int := 0;
  v_affected      int;
BEGIN
  RAISE NOTICE '==================================================================';
  RAISE NOTICE 'Perf test seed: generating % cases with docs + movements', v_total;
  RAISE NOTICE '==================================================================';

  -- ===========================================================================
  -- STEP 1: Generate and insert 12 000 cases (batch INSERT … SELECT)
  -- ===========================================================================
  RAISE NOTICE 'Step 1/4: Inserting cases …';

  INSERT INTO public.cases (
    id, case_number, title, court, status, filed_date, closed_date,
    description, case_type, court_station, court_division, year,
    plaintiff, defendant, judge, archive_code, shelf_location, location_id,
    qr_barcode, notes, is_missing, created_by, created_at, updated_at
  )
  SELECT
    gen_random_uuid() AS id,

    -- case_number: PERF/<type-abbr>/<year>/<seq>
    'PERF/' ||
    CASE v_types[1 + (s % 7)]
      WHEN 'Civil'         THEN 'CIV'
      WHEN 'Criminal'      THEN 'CR'
      WHEN 'ELC'           THEN 'ELC'
      WHEN 'Family'        THEN 'FAM'
      WHEN 'Commercial'    THEN 'COM'
      WHEN 'Constitutional' THEN 'CON'
      ELSE 'PRO'
    END || '/' ||
    (2022 + (s % 5))::text || '/' ||
    LPAD(s::text, 6, '0') AS case_number,

    -- title: "Plaintiff v. Defendant"
    v_firsts[1 + ((s * 7) % 16)] || ' ' || v_lasts[1 + ((s * 3) % 16)] ||
    ' v. ' ||
    v_firsts[1 + ((s * 11) % 16)] || ' ' || v_lasts[1 + ((s * 5) % 16)] AS title,

    v_stations[1 + (s % 5)] AS court,

    -- status distribution: ~50% open, ~25% closed, ~15% archived, ~5% missing, ~5% pending_return
    CASE
      WHEN s % 100 < 50 THEN 'open'
      WHEN s % 100 < 75 THEN 'closed'
      WHEN s % 100 < 90 THEN 'archived'
      WHEN s % 100 < 95 THEN 'missing'
      ELSE 'pending_return'
    END::public.case_status AS status,

    (date '2022-01-01' + (s % (5 * 365))::int) AS filed_date,

    CASE WHEN s % 100 < 75  -- closed or archived
      THEN date '2023-01-01' + (s % (3 * 365))::int
      ELSE NULL
    END AS closed_date,

    'Perf test case #' || s AS description,

    v_types[1 + (s % 7)] AS case_type,
    v_stations[1 + (s % 5)] AS court_station,

    CASE v_types[1 + (s % 7)]
      WHEN 'ELC'  THEN 'Environment & Land'
      WHEN 'Family' THEN 'Family Division'
      WHEN 'Commercial' THEN 'Commercial Division'
      ELSE 'High Court'
    END AS court_division,

    2022 + (s % 5) AS year,

    v_firsts[1 + ((s * 7) % 16)] || ' ' || v_lasts[1 + ((s * 3) % 16)] AS plaintiff,
    v_firsts[1 + ((s * 11) % 16)] || ' ' || v_lasts[1 + ((s * 5) % 16)] AS defendant,
    v_judges[1 + (s % 8)] AS judge,

    v_stations[1 + (s % 5)] || '-' ||
    CASE v_types[1 + (s % 7)]
      WHEN 'Civil' THEN 'CIV' WHEN 'Criminal' THEN 'CR' WHEN 'ELC' THEN 'ELC'
      WHEN 'Family' THEN 'FAM' WHEN 'Commercial' THEN 'COM'
      WHEN 'Constitutional' THEN 'CON' ELSE 'PRO'
    END || '-' ||
    (2022 + (s % 5))::text || '-' ||
    LPAD(s::text, 6, '0') AS archive_code,

    -- ~60% get a shelf location
    CASE WHEN s % 10 < 6
      THEN 'R' || (1 + (s % 6)) || ' › B' || (1 + (s % 4)) || ' › R' || (1 + (s % 3)) || ' › S' || (1 + (s % 5))
      ELSE NULL
    END AS shelf_location,

    CASE WHEN s % 10 < 6 THEN v_rooms[1 + (s % 6)] ELSE NULL END AS location_id,

    'QR-PERF-' || LPAD(s::text, 6, '0') AS qr_barcode,

    CASE WHEN s % 20 = 0 THEN 'Benchmark test case — notable entry.' ELSE NULL END AS notes,

    (s % 100 >= 92 AND s % 100 < 95) AS is_missing,  -- ~3% missing

    NULL AS created_by,

    (timestamp '2022-01-01 08:00:00' + (s * interval '3 hours')) AS created_at,
    (timestamp '2024-06-01 08:00:00' + (s * interval '1 hour')) AS updated_at

  FROM generate_series(1, v_total) AS s;

  GET DIAGNOSTICS v_affected = ROW_COUNT;
  v_case_count := v_affected;
  v_t1 := clock_timestamp();
  RAISE NOTICE '  Inserted % cases in % ms', v_case_count,
    round(extract(epoch from (v_t1 - v_start)) * 1000, 1);

  ANALYZE public.cases;

  -- ===========================================================================
  -- STEP 2: Generate and insert documents (3 per case avg, range 1–5)
  -- ===========================================================================
  RAISE NOTICE 'Step 2/4: Inserting documents …';

  INSERT INTO public.documents (
    id, case_id, title, storage_path, mime_type, file_size,
    category, ocr_status, uploaded_by, created_at
  )
  SELECT
    gen_random_uuid() AS id,
    c.id AS case_id,
    v_doc_cats[1 + (doc_n % 6)] || ' — ' || c.case_number AS title,
    c.id::text || '/' || LOWER(v_doc_cats[1 + (doc_n % 6)]) || '/doc-' || doc_n || '.pdf' AS storage_path,

    CASE WHEN doc_n % 10 < 8 THEN 'application/pdf'
         WHEN doc_n % 10 < 9 THEN 'image/jpeg'
         ELSE 'image/png'
    END AS mime_type,

    (50000 + (doc_n * 7919) % 5000000)::bigint AS file_size,
    v_doc_cats[1 + (doc_n % 6)]::public.document_category AS category,

    CASE WHEN doc_n % 100 < 70 THEN 'complete'::public.ocr_status
         WHEN doc_n % 100 < 85 THEN 'pending'::public.ocr_status
         WHEN doc_n % 100 < 95 THEN 'processing'::public.ocr_status
         ELSE 'failed'::public.ocr_status
    END AS ocr_status,

    NULL AS uploaded_by,
    c.created_at + (doc_n * interval '1 day') AS created_at

  FROM public.cases c
  CROSS JOIN LATERAL (
    SELECT seq AS doc_n
    FROM generate_series(1, (
      -- Use random() for distribution instead of UUID arith
      CASE floor(random() * 10)::int
        WHEN 0 THEN 1 WHEN 1 THEN 1
        WHEN 2 THEN 2 WHEN 3 THEN 2
        WHEN 4 THEN 3 WHEN 5 THEN 3 WHEN 6 THEN 3
        WHEN 7 THEN 4
        ELSE 5
      END
    )) AS seq
  ) AS doc_series
  -- Only generate docs for perf test cases (skip existing seed cases)
  WHERE c.case_number LIKE 'PERF/%';

  GET DIAGNOSTICS v_affected = ROW_COUNT;
  v_doc_count := v_affected;
  v_t2 := clock_timestamp();
  RAISE NOTICE '  Inserted % documents in % ms', v_doc_count,
    round(extract(epoch from (v_t2 - v_t1)) * 1000, 1);

  ANALYZE public.documents;

  -- ===========================================================================
  -- STEP 3: Generate and insert file movements (2 per case avg, range 0–3)
  -- ===========================================================================
  RAISE NOTICE 'Step 3/4: Inserting movements …';

  INSERT INTO public.file_movements (
    id, case_id, destination_office, purpose, expected_return_date,
    actual_return_date, status, created_at, updated_at
  )
  SELECT
    gen_random_uuid() AS id,
    c.id AS case_id,
    v_offices[1 + ((mov_n * 7) % 12)] AS destination_office,
    v_purposes[1 + ((mov_n * 11) % 10)] AS purpose,
    (c.created_at + (mov_n * interval '7 days') + ((mov_n * 3)::text || ' days')::interval)::date
      AS expected_return_date,
    CASE WHEN mov_n % 10 < 6
      THEN (c.created_at + (mov_n * interval '10 days') + ((mov_n * 2)::text || ' days')::interval)::date
      ELSE NULL
    END AS actual_return_date,

    CASE WHEN mov_n % 10 < 4 THEN 'checked_out'::public.movement_status
         WHEN mov_n % 10 < 6 THEN 'in_transit'::public.movement_status
         WHEN mov_n % 10 < 9 THEN 'returned'::public.movement_status
         ELSE 'overdue'::public.movement_status
    END AS status,

    c.created_at + (mov_n * interval '3 days') AS created_at,
    c.created_at + (mov_n * interval '5 days') AS updated_at

  FROM public.cases c
  CROSS JOIN LATERAL (
    SELECT seq AS mov_n
    FROM generate_series(1, (
      CASE floor(random() * 10)::int
        WHEN 0 THEN 0 WHEN 1 THEN 0  -- 20% chance = 0 movements
        WHEN 2 THEN 1 WHEN 3 THEN 1 WHEN 4 THEN 1  -- 30% = 1
        WHEN 5 THEN 2 WHEN 6 THEN 2 WHEN 7 THEN 2  -- 30% = 2
        ELSE 3  -- 20% = 3
      END
    )) AS seq
  ) AS mov_series
  WHERE c.case_number LIKE 'PERF/%';

  GET DIAGNOSTICS v_affected = ROW_COUNT;
  v_mov_count := v_affected;
  v_t3 := clock_timestamp();
  RAISE NOTICE '  Inserted % movements in % ms', v_mov_count,
    round(extract(epoch from (v_t3 - v_t2)) * 1000, 1);

  ANALYZE public.file_movements;

  -- ===========================================================================
  -- STEP 4: Summary and benchmark queries
  -- ===========================================================================
  v_t4 := clock_timestamp();
  RAISE NOTICE '';
  RAISE NOTICE '==================================================================';
  RAISE NOTICE '  Seed complete — total time: % ms',
    round(extract(epoch from (v_t4 - v_start)) * 1000, 1);
  RAISE NOTICE '  Cases:     %', v_case_count;
  RAISE NOTICE '  Documents: %', v_doc_count;
  RAISE NOTICE '  Movements: %', v_mov_count;
  RAISE NOTICE '==================================================================';
  RAISE NOTICE '';
  RAISE NOTICE '── Benchmark queries (run after ANALYZE) ──────────────────────';
  RAISE NOTICE '';
  RAISE NOTICE '1. Case list (paginated, unfiltered, uses idx_cases_created_at):';
  RAISE NOTICE '   EXPLAIN (ANALYZE, BUFFERS)';
  RAISE NOTICE '   SELECT * FROM public.cases';
  RAISE NOTICE '     ORDER BY created_at DESC LIMIT 25 OFFSET 0;';
  RAISE NOTICE '';
  RAISE NOTICE '2. Case list with status filter (uses idx_cases_status_created_at):';
  RAISE NOTICE '   EXPLAIN (ANALYZE, BUFFERS)';
  RAISE NOTICE '   SELECT * FROM public.cases WHERE status = ''open''';
  RAISE NOTICE '     ORDER BY created_at DESC LIMIT 25 OFFSET 0;';
  RAISE NOTICE '';
  RAISE NOTICE '3. Full-text search (uses GIN + trigram indexes):';
  RAISE NOTICE '   EXPLAIN (ANALYZE, BUFFERS)';
  RAISE NOTICE '   SELECT * FROM public.search_cases(''Kamau'', 25, 0);';
  RAISE NOTICE '';
  RAISE NOTICE '4. Documents per case (uses idx_documents_case_id):';
  RAISE NOTICE '   EXPLAIN (ANALYZE, BUFFERS)';
  RAISE NOTICE '   SELECT * FROM public.documents WHERE case_id = ''<first-case-uuid>''';
  RAISE NOTICE '     ORDER BY created_at DESC;';
  RAISE NOTICE '';
  RAISE NOTICE '5. Batch documents for N cases (list_documents_for_cases RPC):';
  RAISE NOTICE '   EXPLAIN (ANALYZE, BUFFERS)';
  RAISE NOTICE '   SELECT * FROM public.list_documents_for_cases(';
  RAISE NOTICE '     ARRAY(SELECT id FROM public.cases WHERE case_number LIKE ''PERF/%%'' LIMIT 25),';
  RAISE NOTICE '     5);';
  RAISE NOTICE '';
  RAISE NOTICE '6. Search with ILIKE (uses trigram index):';
  RAISE NOTICE '   EXPLAIN (ANALYZE, BUFFERS)';
  RAISE NOTICE '   SELECT * FROM public.cases WHERE case_number ILIKE ''%%Kamau%%'';';
  RAISE NOTICE '';
  RAISE NOTICE '7. Role RLS test (simulate by calling get_user_role):';
  RAISE NOTICE '   EXPLAIN (ANALYZE, BUFFERS)';
  RAISE NOTICE '   SELECT public.get_user_role();';
  RAISE NOTICE '';
  RAISE NOTICE '8. Status transition state machine trigger:';
  RAISE NOTICE '   EXPLAIN (ANALYZE, BUFFERS)';
  RAISE NOTICE '   UPDATE public.cases SET status = ''closed''';
  RAISE NOTICE '   WHERE status = ''open'' AND year < 2023 LIMIT 10;';
  RAISE NOTICE '   -- (Rollback or COMMIT after testing.)';
  RAISE NOTICE '';
  RAISE NOTICE '── Cleanup ────────────────────────────────────────────────────';
  RAISE NOTICE '';
  RAISE NOTICE '   DELETE FROM public.file_movements fm';
  RAISE NOTICE '     USING public.cases c';
  RAISE NOTICE '     WHERE fm.case_id = c.id AND c.case_number LIKE ''PERF/%'';';
  RAISE NOTICE '   DELETE FROM public.documents d';
  RAISE NOTICE '     USING public.cases c';
  RAISE NOTICE '     WHERE d.case_id = c.id AND c.case_number LIKE ''PERF/%'';';
  RAISE NOTICE '   DELETE FROM public.cases WHERE case_number LIKE ''PERF/%'';';
  RAISE NOTICE '==================================================================';
END;
$$;
