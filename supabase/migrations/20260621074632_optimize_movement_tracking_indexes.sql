-- Improve movement history and open-checkout lookup performance.

CREATE INDEX IF NOT EXISTS idx_file_movements_created_at_desc
  ON public.file_movements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_file_movements_open_created_at_desc
  ON public.file_movements(created_at DESC)
  WHERE status IN ('checked_out', 'in_transit', 'overdue');
