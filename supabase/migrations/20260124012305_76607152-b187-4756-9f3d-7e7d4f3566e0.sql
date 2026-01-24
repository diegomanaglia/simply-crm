-- Webhooks table (outbound)
CREATE TABLE public.webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'POST' CHECK (method IN ('POST', 'PUT')),
  headers JSONB DEFAULT '{}'::jsonb,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret_key TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  ip_whitelist TEXT[] DEFAULT NULL,
  retry_enabled BOOLEAN NOT NULL DEFAULT true,
  max_retries INTEGER NOT NULL DEFAULT 3,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  last_success_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Webhook execution logs
CREATE TABLE public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  attempt INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inbound webhooks table
CREATE TABLE public.inbound_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pipeline_id TEXT NOT NULL,
  phase_id TEXT,
  secret_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  field_mappings JSONB NOT NULL DEFAULT '[]'::jsonb,
  default_tags TEXT[] DEFAULT ARRAY['Webhook']::text[],
  default_temperature TEXT DEFAULT 'warm',
  hmac_secret TEXT,
  ip_whitelist TEXT[] DEFAULT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  requests_today INTEGER NOT NULL DEFAULT 0,
  last_request_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inbound webhook logs
CREATE TABLE public.inbound_webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inbound_webhook_id UUID NOT NULL REFERENCES public.inbound_webhooks(id) ON DELETE CASCADE,
  source_ip TEXT,
  payload JSONB NOT NULL,
  mapped_data JSONB,
  deal_created_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('success', 'failed', 'rejected')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for single-tenant CRM)
CREATE POLICY "Allow all on webhooks" ON public.webhooks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on webhook_logs" ON public.webhook_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on inbound_webhooks" ON public.inbound_webhooks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on inbound_webhook_logs" ON public.inbound_webhook_logs FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_webhook_logs_webhook_id ON public.webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_created_at ON public.webhook_logs(created_at DESC);
CREATE INDEX idx_inbound_webhook_logs_webhook_id ON public.inbound_webhook_logs(inbound_webhook_id);
CREATE INDEX idx_inbound_webhook_logs_created_at ON public.inbound_webhook_logs(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_webhooks_updated_at
  BEFORE UPDATE ON public.webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inbound_webhooks_updated_at
  BEFORE UPDATE ON public.inbound_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();