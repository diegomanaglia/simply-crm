// Facebook Integration Types

export interface FacebookPage {
  id: string;
  name: string;
  access_token?: string;
  picture?: string;
}

export interface FacebookLeadForm {
  id: string;
  name: string;
  page_id: string;
  status: 'ACTIVE' | 'INACTIVE';
  leads_count?: number;
}

export interface FacebookIntegration {
  id: string;
  access_token: string;
  user_id: string;
  user_name: string;
  user_picture: string | null;
  pages: FacebookPage[];
  status: 'connected' | 'disconnected' | 'error';
  connected_at: string;
  expires_at: string | null;
  updated_at: string;
}

export interface FacebookFormMapping {
  id: string;
  integration_id: string;
  form_id: string;
  form_name: string;
  page_id: string;
  page_name: string;
  pipeline_id: string;
  phase_id: string | null;
  auto_tags: string[];
  default_temperature: 'cold' | 'warm' | 'hot';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FacebookSyncLog {
  id: string;
  integration_id: string;
  form_mapping_id: string | null;
  sync_type: 'auto' | 'manual';
  leads_imported: number;
  leads_duplicates: number;
  errors: Array<{ message: string; lead_id?: string }>;
  status: 'success' | 'error' | 'partial';
  started_at: string;
  completed_at: string | null;
}

export interface FacebookLead {
  id: string;
  created_time: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
}
