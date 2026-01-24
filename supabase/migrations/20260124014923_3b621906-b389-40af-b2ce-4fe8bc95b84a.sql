-- Add user_id/owner_id columns to tables
ALTER TABLE public.webhooks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.inbound_webhooks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.analytics_settings ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.google_integrations ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.facebook_integrations ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_webhooks_user_id ON public.webhooks(user_id);
CREATE INDEX idx_inbound_webhooks_user_id ON public.inbound_webhooks(user_id);
CREATE INDEX idx_analytics_settings_user_id ON public.analytics_settings(user_id);
CREATE INDEX idx_google_integrations_user_id ON public.google_integrations(user_id);
CREATE INDEX idx_facebook_integrations_owner_id ON public.facebook_integrations(owner_id);