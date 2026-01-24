import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Hono } from 'https://deno.land/x/hono@v3.12.11/mod.ts';
import { cors } from 'https://deno.land/x/hono@v3.12.11/middleware.ts';

const app = new Hono();

app.use('/*', cors({
  origin: '*',
  allowHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type'],
}));

interface WebhookPayload {
  event: string;
  timestamp: string;
  deal: {
    id: string;
    name: string;
    contact_name: string;
    email: string;
    phone: string;
    value: number;
    pipeline: string;
    stage: string;
    tags: string[];
    temperature: string;
    source: string;
    utm_data: Record<string, string>;
  };
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  events: string[];
  secret_key: string | null;
  is_active: boolean;
  retry_enabled: boolean;
  max_retries: number;
  consecutive_failures: number;
  ip_whitelist: string[] | null;
}

// Generate HMAC signature
async function generateHmacSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const data = encoder.encode(payload);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Send webhook with retry logic
async function sendWebhook(
  webhook: Webhook,
  payload: WebhookPayload,
  attempt: number = 1
): Promise<{ success: boolean; status?: number; body?: string; error?: string; timeMs: number }> {
  const startTime = Date.now();
  const payloadString = JSON.stringify(payload);
  
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...webhook.headers,
    };
    
    // Add HMAC signature if secret key is configured
    if (webhook.secret_key) {
      const signature = await generateHmacSignature(payloadString, webhook.secret_key);
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }
    
    const response = await fetch(webhook.url, {
      method: webhook.method,
      headers,
      body: payloadString,
    });
    
    const timeMs = Date.now() - startTime;
    const responseBody = await response.text();
    
    if (response.ok) {
      return { success: true, status: response.status, body: responseBody, timeMs };
    } else {
      return { 
        success: false, 
        status: response.status, 
        body: responseBody, 
        error: `HTTP ${response.status}`, 
        timeMs 
      };
    }
  } catch (error) {
    const timeMs = Date.now() - startTime;
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      timeMs 
    };
  }
}

app.post('/trigger', async (c) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { event, deal } = await c.req.json();
    
    if (!event || !deal) {
      return c.json({ error: 'Missing event or deal data' }, 400);
    }
    
    // Get active webhooks that listen to this event
    const { data: webhooks, error: webhooksError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('is_active', true)
      .contains('events', [event]);
    
    if (webhooksError) {
      console.error('Error fetching webhooks:', webhooksError);
      return c.json({ error: 'Failed to fetch webhooks' }, 500);
    }
    
    if (!webhooks || webhooks.length === 0) {
      return c.json({ message: 'No webhooks configured for this event', triggered: 0 });
    }
    
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      deal,
    };
    
    const results = [];
    
    for (const webhook of webhooks) {
      const result = await sendWebhook(webhook, payload);
      
      // Log the execution
      await supabase.from('webhook_logs').insert({
        webhook_id: webhook.id,
        event_type: event,
        payload,
        response_status: result.status,
        response_body: result.body?.substring(0, 5000), // Limit response body size
        response_time_ms: result.timeMs,
        status: result.success ? 'success' : 'failed',
        error_message: result.error,
      });
      
      // Update webhook status
      const updates: Record<string, unknown> = {
        last_triggered_at: new Date().toISOString(),
      };
      
      if (result.success) {
        updates.last_success_at = new Date().toISOString();
        updates.consecutive_failures = 0;
        updates.last_error = null;
      } else {
        updates.consecutive_failures = webhook.consecutive_failures + 1;
        updates.last_error = result.error;
        
        // Schedule retry if enabled and under max retries
        if (webhook.retry_enabled && webhook.consecutive_failures < webhook.max_retries) {
          // Log retry attempt
          await supabase.from('webhook_logs').insert({
            webhook_id: webhook.id,
            event_type: event,
            payload,
            attempt: webhook.consecutive_failures + 2,
            status: 'retrying',
            error_message: `Retry scheduled (attempt ${webhook.consecutive_failures + 2}/${webhook.max_retries + 1})`,
          });
        }
      }
      
      await supabase
        .from('webhooks')
        .update(updates)
        .eq('id', webhook.id);
      
      results.push({
        webhookId: webhook.id,
        webhookName: webhook.name,
        success: result.success,
        status: result.status,
        timeMs: result.timeMs,
      });
    }
    
    return c.json({ 
      message: `Triggered ${webhooks.length} webhook(s)`,
      triggered: webhooks.length,
      results,
    });
    
  } catch (error) {
    console.error('Webhook trigger error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Test webhook endpoint
app.post('/test', async (c) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { webhookId } = await c.req.json();
    
    if (!webhookId) {
      return c.json({ error: 'Missing webhookId' }, 400);
    }
    
    // Get webhook
    const { data: webhook, error: webhookError } = await supabase
      .from('webhooks')
      .select('*')
      .eq('id', webhookId)
      .single();
    
    if (webhookError || !webhook) {
      return c.json({ error: 'Webhook not found' }, 404);
    }
    
    // Create test payload
    const testPayload: WebhookPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      deal: {
        id: 'test-123',
        name: 'Negócio de Teste',
        contact_name: 'João Silva',
        email: 'joao@example.com',
        phone: '+5511999999999',
        value: 5000.00,
        pipeline: 'Vendas',
        stage: 'Qualificação',
        tags: ['teste', 'webhook'],
        temperature: 'hot',
        source: 'Webhook Test',
        utm_data: {
          utm_source: 'test',
          utm_medium: 'webhook',
          utm_campaign: 'test_campaign',
        },
      },
    };
    
    const result = await sendWebhook(webhook, testPayload);
    
    // Log the test
    await supabase.from('webhook_logs').insert({
      webhook_id: webhook.id,
      event_type: 'test',
      payload: testPayload,
      response_status: result.status,
      response_body: result.body?.substring(0, 5000),
      response_time_ms: result.timeMs,
      status: result.success ? 'success' : 'failed',
      error_message: result.error,
    });
    
    return c.json({
      success: result.success,
      status: result.status,
      responseBody: result.body?.substring(0, 1000),
      error: result.error,
      timeMs: result.timeMs,
    });
    
  } catch (error) {
    console.error('Webhook test error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

Deno.serve(app.fetch);
