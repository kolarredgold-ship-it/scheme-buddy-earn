-- User preferences for personalized scheme feeds
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  preferred_state TEXT DEFAULT 'all',
  preferred_categories TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
ON public.user_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Scheme notifications
CREATE TABLE public.scheme_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scheme_id UUID REFERENCES public.schemes(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.scheme_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view notifications"
ON public.scheme_notifications FOR SELECT
USING (true);

CREATE POLICY "Service role can insert notifications"
ON public.scheme_notifications FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on user_preferences
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add tags column to schemes table for AI-generated tags
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add beneficiary_type column
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS beneficiary_type TEXT;

-- Add source_website column
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS source_website TEXT;

-- Add is_active column
ALTER TABLE public.schemes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.scheme_notifications;