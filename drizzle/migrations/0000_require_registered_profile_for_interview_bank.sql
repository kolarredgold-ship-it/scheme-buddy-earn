DROP POLICY IF EXISTS "Authenticated users can read interview questions" ON public.interview_questions;
CREATE POLICY "Registered members can read interview questions" ON public.interview_questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles AS member_profile WHERE member_profile.user_id = (SELECT auth.uid())));
REVOKE ALL ON public.interview_questions FROM anon;
GRANT SELECT ON public.interview_questions TO authenticated;
GRANT ALL ON public.interview_questions TO service_role;