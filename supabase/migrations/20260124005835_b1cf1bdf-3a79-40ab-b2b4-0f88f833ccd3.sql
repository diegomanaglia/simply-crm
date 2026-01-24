-- Enum para status de conexão
CREATE TYPE public.integration_status AS ENUM ('connected', 'disconnected', 'error');

-- Tabela para integrações do Facebook
CREATE TABLE public.facebook_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  access_token TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_picture TEXT,
  pages JSONB DEFAULT '[]'::jsonb,
  status integration_status NOT NULL DEFAULT 'connected',
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para mapeamento de formulários do Facebook para pipelines
CREATE TABLE public.facebook_form_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.facebook_integrations(id) ON DELETE CASCADE,
  form_id TEXT NOT NULL,
  form_name TEXT NOT NULL,
  page_id TEXT NOT NULL,
  page_name TEXT NOT NULL,
  pipeline_id TEXT NOT NULL,
  phase_id TEXT,
  auto_tags TEXT[] DEFAULT ARRAY['Facebook Leads']::text[],
  default_temperature TEXT DEFAULT 'warm',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(form_id)
);

-- Tabela para log de sincronizações
CREATE TABLE public.facebook_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.facebook_integrations(id) ON DELETE CASCADE,
  form_mapping_id UUID REFERENCES public.facebook_form_mappings(id) ON DELETE SET NULL,
  sync_type TEXT NOT NULL DEFAULT 'auto',
  leads_imported INTEGER NOT NULL DEFAULT 0,
  leads_duplicates INTEGER NOT NULL DEFAULT 0,
  errors JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'success',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_facebook_integrations_updated_at
  BEFORE UPDATE ON public.facebook_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_facebook_form_mappings_updated_at
  BEFORE UPDATE ON public.facebook_form_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Nota: RLS não é necessário pois este é um CRM local sem autenticação multi-usuário
-- Os dados são acessíveis globalmente dentro da aplicação