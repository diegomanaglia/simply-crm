import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Hono } from 'https://deno.land/x/hono@v3.12.11/mod.ts';
import { cors } from 'https://deno.land/x/hono@v3.12.11/middleware.ts';

const app = new Hono();

app.use('/*', cors({
  origin: '*',
  allowHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type', 'x-webhook-signature'],
}));

interface FieldMapping {
  source: string; // e.g., "customer.name" or "contact_email"
  target: string; // e.g., "contact_name" or "email"
  transform?: 'uppercase' | 'lowercase' | 'format_phone' | 'trim';
}

interface InboundWebhook {
  id: string;
  name: string;
  pipeline_id: string;
  phase_id: string | null;
  secret_token: string;
  field_mappings: FieldMapping[];
  default_tags: string[];
  default_temperature: string;
  hmac_secret: string | null;
  ip_whitelist: string[] | null;
  is_active: boolean;
  requests_today: number;
}

// Get nested value from object
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let value: unknown = obj;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  
  return value;
}

// Apply transformation
function applyTransform(value: unknown, transform?: string): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  
  switch (transform) {
    case 'uppercase':
      return str.toUpperCase();
    case 'lowercase':
      return str.toLowerCase();
    case 'format_phone':
      // Remove non-numeric characters and format
      const digits = str.replace(/\D/g, '');
      if (digits.length === 11) {
        return `+55${digits}`;
      } else if (digits.length === 13 && digits.startsWith('55')) {
        return `+${digits}`;
      }
      return str;
    case 'trim':
      return str.trim();
    default:
      return str;
  }
}

// Verify HMAC signature
async function verifyHmacSignature(
  payload: string, 
  signature: string, 
  secret: string
): Promise<boolean> {
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
  
  const expectedSignature = await crypto.subtle.sign('HMAC', key, data);
  const expectedHex = Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Compare signatures (remove 'sha256=' prefix if present)
  const cleanSignature = signature.replace('sha256=', '');
  return cleanSignature === expectedHex;
}

// Rate limiting check (100 req/min)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(webhookId: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(webhookId);
  
  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(webhookId, { count: 1, resetAt: now + 60000 });
    return true;
  }
  
  if (limit.count >= 100) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Main webhook receive endpoint
app.all('/receive/:pipelineId/:secretToken', async (c) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const pipelineId = c.req.param('pipelineId');
  const secretToken = c.req.param('secretToken');
  const sourceIp = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
  
  let payload: Record<string, unknown> = {};
  let rawPayload = '';
  
  try {
    rawPayload = await c.req.text();
    payload = JSON.parse(rawPayload);
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }
  
  try {
    // Find webhook by pipeline and token
    const { data: webhook, error: webhookError } = await supabase
      .from('inbound_webhooks')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .eq('secret_token', secretToken)
      .eq('is_active', true)
      .maybeSingle();
    
    if (webhookError || !webhook) {
      // Log rejected request
      await supabase.from('inbound_webhook_logs').insert({
        inbound_webhook_id: null,
        source_ip: sourceIp,
        payload,
        status: 'rejected',
        error_message: 'Webhook not found or inactive',
      });
      
      return c.json({ error: 'Webhook not found or inactive' }, 404);
    }
    
    // Rate limit check
    if (!checkRateLimit(webhook.id)) {
      await supabase.from('inbound_webhook_logs').insert({
        inbound_webhook_id: webhook.id,
        source_ip: sourceIp,
        payload,
        status: 'rejected',
        error_message: 'Rate limit exceeded (100 req/min)',
      });
      
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }
    
    // IP whitelist check
    if (webhook.ip_whitelist && webhook.ip_whitelist.length > 0) {
      const allowed = webhook.ip_whitelist.some((ip: string) => 
        sourceIp.includes(ip) || ip === '*'
      );
      
      if (!allowed) {
        await supabase.from('inbound_webhook_logs').insert({
          inbound_webhook_id: webhook.id,
          source_ip: sourceIp,
          payload,
          status: 'rejected',
          error_message: `IP not whitelisted: ${sourceIp}`,
        });
        
        return c.json({ error: 'IP not allowed' }, 403);
      }
    }
    
    // HMAC verification
    if (webhook.hmac_secret) {
      const signature = c.req.header('x-webhook-signature') || '';
      const valid = await verifyHmacSignature(rawPayload, signature, webhook.hmac_secret);
      
      if (!valid) {
        await supabase.from('inbound_webhook_logs').insert({
          inbound_webhook_id: webhook.id,
          source_ip: sourceIp,
          payload,
          status: 'rejected',
          error_message: 'Invalid HMAC signature',
        });
        
        return c.json({ error: 'Invalid signature' }, 401);
      }
    }
    
    // Map fields
    const mappedData: Record<string, string> = {};
    const fieldMappings = webhook.field_mappings as FieldMapping[];
    
    for (const mapping of fieldMappings) {
      const value = getNestedValue(payload, mapping.source);
      mappedData[mapping.target] = applyTransform(value, mapping.transform);
    }
    
    // Create deal data structure (for frontend to use)
    const dealData = {
      contact_name: mappedData.contact_name || mappedData.name || 'Novo Lead',
      email: mappedData.email || '',
      phone: mappedData.phone || '',
      value: parseFloat(mappedData.value) || 0,
      tags: webhook.default_tags,
      temperature: webhook.default_temperature,
      source: 'Webhook',
      notes: mappedData.notes || '',
      pipeline_id: webhook.pipeline_id,
      phase_id: webhook.phase_id,
      raw_payload: payload,
    };
    
    // Log successful receipt
    const { data: logData } = await supabase.from('inbound_webhook_logs').insert({
      inbound_webhook_id: webhook.id,
      source_ip: sourceIp,
      payload,
      mapped_data: dealData,
      status: 'success',
    }).select().single();
    
    // Update webhook stats
    await supabase
      .from('inbound_webhooks')
      .update({
        last_request_at: new Date().toISOString(),
        requests_today: webhook.requests_today + 1,
      })
      .eq('id', webhook.id);
    
    return c.json({
      success: true,
      message: 'Webhook received successfully',
      deal: dealData,
      logId: logData?.id,
    });
    
  } catch (error) {
    console.error('Webhook receive error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

Deno.serve(app.fetch);
