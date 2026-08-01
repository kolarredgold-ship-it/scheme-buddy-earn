CREATE INDEX IF NOT EXISTS idx_schemes_created_at_desc ON public.schemes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_schemes_category_created_at ON public.schemes (category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_schemes_state_created_at ON public.schemes (state, created_at DESC);