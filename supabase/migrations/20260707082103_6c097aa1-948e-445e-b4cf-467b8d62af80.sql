
CREATE TABLE public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  focus_keyword TEXT,
  secondary_keywords TEXT[] DEFAULT '{}',
  category TEXT,
  author TEXT DEFAULT 'Techrola Editorial',
  reading_time INT DEFAULT 8,
  featured_image_url TEXT,
  featured_image_prompt TEXT,
  hook TEXT,
  excerpt TEXT,
  body_markdown TEXT NOT NULL,
  faq JSONB DEFAULT '[]'::jsonb,
  social_captions JSONB DEFAULT '{}'::jsonb,
  internal_links JSONB DEFAULT '[]'::jsonb,
  related_articles JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'published',
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.blogs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blogs TO authenticated;
GRANT ALL ON public.blogs TO service_role;

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published blogs are viewable by everyone"
  ON public.blogs FOR SELECT
  USING (status = 'published' OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert blogs"
  ON public.blogs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update blogs"
  ON public.blogs FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete blogs"
  ON public.blogs FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX blogs_status_published_at_idx ON public.blogs (status, published_at DESC);
CREATE INDEX blogs_category_idx ON public.blogs (category);

CREATE TRIGGER blogs_updated_at
  BEFORE UPDATE ON public.blogs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SECURITY FIX: career_progress ============
CREATE OR REPLACE FUNCTION public.protect_career_progress_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.streak_days IS DISTINCT FROM OLD.streak_days
     OR NEW.total_promotions IS DISTINCT FROM OLD.total_promotions
     OR NEW.eligible IS DISTINCT FROM OLD.eligible THEN
    RAISE EXCEPTION 'You cannot modify streak_days, total_promotions, or eligible. These are managed server-side.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_career_progress_metrics_trg ON public.career_progress;
CREATE TRIGGER protect_career_progress_metrics_trg
  BEFORE UPDATE ON public.career_progress
  FOR EACH ROW EXECUTE FUNCTION public.protect_career_progress_metrics();
