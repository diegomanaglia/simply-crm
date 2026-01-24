import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  GoogleIntegration, 
  GoogleCampaignMapping, 
  GoogleAdsMetrics,
  GoogleSyncLog,
  GoogleAdsAccount,
  GoogleAdsReportMetrics 
} from '@/types/google';
import { toast } from 'sonner';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function useGoogleIntegration() {
  const [integration, setIntegration] = useState<GoogleIntegration | null>(null);
  const [campaignMappings, setCampaignMappings] = useState<GoogleCampaignMapping[]>([]);
  const [syncLogs, setSyncLogs] = useState<GoogleSyncLog[]>([]);
  const [metrics, setMetrics] = useState<GoogleAdsMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Fetch integration
  const fetchIntegration = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('google_integrations')
        .select('*')
        .order('connected_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        let parsedAccounts: GoogleAdsAccount[] = [];
        if (data.ads_accounts && Array.isArray(data.ads_accounts)) {
          parsedAccounts = data.ads_accounts as unknown as GoogleAdsAccount[];
        }
        
        setIntegration({
          ...data,
          ads_accounts: parsedAccounts,
          status: data.status as 'connected' | 'disconnected' | 'error',
        });
      } else {
        setIntegration(null);
      }
    } catch (error) {
      console.error('Error fetching Google integration:', error);
    }
  }, []);

  // Fetch campaign mappings
  const fetchCampaignMappings = useCallback(async () => {
    if (!integration?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('google_campaign_mappings')
        .select('*')
        .eq('integration_id', integration.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setCampaignMappings((data || []).map(m => ({
        ...m,
        auto_tags: m.auto_tags || [],
        default_temperature: (m.default_temperature as 'cold' | 'warm' | 'hot') || 'warm',
      })));
    } catch (error) {
      console.error('Error fetching campaign mappings:', error);
    }
  }, [integration?.id]);

  // Fetch sync logs
  const fetchSyncLogs = useCallback(async () => {
    if (!integration?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('google_sync_logs')
        .select('*')
        .eq('integration_id', integration.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      setSyncLogs((data || []).map(l => ({
        ...l,
        sync_type: l.sync_type as 'metrics' | 'campaigns' | 'conversions',
        status: l.status as 'success' | 'error' | 'partial',
        errors: (l.errors as Array<{ message: string }>) || [],
      })));
    } catch (error) {
      console.error('Error fetching sync logs:', error);
    }
  }, [integration?.id]);

  // Fetch metrics
  const fetchMetrics = useCallback(async (startDate?: string, endDate?: string) => {
    if (!integration?.id) return;
    
    try {
      let query = supabase
        .from('google_ads_metrics')
        .select('*')
        .eq('integration_id', integration.id)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query.limit(365);

      if (error) throw error;
      
      setMetrics((data || []).map(m => ({
        ...m,
        cost_micros: Number(m.cost_micros) || 0,
        avg_cpc_micros: Number(m.avg_cpc_micros) || 0,
        conversions: Number(m.conversions) || 0,
        conversion_value: Number(m.conversion_value) || 0,
        ctr: Number(m.ctr) || 0,
      })));
    } catch (error) {
      console.error('Error fetching metrics:', error);
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

  // Load related data when integration changes
  useEffect(() => {
    if (integration) {
      fetchCampaignMappings();
      fetchSyncLogs();
      fetchMetrics();
    }
  }, [integration, fetchCampaignMappings, fetchSyncLogs, fetchMetrics]);

  // Connect Google
  const connectGoogle = useCallback(() => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google Client ID não configurado');
      return;
    }

    const redirectUri = `${window.location.origin}/integrations/google/callback`;
    const scope = encodeURIComponent('https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/analytics.readonly openid email profile');
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${scope}` +
      `&response_type=code` +
      `&access_type=offline` +
      `&prompt=consent`;

    window.location.href = authUrl;
  }, []);

  // Disconnect Google
  const disconnectGoogle = useCallback(async () => {
    if (!integration?.id) return;

    try {
      const { error } = await supabase
        .from('google_integrations')
        .update({ status: 'disconnected' })
        .eq('id', integration.id);

      if (error) throw error;
      
      toast.success('Google desconectado com sucesso');
      await fetchIntegration();
    } catch (error) {
      console.error('Error disconnecting Google:', error);
      toast.error('Erro ao desconectar Google');
    }
  }, [integration?.id, fetchIntegration]);

  // Select ads account
  const selectAdsAccount = useCallback(async (accountId: string) => {
    if (!integration?.id) return;

    try {
      const { error } = await supabase
        .from('google_integrations')
        .update({ selected_account_id: accountId })
        .eq('id', integration.id);

      if (error) throw error;
      
      toast.success('Conta selecionada');
      await fetchIntegration();
    } catch (error) {
      console.error('Error selecting account:', error);
      toast.error('Erro ao selecionar conta');
    }
  }, [integration?.id, fetchIntegration]);

  // Save campaign mapping
  const saveCampaignMapping = useCallback(async (mapping: Partial<GoogleCampaignMapping>) => {
    if (!integration?.id) return;

    try {
      if (mapping.id) {
        const { error } = await supabase
          .from('google_campaign_mappings')
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
          .from('google_campaign_mappings')
          .insert({
            integration_id: integration.id,
            campaign_id: mapping.campaign_id!,
            campaign_name: mapping.campaign_name!,
            pipeline_id: mapping.pipeline_id!,
            phase_id: mapping.phase_id,
            auto_tags: mapping.auto_tags || ['Google Ads'],
            default_temperature: mapping.default_temperature || 'warm',
            is_active: true,
          });

        if (error) throw error;
      }

      toast.success('Mapeamento salvo');
      await fetchCampaignMappings();
    } catch (error) {
      console.error('Error saving mapping:', error);
      toast.error('Erro ao salvar mapeamento');
    }
  }, [integration?.id, fetchCampaignMappings]);

  // Delete campaign mapping
  const deleteCampaignMapping = useCallback(async (mappingId: string) => {
    try {
      const { error } = await supabase
        .from('google_campaign_mappings')
        .delete()
        .eq('id', mappingId);

      if (error) throw error;
      
      toast.success('Mapeamento removido');
      await fetchCampaignMappings();
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast.error('Erro ao remover mapeamento');
    }
  }, [fetchCampaignMappings]);

  // Trigger sync
  const triggerSync = useCallback(async (syncType: 'metrics' | 'campaigns' = 'metrics') => {
    if (!integration?.id) return;
    
    setSyncing(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-ads-sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            integration_id: integration.id,
            sync_type: syncType,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const result = await response.json();
      toast.success(`Sincronização concluída: ${result.records_synced} registros`);
      
      await fetchSyncLogs();
      await fetchMetrics();
    } catch (error) {
      console.error('Error triggering sync:', error);
      toast.error('Erro na sincronização');
    } finally {
      setSyncing(false);
    }
  }, [integration?.id, fetchSyncLogs, fetchMetrics]);

  // Calculate report metrics
  const getReportMetrics = useCallback((): GoogleAdsReportMetrics => {
    if (metrics.length === 0) {
      return {
        totalImpressions: 0,
        totalClicks: 0,
        totalCost: 0,
        totalConversions: 0,
        avgCtr: 0,
        avgCpc: 0,
        costPerLead: 0,
        dailyMetrics: [],
      };
    }

    const totals = metrics.reduce((acc, m) => ({
      impressions: acc.impressions + m.impressions,
      clicks: acc.clicks + m.clicks,
      cost: acc.cost + (m.cost_micros / 1000000),
      conversions: acc.conversions + m.conversions,
    }), { impressions: 0, clicks: 0, cost: 0, conversions: 0 });

    const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const avgCpc = totals.clicks > 0 ? totals.cost / totals.clicks : 0;
    const costPerLead = totals.conversions > 0 ? totals.cost / totals.conversions : 0;

    // Group by date
    const dailyMap = new Map<string, typeof totals>();
    metrics.forEach(m => {
      const existing = dailyMap.get(m.date) || { impressions: 0, clicks: 0, cost: 0, conversions: 0 };
      dailyMap.set(m.date, {
        impressions: existing.impressions + m.impressions,
        clicks: existing.clicks + m.clicks,
        cost: existing.cost + (m.cost_micros / 1000000),
        conversions: existing.conversions + m.conversions,
      });
    });

    const dailyMetrics = Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        ...data,
        cpl: data.conversions > 0 ? data.cost / data.conversions : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalImpressions: totals.impressions,
      totalClicks: totals.clicks,
      totalCost: totals.cost,
      totalConversions: totals.conversions,
      avgCtr,
      avgCpc,
      costPerLead,
      dailyMetrics,
    };
  }, [metrics]);

  return {
    integration,
    campaignMappings,
    syncLogs,
    metrics,
    loading,
    syncing,
    connectGoogle,
    disconnectGoogle,
    selectAdsAccount,
    saveCampaignMapping,
    deleteCampaignMapping,
    triggerSync,
    getReportMetrics,
    refetch: fetchIntegration,
    refetchMetrics: fetchMetrics,
  };
}
