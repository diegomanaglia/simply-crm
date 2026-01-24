-- Tabela para integrações do Google
CREATE TABLE public.google_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  user_picture TEXT,
  ads_accounts JSONB DEFAULT '[]'::jsonb,
  selected_account_id TEXT,
  status TEXT NOT NULL DEFAULT 'connected',
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  token_expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para mapeamento de campanhas
CREATE TABLE public.google_campaign_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.google_integrations(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  pipeline_id TEXT NOT NULL,
  phase_id TEXT,
  auto_tags TEXT[] DEFAULT ARRAY['Google Ads']::text[],
  default_temperature TEXT DEFAULT 'warm',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id)
);

-- Tabela para métricas históricas do Google Ads
CREATE TABLE public.google_ads_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.google_integrations(id) ON DELETE CASCADE,
  campaign_id TEXT,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  cost_micros BIGINT DEFAULT 0,
  conversions NUMERIC(10,2) DEFAULT 0,
  conversion_value NUMERIC(12,2) DEFAULT 0,
  ctr NUMERIC(5,4) DEFAULT 0,
  avg_cpc_micros BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(integration_id, campaign_id, date)
);

-- Tabela para conversões offline enviadas
CREATE TABLE public.google_offline_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.google_integrations(id) ON DELETE CASCADE,
  deal_id TEXT NOT NULL,
  gclid TEXT NOT NULL,
  conversion_name TEXT NOT NULL DEFAULT 'CRM_Lead_Ganho',
  conversion_value NUMERIC(12,2) NOT NULL,
  conversion_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  google_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(deal_id)
);

-- Tabela para logs de sincronização do Google
CREATE TABLE public.google_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.google_integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL DEFAULT 'metrics',
  status TEXT NOT NULL DEFAULT 'success',
  records_synced INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Triggers para updated_at
CREATE TRIGGER update_google_integrations_updated_at
  BEFORE UPDATE ON public.google_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_google_campaign_mappings_updated_at
  BEFORE UPDATE ON public.google_campaign_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_campaign_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_ads_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_offline_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_sync_logs ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para CRM single-tenant
CREATE POLICY "Allow all on google_integrations" ON public.google_integrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on google_campaign_mappings" ON public.google_campaign_mappings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on google_ads_metrics" ON public.google_ads_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on google_offline_conversions" ON public.google_offline_conversions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on google_sync_logs" ON public.google_sync_logs FOR ALL USING (true) WITH CHECK (true);