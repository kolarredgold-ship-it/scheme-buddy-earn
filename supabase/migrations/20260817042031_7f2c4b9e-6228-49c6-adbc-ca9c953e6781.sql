WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY lower(trim(title)), coalesce(state,'')
           ORDER BY created_at ASC, id ASC
         ) rn
  FROM public.schemes
)
DELETE FROM public.schemes s USING ranked r
WHERE s.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS schemes_unique_title_state
  ON public.schemes (lower(trim(title)), coalesce(state,''));