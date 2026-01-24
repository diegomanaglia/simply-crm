-- Tabela para configurações do Google Analytics
CREATE TABLE public.analytics_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ga4_measurement_id TEXT,
  tracking_enabled BOOLEAN NOT NULL DEFAULT false,
  goals_configured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para eventos de analytics internos (para relatórios)
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  event_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  pipeline_id TEXT,
  deal_id TEXT,
  source TEXT,
  campaign TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para queries eficientes
CREATE INDEX idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_events_source ON public.analytics_events(source);

-- Trigger para updated_at
CREATE TRIGGER update_analytics_settings_updated_at
  BEFORE UPDATE ON public.analytics_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.analytics_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para CRM single-tenant
CREATE POLICY "Allow all on analytics_settings" ON public.analytics_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on analytics_events" ON public.analytics_events FOR ALL USING (true) WITH CHECK (true);

-- Inserir configuração inicial
INSERT INTO public.analytics_settings (tracking_enabled) VALUES (false);