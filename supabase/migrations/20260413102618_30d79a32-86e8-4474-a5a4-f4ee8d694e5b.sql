
-- Add slug column if not exists
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS slug TEXT;

-- Generate base slugs
UPDATE public.schemes 
SET slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ),
    '-+', '-', 'g'
  )
);

-- Fix duplicates by appending row number
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
  FROM public.schemes
)
UPDATE public.schemes s
SET slug = s.slug || '-' || r.rn
FROM ranked r
WHERE s.id = r.id AND r.rn > 1;

-- Make not null
ALTER TABLE public.schemes ALTER COLUMN slug SET NOT NULL;

-- Unique index
CREATE UNIQUE INDEX idx_schemes_slug ON public.schemes(slug);

-- Auto-generate slug trigger
CREATE OR REPLACE FUNCTION public.generate_scheme_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := lower(regexp_replace(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'), '-+', '-', 'g'));
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.schemes WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS set_scheme_slug ON public.schemes;
CREATE TRIGGER set_scheme_slug
BEFORE INSERT ON public.schemes
FOR EACH ROW
EXECUTE FUNCTION public.generate_scheme_slug();
