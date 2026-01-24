import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FacebookIntegration, FacebookFormMapping, FacebookSyncLog, FacebookPage, FacebookLeadForm } from '@/types/facebook';
import { toast } from 'sonner';

const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || '';

export function useFacebookIntegration() {
  const [integration, setIntegration] = useState<FacebookIntegration | null>(null);
  const [formMappings, setFormMappings] = useState<FacebookFormMapping[]>([]);
  const [syncLogs, setSyncLogs] = useState<FacebookSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Fetch integration data
  const fetchIntegration = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('facebook_integrations')
        .select('*')
        .order('connected_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Safely parse pages JSON
        let parsedPages: FacebookPage[] = [];
        if (data.pages && Array.isArray(data.pages)) {
          parsedPages = data.pages as unknown as FacebookPage[];
        }
        
        setIntegration({
          ...data,
          pages: parsedPages,
          status: data.status as 'connected' | 'disconnected' | 'error',
        });
      } else {
        setIntegration(null);
      }
    } catch (error) {
      console.error('Error fetching Facebook integration:', error);
    }
  }, []);

  // Fetch form mappings
  const fetchFormMappings = useCallback(async () => {
    if (!integration?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('facebook_form_mappings')
        .select('*')
        .eq('integration_id', integration.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setFormMappings((data || []).map(m => ({
        ...m,
        auto_tags: m.auto_tags || [],
        default_temperature: (m.default_temperature as 'cold' | 'warm' | 'hot') || 'warm',
      })));
    } catch (error) {
      console.error('Error fetching form mappings:', error);
    }
  }, [integration?.id]);

  // Fetch sync logs
  const fetchSyncLogs = useCallback(async () => {
    if (!integration?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('facebook_sync_logs')
        .select('*')
        .eq('integration_id', integration.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setSyncLogs((data || []).map(l => ({
        ...l,
        sync_type: l.sync_type as 'auto' | 'manual',
        status: l.status as 'success' | 'error' | 'partial',
        errors: (l.errors as Array<{ message: string; lead_id?: string }>) || [],
      })));
    } catch (error) {
      console.error('Error fetching sync logs:', error);
    }
  }, [integration?.id]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchIntegration();
      setLoading(false);
    };
    load();
  }, [fetchIntegration]);

  // Load mappings and logs when integration changes
  useEffect(() => {
    if (integration) {
      fetchFormMappings();
      fetchSyncLogs();
    }
  }, [integration, fetchFormMappings, fetchSyncLogs]);

  // Connect Facebook
  const connectFacebook = useCallback(() => {
    if (!FACEBOOK_APP_ID) {
      toast.error('Facebook App ID não configurado');
      return;
    }

    const redirectUri = `${window.location.origin}/integrations/facebook/callback`;
    const scope = 'leads_retrieval,pages_show_list,pages_read_engagement,ads_read';
    
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${FACEBOOK_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scope}` +
      `&response_type=code`;

    window.location.href = authUrl;
  }, []);

  // Disconnect Facebook
  const disconnectFacebook = useCallback(async () => {
    if (!integration?.id) return;

    try {
      const { error } = await supabase
        .from('facebook_integrations')
        .update({ status: 'disconnected' })
        .eq('id', integration.id);

      if (error) throw error;
      
      toast.success('Facebook desconectado com sucesso');
      await fetchIntegration();
    } catch (error) {
      console.error('Error disconnecting Facebook:', error);
      toast.error('Erro ao desconectar Facebook');
    }
  }, [integration?.id, fetchIntegration]);

  // Save form mapping
  const saveFormMapping = useCallback(async (mapping: Partial<FacebookFormMapping>) => {
    if (!integration?.id) return;

    try {
      if (mapping.id) {
        const { error } = await supabase
          .from('facebook_form_mappings')
          .update({
            pipeline_id: mapping.pipeline_id,
            phase_id: mapping.phase_id,
            auto_tags: mapping.auto_tags,
            default_temperature: mapping.default_temperature,
            is_active: mapping.is_active,
          })
          .eq('id', mapping.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('facebook_form_mappings')
          .insert({
            integration_id: integration.id,
            form_id: mapping.form_id!,
            form_name: mapping.form_name!,
            page_id: mapping.page_id!,
            page_name: mapping.page_name!,
            pipeline_id: mapping.pipeline_id!,
            phase_id: mapping.phase_id,
            auto_tags: mapping.auto_tags || ['Facebook Leads'],
            default_temperature: mapping.default_temperature || 'warm',
            is_active: true,
          });

        if (error) throw error;
      }

      toast.success('Mapeamento salvo com sucesso');
      await fetchFormMappings();
    } catch (error) {
      console.error('Error saving form mapping:', error);
      toast.error('Erro ao salvar mapeamento');
    }
  }, [integration?.id, fetchFormMappings]);

  // Delete form mapping
  const deleteFormMapping = useCallback(async (mappingId: string) => {
    try {
      const { error } = await supabase
        .from('facebook_form_mappings')
        .delete()
        .eq('id', mappingId);

      if (error) throw error;
      
      toast.success('Mapeamento removido');
      await fetchFormMappings();
    } catch (error) {
      console.error('Error deleting form mapping:', error);
      toast.error('Erro ao remover mapeamento');
    }
  }, [fetchFormMappings]);

  // Trigger manual sync
  const triggerSync = useCallback(async () => {
    if (!integration?.id) return;
    
    setSyncing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            integration_id: integration.id,
            sync_type: 'manual',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const result = await response.json();
      toast.success(`Sincronização concluída: ${result.leads_imported} leads importados`);
      
      await fetchSyncLogs();
    } catch (error) {
      console.error('Error triggering sync:', error);
      toast.error('Erro na sincronização');
    } finally {
      setSyncing(false);
    }
  }, [integration?.id, fetchSyncLogs]);

  return {
    integration,
    formMappings,
    syncLogs,
    loading,
    syncing,
    connectFacebook,
    disconnectFacebook,
    saveFormMapping,
    deleteFormMapping,
    triggerSync,
    refetch: fetchIntegration,
  };
}
