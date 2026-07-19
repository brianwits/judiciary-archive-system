ALTER TABLE public.archive_locations
  ADD COLUMN IF NOT EXISTS mapping_source text NOT NULL DEFAULT 'verified';

COMMENT ON COLUMN public.archive_locations.mapping_source IS
  'Whether the archive location is registry-verified or system-generated for mock physical mapping.';

CREATE INDEX IF NOT EXISTS idx_archive_locations_mapping_source
  ON public.archive_locations (mapping_source);

CREATE OR REPLACE FUNCTION public.normalize_generated_archive_family(
  p_case_family text,
  p_case_type text,
  p_case_category_code text,
  p_court_division text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN lower(coalesce(p_case_type, '')) = 'civil' OR lower(coalesce(p_case_family, '')) = 'civil'
      THEN 'Civil Cases'
    WHEN lower(coalesce(p_case_type, '')) = 'criminal' OR lower(coalesce(p_case_family, '')) = 'criminal'
      THEN 'Criminal Cases'
    WHEN lower(coalesce(p_case_type, '')) = 'commercial' OR lower(coalesce(p_case_family, '')) LIKE '%commercial%'
      THEN 'Commercial Cases'
    WHEN lower(coalesce(p_case_type, '')) = 'constitutional' OR lower(coalesce(p_case_family, '')) LIKE '%constitutional%'
      THEN 'Constitutional Cases'
    WHEN lower(coalesce(p_case_type, '')) = 'probate' OR lower(coalesce(p_case_family, '')) = 'probate'
      THEN 'Probate Cases'
    WHEN lower(coalesce(p_case_type, '')) = 'succession' OR lower(coalesce(p_case_family, '')) LIKE '%succession%'
      THEN 'Succession Cases'
    WHEN lower(coalesce(p_case_type, '')) = 'traffic' OR lower(coalesce(p_case_family, '')) = 'traffic'
      THEN 'Traffic Cases'
    WHEN lower(coalesce(p_case_type, '')) = 'elc'
      OR lower(coalesce(p_case_family, '')) LIKE '%environment%'
      OR lower(coalesce(p_case_category_code, '')) LIKE 'elc%'
      OR lower(coalesce(p_court_division, '')) LIKE '%environment%'
      OR lower(coalesce(p_court_division, '')) LIKE '%land%'
      THEN 'ELC Cases'
    ELSE 'Other Cases'
  END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_generated_archive_storage_mapping()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  room_record RECORD;
  v_room_id uuid;
  v_bay_id uuid;
  v_rack_id uuid;
  v_shelf_id uuid;
  bay_index integer;
  rack_index integer;
  shelf_index integer;
  box_index integer;
  v_deleted_count integer := 0;
  v_assigned_count integer := 0;
  v_location_count integer := 0;
BEGIN
  DROP TABLE IF EXISTS tmp_archive_room_catalog;
  DROP TABLE IF EXISTS tmp_generated_boxes;
  DROP TABLE IF EXISTS tmp_generated_case_assignments;

  CREATE TEMP TABLE tmp_archive_room_catalog (
    sort_order integer PRIMARY KEY,
    room_code text NOT NULL,
    room_label text NOT NULL,
    room_category text NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO tmp_archive_room_catalog (sort_order, room_code, room_label, room_category)
  VALUES
    (1, 'R1', 'Room A - Civil Cases', 'Civil Cases'),
    (2, 'R2', 'Room B - Criminal Cases', 'Criminal Cases'),
    (3, 'R3', 'Room C - Succession Cases', 'Succession Cases'),
    (4, 'R4', 'Room D - Commercial Cases', 'Commercial Cases'),
    (5, 'R5', 'Room E - Constitutional Cases', 'Constitutional Cases'),
    (6, 'R6', 'Room F - Probate Cases', 'Probate Cases'),
    (7, 'R7', 'Room G - ELC Cases', 'ELC Cases'),
    (8, 'R8', 'Room H - Traffic Cases', 'Traffic Cases'),
    (9, 'R9', 'Room I - Other Cases', 'Other Cases');

  DELETE FROM public.archive_locations
  WHERE mapping_source = 'generated';
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  FOR room_record IN
    SELECT * FROM tmp_archive_room_catalog ORDER BY sort_order
  LOOP
    INSERT INTO public.archive_locations (
      id, parent_id, level, code, label, capacity, occupied_count, category, active, mapping_source
    )
    VALUES (
      gen_random_uuid(),
      NULL,
      'room',
      room_record.room_code,
      room_record.room_label,
      6000,
      0,
      room_record.room_category,
      true,
      'generated'
    )
    RETURNING id INTO v_room_id;

    FOR bay_index IN 1..2 LOOP
      INSERT INTO public.archive_locations (
        id, parent_id, level, code, label, capacity, occupied_count, category, active, mapping_source
      )
      VALUES (
        gen_random_uuid(),
        v_room_id,
        'bay',
        format('B%s', bay_index),
        format('Bay %s', bay_index),
        3000,
        0,
        room_record.room_category,
        true,
        'generated'
      )
      RETURNING id INTO v_bay_id;

      FOR rack_index IN 1..3 LOOP
        INSERT INTO public.archive_locations (
          id, parent_id, level, code, label, capacity, occupied_count, category, active, mapping_source
        )
        VALUES (
          gen_random_uuid(),
          v_bay_id,
          'rack',
          format('RK%s', rack_index),
          format('Rack %s', rack_index),
          1000,
          0,
          room_record.room_category,
          true,
          'generated'
        )
        RETURNING id INTO v_rack_id;

        FOR shelf_index IN 1..4 LOOP
          INSERT INTO public.archive_locations (
            id, parent_id, level, code, label, capacity, occupied_count, category, active, mapping_source
          )
          VALUES (
            gen_random_uuid(),
            v_rack_id,
            'shelf',
            format('S%s', shelf_index),
            format('Shelf %s', shelf_index),
            250,
            0,
            room_record.room_category,
            true,
            'generated'
          )
          RETURNING id INTO v_shelf_id;

          FOR box_index IN 1..5 LOOP
            INSERT INTO public.archive_locations (
              id, parent_id, level, code, label, capacity, occupied_count, category, active, mapping_source
            )
            VALUES (
              gen_random_uuid(),
              v_shelf_id,
              'box',
              format('BX%s', box_index),
              format('Box %s', box_index),
              50,
              0,
              room_record.room_category,
              true,
              'generated'
            );
          END LOOP;
        END LOOP;
      END LOOP;
    END LOOP;
  END LOOP;

  CREATE TEMP TABLE tmp_generated_boxes ON COMMIT DROP AS
  SELECT
    catalog.room_category,
    box.id AS box_id,
    row_number() OVER (
      PARTITION BY catalog.room_category
      ORDER BY room.code, bay.code, rack.code, shelf.code, box.code
    ) AS box_rank,
    count(*) OVER (PARTITION BY catalog.room_category) AS box_count
  FROM public.archive_locations room
  JOIN tmp_archive_room_catalog catalog
    ON catalog.room_code = room.code
   AND room.level = 'room'
   AND room.mapping_source = 'generated'
  JOIN public.archive_locations bay
    ON bay.parent_id = room.id
   AND bay.mapping_source = 'generated'
  JOIN public.archive_locations rack
    ON rack.parent_id = bay.id
   AND rack.mapping_source = 'generated'
  JOIN public.archive_locations shelf
    ON shelf.parent_id = rack.id
   AND shelf.mapping_source = 'generated'
  JOIN public.archive_locations box
    ON box.parent_id = shelf.id
   AND box.mapping_source = 'generated';

  CREATE TEMP TABLE tmp_generated_case_assignments ON COMMIT DROP AS
  WITH normalized_cases AS (
    SELECT
      c.id AS case_id,
      public.normalize_generated_archive_family(
        c.case_family,
        c.case_type,
        c.case_category_code,
        c.court_division
      ) AS room_category,
      row_number() OVER (
        PARTITION BY public.normalize_generated_archive_family(
          c.case_family,
          c.case_type,
          c.case_category_code,
          c.court_division
        )
        ORDER BY c.year DESC NULLS LAST, c.case_number ASC, c.id
      ) AS case_rank
    FROM public.cases c
    WHERE c.location_id IS NULL
  )
  SELECT
    normalized_cases.case_id,
    box_choice.box_id
  FROM normalized_cases
  JOIN LATERAL (
    SELECT boxes.box_id
    FROM tmp_generated_boxes boxes
    WHERE boxes.room_category = normalized_cases.room_category
      AND boxes.box_rank = ((normalized_cases.case_rank - 1) % boxes.box_count) + 1
    LIMIT 1
  ) AS box_choice ON true;

  UPDATE public.cases c
  SET
    location_id = assignment.box_id,
    shelf_location = public.archive_location_display_path(assignment.box_id)
  FROM tmp_generated_case_assignments assignment
  WHERE c.id = assignment.case_id;
  GET DIAGNOSTICS v_assigned_count = ROW_COUNT;

  UPDATE public.archive_locations
  SET occupied_count = 0
  WHERE mapping_source = 'generated';

  WITH RECURSIVE descendants AS (
    SELECT id AS ancestor_id, id AS descendant_id
    FROM public.archive_locations
    WHERE mapping_source = 'generated'
    UNION ALL
    SELECT descendants.ancestor_id, child.id
    FROM descendants
    JOIN public.archive_locations child
      ON child.parent_id = descendants.descendant_id
     AND child.mapping_source = 'generated'
  ),
  location_counts AS (
    SELECT
      descendants.ancestor_id AS location_id,
      count(c.id)::int AS occupied
    FROM descendants
    LEFT JOIN public.cases c
      ON c.location_id = descendants.descendant_id
    GROUP BY descendants.ancestor_id
  )
  UPDATE public.archive_locations location
  SET occupied_count = COALESCE(location_counts.occupied, 0)
  FROM location_counts
  WHERE location.id = location_counts.location_id
    AND location.mapping_source = 'generated';

  SELECT count(*)::int INTO v_location_count
  FROM public.archive_locations
  WHERE mapping_source = 'generated';

  RETURN jsonb_build_object(
    'generatedLocations', v_location_count,
    'deletedGeneratedLocations', v_deleted_count,
    'assignedCases', v_assigned_count
  );
END;
$$;

COMMENT ON FUNCTION public.refresh_generated_archive_storage_mapping() IS
  'Builds a generated archive room hierarchy and assigns unmapped cases to shelf/box paths deterministically.';

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
  location_source text,
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
    COALESCE(al.mapping_source, 'verified'),
    count(*) OVER ()
  FROM public.cases c
  LEFT JOIN public.case_categories cc ON cc.code = c.case_category_code
  LEFT JOIN public.archive_locations al ON al.id = c.location_id
  WHERE c.location_id IS NOT NULL
  ORDER BY c.case_number ASC
  LIMIT LEAST(500, GREATEST(1, COALESCE(NULLIF(result_limit, 0), 300)))
  OFFSET GREATEST(COALESCE(result_offset, 0), 0);
$$;

GRANT EXECUTE ON FUNCTION public.list_archive_stored_cases(integer, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.refresh_generated_archive_storage_mapping() TO authenticated, service_role;

UPDATE public.notices
SET
  title = 'Archive Storage Mapping Ready',
  body = 'System-generated archive rooms, shelves, and boxes are now assigned to the imported CTS closed-case dataset for operational planning.'
WHERE title = 'Archive Metadata Follow-up';

UPDATE public.broadcasts
SET
  message = 'Location assignments for imported CTS cases are now generated for planning and should be verified against the physical registry progressively.'
WHERE title = 'Archive room metadata capture';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.cases)
     AND NOT EXISTS (SELECT 1 FROM public.cases WHERE location_id IS NOT NULL)
  THEN
    PERFORM public.refresh_generated_archive_storage_mapping();
  END IF;
END $$;
