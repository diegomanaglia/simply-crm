import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { initGA4 } from '@/lib/analytics';

export interface AnalyticsSettings {
  id: string;
  ga4_measurement_id: string | null;
  tracking_enabled: boolean;
  goals_configured: boolean;
  created_at: string;
  updated_at: string;
}

export function useAnalyticsSettings() {
  const [settings, setSettings] = useState<AnalyticsSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('analytics_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings(data);
        
        // Initialize GA4 if enabled
        if (data.tracking_enabled && data.ga4_measurement_id) {
          initGA4(data.ga4_measurement_id);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(async (updates: Partial<AnalyticsSettings>) => {
    if (!settings?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('analytics_settings')
        .update({
          ga4_measurement_id: updates.ga4_measurement_id,
          tracking_enabled: updates.tracking_enabled,
          goals_configured: updates.goals_configured,
        })
        .eq('id', settings.id);

      if (error) throw error;
      
      // Re-fetch to get updated data
      await fetchSettings();
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      console.error('Error updating analytics settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  }, [settings?.id, fetchSettings]);

  const toggleTracking = useCallback(async (enabled: boolean) => {
    await updateSettings({ tracking_enabled: enabled });
    
    if (enabled && settings?.ga4_measurement_id) {
      initGA4(settings.ga4_measurement_id);
    }
  }, [settings?.ga4_measurement_id, updateSettings]);

  const saveMeasurementId = useCallback(async (measurementId: string) => {
    await updateSettings({ 
      ga4_measurement_id: measurementId,
      tracking_enabled: !!measurementId,
    });
    
    if (measurementId) {
      initGA4(measurementId);
    }
  }, [updateSettings]);

  return {
    settings,
    loading,
    saving,
    updateSettings,
    toggleTracking,
    saveMeasurementId,
    refetch: fetchSettings,
  };
}
