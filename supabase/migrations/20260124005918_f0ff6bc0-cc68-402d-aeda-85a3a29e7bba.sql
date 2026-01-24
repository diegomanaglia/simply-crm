-- Habilitar RLS em todas as tabelas
ALTER TABLE public.facebook_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_form_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_sync_logs ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para CRM single-tenant (sem autenticação multi-usuário)
-- Estas políticas permitem acesso total, apropriado para aplicação interna

-- facebook_integrations
CREATE POLICY "Allow all operations on facebook_integrations"
  ON public.facebook_integrations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- facebook_form_mappings  
CREATE POLICY "Allow all operations on facebook_form_mappings"
  ON public.facebook_form_mappings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- facebook_sync_logs
CREATE POLICY "Allow all operations on facebook_sync_logs"
  ON public.facebook_sync_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);