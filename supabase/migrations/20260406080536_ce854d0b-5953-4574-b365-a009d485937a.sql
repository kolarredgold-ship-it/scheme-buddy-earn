CREATE TABLE public.report_generations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  report_type text NOT NULL DEFAULT 'full',
  form_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.report_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generations" ON public.report_generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own generations" ON public.report_generations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all generations" ON public.report_generations FOR SELECT USING (public.has_role(auth.uid(), 'admin'));