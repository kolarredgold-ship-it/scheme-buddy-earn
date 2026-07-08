
-- 1) Extend career_progress protection to include current_step and daily_promotions
CREATE OR REPLACE FUNCTION public.protect_career_progress_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF NEW.streak_days IS DISTINCT FROM OLD.streak_days
     OR NEW.total_promotions IS DISTINCT FROM OLD.total_promotions
     OR NEW.total_active_days IS DISTINCT FROM OLD.total_active_days
     OR NEW.daily_promotions IS DISTINCT FROM OLD.daily_promotions
     OR NEW.last_promotion_date IS DISTINCT FROM OLD.last_promotion_date
     OR NEW.current_step IS DISTINCT FROM OLD.current_step
     OR NEW.eligible IS DISTINCT FROM OLD.eligible THEN
    RAISE EXCEPTION 'You cannot modify progress metrics. These are managed server-side.';
  END IF;
  RETURN NEW;
END;
$function$;

-- Also block direct INSERT of inflated values (users can insert their own row on registration)
CREATE OR REPLACE FUNCTION public.protect_career_progress_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  NEW.streak_days := 0;
  NEW.total_promotions := 0;
  NEW.total_active_days := 0;
  NEW.daily_promotions := 0;
  NEW.last_promotion_date := NULL;
  NEW.eligible := false;
  IF NEW.current_step IS NULL OR NEW.current_step < 1 THEN
    NEW.current_step := 1;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS protect_career_progress_insert_trg ON public.career_progress;
CREATE TRIGGER protect_career_progress_insert_trg
  BEFORE INSERT ON public.career_progress
  FOR EACH ROW EXECUTE FUNCTION public.protect_career_progress_insert();

-- 2) Add WITH CHECK to the user UPDATE policy on career_progress so ownership is enforced on new row too
DROP POLICY IF EXISTS "Users can update their own progress" ON public.career_progress;
CREATE POLICY "Users can update their own progress" ON public.career_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3) interview_questions: restrict to authenticated users only (was USING true / public)
DROP POLICY IF EXISTS "Anyone can read interview questions" ON public.interview_questions;
CREATE POLICY "Authenticated users can read interview questions"
  ON public.interview_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- 4) tool_clicks: prevent forging user_id in INSERT (must be null or the caller's uid)
DROP POLICY IF EXISTS "Anyone can record a click" ON public.tool_clicks;
CREATE POLICY "Callers can record their own clicks"
  ON public.tool_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 5) Fix mutable search_path on canonical_tool_keys
CREATE OR REPLACE FUNCTION public.canonical_tool_keys()
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $function$
  SELECT ARRAY[
    'full',
    'quick',
    'mock-interview',
    'live-hr-interview',
    'student:resume-builder',
    'student:cover-letter',
    'student:resume-analyzer',
    'student:career-advisor',
    'student:hr-interview',
    'student:flash-cards',
    'student:sop-generator',
    'student:essay',
    'student:ppt-outline'
  ]::TEXT[];
$function$;
