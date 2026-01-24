export type WebhookEvent = 
  | 'deal_created' 
  | 'deal_won' 
  | 'deal_lost' 
  | 'deal_moved' 
  | 'deal_updated' 
  | 'deal_archived';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  method: 'POST' | 'PUT';
  headers: Record<string, string>;
  events: WebhookEvent[];
  secret_key: string | null;
  is_active: boolean;
  ip_whitelist: string[] | null;
  retry_enabled: boolean;
  max_retries: number;
  consecutive_failures: number;
  last_triggered_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  response_time_ms: number | null;
  attempt: number;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  error_message: string | null;
  created_at: string;
}

export interface FieldMapping {
  id: string;
  source: string;
  target: string;
  transform?: 'uppercase' | 'lowercase' | 'format_phone' | 'trim';
}

export interface InboundWebhook {
  id: string;
  name: string;
  pipeline_id: string;
  phase_id: string | null;
  secret_token: string;
  field_mappings: FieldMapping[];
  default_tags: string[];
  default_temperature: 'cold' | 'warm' | 'hot';
  hmac_secret: string | null;
  ip_whitelist: string[] | null;
  is_active: boolean;
  requests_today: number;
  last_request_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InboundWebhookLog {
  id: string;
  inbound_webhook_id: string;
  source_ip: string | null;
  payload: Record<string, unknown>;
  mapped_data: Record<string, unknown> | null;
  deal_created_id: string | null;
  status: 'success' | 'failed' | 'rejected';
  error_message: string | null;
  created_at: string;
}

export interface WebhookTestResult {
  success: boolean;
  status?: number;
  responseBody?: string;
  error?: string;
  timeMs: number;
}

export const WEBHOOK_EVENTS: { value: WebhookEvent; label: string; description: string }[] = [
  { value: 'deal_created', label: 'Negócio Criado', description: 'Quando um negócio é criado manualmente' },
  { value: 'deal_won', label: 'Negócio Ganho', description: 'Quando um negócio vai para fase "Ganho"' },
  { value: 'deal_lost', label: 'Negócio Perdido', description: 'Quando um negócio vai para fase "Perdido"' },
  { value: 'deal_moved', label: 'Negócio Movido', description: 'Quando um negócio muda de fase' },
  { value: 'deal_updated', label: 'Negócio Atualizado', description: 'Quando dados do negócio são alterados' },
  { value: 'deal_archived', label: 'Negócio Arquivado', description: 'Quando um negócio é arquivado' },
];

export const FIELD_TRANSFORMS = [
  { value: 'uppercase', label: 'MAIÚSCULAS' },
  { value: 'lowercase', label: 'minúsculas' },
  { value: 'format_phone', label: 'Formatar Telefone (+55...)' },
  { value: 'trim', label: 'Remover Espaços' },
];

export const TARGET_FIELDS = [
  { value: 'contact_name', label: 'Nome do Contato' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Telefone' },
  { value: 'value', label: 'Valor' },
  { value: 'notes', label: 'Observações' },
  { value: 'company', label: 'Empresa' },
];
