
CREATE TABLE public.interview_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read interview questions"
  ON public.interview_questions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage interview questions"
  ON public.interview_questions
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
