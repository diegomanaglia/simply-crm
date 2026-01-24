import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Webhook, 
  WebhookLog, 
  InboundWebhook, 
  InboundWebhookLog,
  WebhookTestResult,
  FieldMapping 
} from '@/types/webhook';
import { toast } from 'sonner';

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [inboundWebhooks, setInboundWebhooks] = useState<InboundWebhook[]>([]);
  const [inboundLogs, setInboundLogs] = useState<InboundWebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  // Fetch all webhooks
  const fetchWebhooks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks((data || []) as unknown as Webhook[]);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast.error('Erro ao carregar webhooks');
    }
  }, []);

  // Fetch webhook logs
  const fetchWebhookLogs = useCallback(async (webhookId?: string) => {
    try {
      let query = supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (webhookId) {
        query = query.eq('webhook_id', webhookId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setWebhookLogs((data || []) as unknown as WebhookLog[]);
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
    }
  }, []);

  // Fetch inbound webhooks
  const fetchInboundWebhooks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('inbound_webhooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInboundWebhooks((data || []).map(item => ({
        ...item,
        field_mappings: (item.field_mappings as unknown as FieldMapping[]) || [],
        default_tags: item.default_tags || [],
      })) as InboundWebhook[]);
    } catch (error) {
      console.error('Error fetching inbound webhooks:', error);
      toast.error('Erro ao carregar webhooks de entrada');
    }
  }, []);

  // Fetch inbound logs
  const fetchInboundLogs = useCallback(async (webhookId?: string) => {
    try {
      let query = supabase
        .from('inbound_webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (webhookId) {
        query = query.eq('inbound_webhook_id', webhookId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setInboundLogs((data || []) as unknown as InboundWebhookLog[]);
    } catch (error) {
      console.error('Error fetching inbound logs:', error);
    }
  }, []);

  // Create webhook
  const createWebhook = async (webhook: Omit<Webhook, 'id' | 'created_at' | 'updated_at' | 'consecutive_failures' | 'last_triggered_at' | 'last_success_at' | 'last_error'>) => {
    try {
      const { data, error } = await supabase
        .from('webhooks')
        .insert({
          name: webhook.name,
          url: webhook.url,
          method: webhook.method,
          headers: webhook.headers,
          events: webhook.events,
          secret_key: webhook.secret_key,
          is_active: webhook.is_active,
          ip_whitelist: webhook.ip_whitelist,
          retry_enabled: webhook.retry_enabled,
          max_retries: webhook.max_retries,
        })
        .select()
        .single();

      if (error) throw error;
      await fetchWebhooks();
      toast.success('Webhook criado com sucesso');
      return data;
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast.error('Erro ao criar webhook');
      throw error;
    }
  };

  // Update webhook
  const updateWebhook = async (id: string, updates: Partial<Webhook>) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .update({
          name: updates.name,
          url: updates.url,
          method: updates.method,
          headers: updates.headers,
          events: updates.events,
          secret_key: updates.secret_key,
          is_active: updates.is_active,
          ip_whitelist: updates.ip_whitelist,
          retry_enabled: updates.retry_enabled,
          max_retries: updates.max_retries,
        })
        .eq('id', id);

      if (error) throw error;
      await fetchWebhooks();
      toast.success('Webhook atualizado');
    } catch (error) {
      console.error('Error updating webhook:', error);
      toast.error('Erro ao atualizar webhook');
      throw error;
    }
  };

  // Delete webhook
  const deleteWebhook = async (id: string) => {
    try {
      const { error } = await supabase
        .from('webhooks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchWebhooks();
      toast.success('Webhook removido');
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast.error('Erro ao remover webhook');
      throw error;
    }
  };

  // Test webhook
  const testWebhook = async (webhookId: string): Promise<WebhookTestResult> => {
    setTesting(true);
    try {
      const response = await supabase.functions.invoke('webhook-trigger', {
        body: { webhookId },
        method: 'POST',
      });

      if (response.error) throw response.error;
      
      const result = response.data as WebhookTestResult;
      
      if (result.success) {
        toast.success('Teste enviado com sucesso');
      } else {
        toast.error(`Teste falhou: ${result.error}`);
      }
      
      await fetchWebhookLogs(webhookId);
      return result;
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Erro ao testar webhook');
      throw error;
    } finally {
      setTesting(false);
    }
  };

  // Create inbound webhook
  const createInboundWebhook = async (webhook: Omit<InboundWebhook, 'id' | 'created_at' | 'updated_at' | 'secret_token' | 'requests_today' | 'last_request_at'>) => {
    try {
      const { data, error } = await supabase
        .from('inbound_webhooks')
        .insert([{
          name: webhook.name,
          pipeline_id: webhook.pipeline_id,
          phase_id: webhook.phase_id,
          field_mappings: JSON.parse(JSON.stringify(webhook.field_mappings)),
          default_tags: webhook.default_tags,
          default_temperature: webhook.default_temperature,
          hmac_secret: webhook.hmac_secret,
          ip_whitelist: webhook.ip_whitelist,
          is_active: webhook.is_active,
        }])
        .select()
        .single();

      if (error) throw error;
      await fetchInboundWebhooks();
      toast.success('Webhook de entrada criado');
      return data;
    } catch (error) {
      console.error('Error creating inbound webhook:', error);
      toast.error('Erro ao criar webhook de entrada');
      throw error;
    }
  };

  // Update inbound webhook
  const updateInboundWebhook = async (id: string, updates: Partial<InboundWebhook>) => {
    try {
      const { error } = await supabase
        .from('inbound_webhooks')
        .update({
          name: updates.name,
          pipeline_id: updates.pipeline_id,
          phase_id: updates.phase_id,
          field_mappings: updates.field_mappings ? JSON.parse(JSON.stringify(updates.field_mappings)) : undefined,
          default_tags: updates.default_tags,
          default_temperature: updates.default_temperature,
          hmac_secret: updates.hmac_secret,
          ip_whitelist: updates.ip_whitelist,
          is_active: updates.is_active,
        })
        .eq('id', id);

      if (error) throw error;
      await fetchInboundWebhooks();
      toast.success('Webhook atualizado');
    } catch (error) {
      console.error('Error updating inbound webhook:', error);
      toast.error('Erro ao atualizar webhook');
      throw error;
    }
  };

  // Delete inbound webhook
  const deleteInboundWebhook = async (id: string) => {
    try {
      const { error } = await supabase
        .from('inbound_webhooks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchInboundWebhooks();
      toast.success('Webhook removido');
    } catch (error) {
      console.error('Error deleting inbound webhook:', error);
      toast.error('Erro ao remover webhook');
      throw error;
    }
  };

  // Get webhook stats
  const getWebhookStats = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = webhookLogs.filter(log => 
      new Date(log.created_at) >= today
    );

    const successCount = todayLogs.filter(l => l.status === 'success').length;
    const failedCount = todayLogs.filter(l => l.status === 'failed').length;
    const avgResponseTime = todayLogs.length > 0 
      ? todayLogs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / todayLogs.length 
      : 0;

    return {
      totalToday: todayLogs.length,
      successCount,
      failedCount,
      avgResponseTime: Math.round(avgResponseTime),
      activeWebhooks: webhooks.filter(w => w.is_active).length,
      webhooksWithErrors: webhooks.filter(w => w.consecutive_failures > 0).length,
    };
  }, [webhooks, webhookLogs]);

  // Initial fetch
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchWebhooks(),
        fetchWebhookLogs(),
        fetchInboundWebhooks(),
        fetchInboundLogs(),
      ]);
      setLoading(false);
    };
    loadAll();
  }, [fetchWebhooks, fetchWebhookLogs, fetchInboundWebhooks, fetchInboundLogs]);

  return {
    webhooks,
    webhookLogs,
    inboundWebhooks,
    inboundLogs,
    loading,
    testing,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    createInboundWebhook,
    updateInboundWebhook,
    deleteInboundWebhook,
    fetchWebhookLogs,
    fetchInboundLogs,
    getWebhookStats,
    refresh: () => Promise.all([
      fetchWebhooks(),
      fetchWebhookLogs(),
      fetchInboundWebhooks(),
      fetchInboundLogs(),
    ]),
  };
}
