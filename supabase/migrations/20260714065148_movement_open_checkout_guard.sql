CREATE UNIQUE INDEX IF NOT EXISTS idx_file_movements_one_open_per_case
  ON public.file_movements (case_id)
  WHERE status IN ('checked_out', 'in_transit', 'overdue');;
