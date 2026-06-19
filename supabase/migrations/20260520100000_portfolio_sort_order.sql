-- Manual order for portfolio listing (admin drag-and-drop).
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
    ) - 1 AS ord
  FROM portfolios
)
UPDATE portfolios p
SET sort_order = ranked.ord
FROM ranked
WHERE p.id = ranked.id;
