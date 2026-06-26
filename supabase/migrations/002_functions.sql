-- ============================================================
-- File: supabase/migrations/002_functions.sql
-- FOXAI Portal v1.0 — Helper Functions
-- ============================================================

-- Atomic view count increment (avoids read-then-write race condition)
CREATE OR REPLACE FUNCTION increment_view_count(solution_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE solutions
  SET view_count = view_count + 1
  WHERE id = solution_id;
$$;

-- Allow any authenticated user to call this function
GRANT EXECUTE ON FUNCTION increment_view_count(uuid) TO authenticated;
