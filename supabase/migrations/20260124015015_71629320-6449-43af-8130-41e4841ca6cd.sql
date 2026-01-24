-- Drop all overly permissive policies
DROP POLICY IF EXISTS "Allow all on webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Allow all on inbound_webhooks" ON public.inbound_webhooks;
DROP POLICY IF EXISTS "Allow all on analytics_settings" ON public.analytics_settings;
DROP POLICY IF EXISTS "Allow all on google_integrations" ON public.google_integrations;
DROP POLICY IF EXISTS "Allow all operations on facebook_integrations" ON public.facebook_integrations;
DROP POLICY IF EXISTS "Allow all on analytics_events" ON public.analytics_events;
DROP POLICY IF EXISTS "Allow all on google_ads_metrics" ON public.google_ads_metrics;
DROP POLICY IF EXISTS "Allow all on google_campaign_mappings" ON public.google_campaign_mappings;
DROP POLICY IF EXISTS "Allow all on google_offline_conversions" ON public.google_offline_conversions;
DROP POLICY IF EXISTS "Allow all on google_sync_logs" ON public.google_sync_logs;
DROP POLICY IF EXISTS "Allow all operations on facebook_form_mappings" ON public.facebook_form_mappings;
DROP POLICY IF EXISTS "Allow all operations on facebook_sync_logs" ON public.facebook_sync_logs;
DROP POLICY IF EXISTS "Allow all on webhook_logs" ON public.webhook_logs;
DROP POLICY IF EXISTS "Allow all on inbound_webhook_logs" ON public.inbound_webhook_logs;

-- Webhooks RLS policies
CREATE POLICY "Users can view their own webhooks" ON public.webhooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own webhooks" ON public.webhooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own webhooks" ON public.webhooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own webhooks" ON public.webhooks FOR DELETE USING (auth.uid() = user_id);

-- Inbound webhooks RLS policies
CREATE POLICY "Users can view their own inbound webhooks" ON public.inbound_webhooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own inbound webhooks" ON public.inbound_webhooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own inbound webhooks" ON public.inbound_webhooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own inbound webhooks" ON public.inbound_webhooks FOR DELETE USING (auth.uid() = user_id);

-- Analytics settings RLS policies
CREATE POLICY "Users can view their own analytics settings" ON public.analytics_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own analytics settings" ON public.analytics_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own analytics settings" ON public.analytics_settings FOR UPDATE USING (auth.uid() = user_id);

-- Google integrations RLS policies
CREATE POLICY "Users can view their own google integrations" ON public.google_integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own google integrations" ON public.google_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own google integrations" ON public.google_integrations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own google integrations" ON public.google_integrations FOR DELETE USING (auth.uid() = user_id);

-- Facebook integrations RLS policies (using owner_id)
CREATE POLICY "Users can view their own facebook integrations" ON public.facebook_integrations FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert their own facebook integrations" ON public.facebook_integrations FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own facebook integrations" ON public.facebook_integrations FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own facebook integrations" ON public.facebook_integrations FOR DELETE USING (auth.uid() = owner_id);

-- Webhook logs - accessible via webhook ownership
CREATE POLICY "Users can view logs for their webhooks" ON public.webhook_logs FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.webhooks w WHERE w.id = webhook_id AND w.user_id = auth.uid()));
CREATE POLICY "Service role can insert webhook logs" ON public.webhook_logs FOR INSERT WITH CHECK (true);

-- Inbound webhook logs - accessible via inbound webhook ownership  
CREATE POLICY "Users can view logs for their inbound webhooks" ON public.inbound_webhook_logs FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.inbound_webhooks iw WHERE iw.id = inbound_webhook_id AND iw.user_id = auth.uid()));
CREATE POLICY "Service role can insert inbound webhook logs" ON public.inbound_webhook_logs FOR INSERT WITH CHECK (true);

-- Google-related tables via integration ownership
CREATE POLICY "Users can view their google ads metrics" ON public.google_ads_metrics FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.google_integrations gi WHERE gi.id = integration_id AND gi.user_id = auth.uid()));
CREATE POLICY "Service role can insert google ads metrics" ON public.google_ads_metrics FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their google campaign mappings" ON public.google_campaign_mappings FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.google_integrations gi WHERE gi.id = integration_id AND gi.user_id = auth.uid()));
CREATE POLICY "Users can insert their google campaign mappings" ON public.google_campaign_mappings FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.google_integrations gi WHERE gi.id = integration_id AND gi.user_id = auth.uid()));
CREATE POLICY "Users can update their google campaign mappings" ON public.google_campaign_mappings FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.google_integrations gi WHERE gi.id = integration_id AND gi.user_id = auth.uid()));
CREATE POLICY "Users can delete their google campaign mappings" ON public.google_campaign_mappings FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.google_integrations gi WHERE gi.id = integration_id AND gi.user_id = auth.uid()));

CREATE POLICY "Users can view their google offline conversions" ON public.google_offline_conversions FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.google_integrations gi WHERE gi.id = integration_id AND gi.user_id = auth.uid()));
CREATE POLICY "Service role can insert google offline conversions" ON public.google_offline_conversions FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their google sync logs" ON public.google_sync_logs FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.google_integrations gi WHERE gi.id = integration_id AND gi.user_id = auth.uid()));
CREATE POLICY "Service role can insert google sync logs" ON public.google_sync_logs FOR INSERT WITH CHECK (true);

-- Facebook-related tables via integration ownership
CREATE POLICY "Users can view their facebook form mappings" ON public.facebook_form_mappings FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.facebook_integrations fi WHERE fi.id = integration_id AND fi.owner_id = auth.uid()));
CREATE POLICY "Users can insert their facebook form mappings" ON public.facebook_form_mappings FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.facebook_integrations fi WHERE fi.id = integration_id AND fi.owner_id = auth.uid()));
CREATE POLICY "Users can update their facebook form mappings" ON public.facebook_form_mappings FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.facebook_integrations fi WHERE fi.id = integration_id AND fi.owner_id = auth.uid()));
CREATE POLICY "Users can delete their facebook form mappings" ON public.facebook_form_mappings FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.facebook_integrations fi WHERE fi.id = integration_id AND fi.owner_id = auth.uid()));

CREATE POLICY "Users can view their facebook sync logs" ON public.facebook_sync_logs FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.facebook_integrations fi WHERE fi.id = integration_id AND fi.owner_id = auth.uid()));
CREATE POLICY "Service role can insert facebook sync logs" ON public.facebook_sync_logs FOR INSERT WITH CHECK (true);

-- Analytics events - public for tracking (this is intentional for analytics collection)
CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can view analytics events" ON public.analytics_events FOR SELECT USING (auth.role() = 'authenticated');