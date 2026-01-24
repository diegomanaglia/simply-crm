// Google Integration Types

export interface GoogleAdsAccount {
  id: string;
  name: string;
  currency: string;
  timezone: string;
}

export interface GoogleCampaign {
  id: string;
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED';
  budget_micros?: number;
}

export interface GoogleIntegration {
  id: string;
  access_token: string;
  refresh_token: string;
  user_email: string;
  user_name: string | null;
  user_picture: string | null;
  ads_accounts: GoogleAdsAccount[];
  selected_account_id: string | null;
  status: 'connected' | 'disconnected' | 'error';
  connected_at: string;
  token_expires_at: string | null;
  updated_at: string;
}

export interface GoogleCampaignMapping {
  id: string;
  integration_id: string;
  campaign_id: string;
  campaign_name: string;
  pipeline_id: string;
  phase_id: string | null;
  auto_tags: string[];
  default_temperature: 'cold' | 'warm' | 'hot';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoogleAdsMetrics {
  id: string;
  integration_id: string;
  campaign_id: string | null;
  date: string;
  impressions: number;
  clicks: number;
  cost_micros: number;
  conversions: number;
  conversion_value: number;
  ctr: number;
  avg_cpc_micros: number;
  created_at: string;
}

export interface GoogleOfflineConversion {
  id: string;
  integration_id: string;
  deal_id: string;
  gclid: string;
  conversion_name: string;
  conversion_value: number;
  conversion_time: string;
  status: 'pending' | 'sent' | 'failed';
  google_response: Record<string, unknown> | null;
  created_at: string;
  sent_at: string | null;
}

export interface GoogleSyncLog {
  id: string;
  integration_id: string;
  sync_type: 'metrics' | 'campaigns' | 'conversions';
  status: 'success' | 'error' | 'partial';
  records_synced: number;
  errors: Array<{ message: string }>;
  started_at: string;
  completed_at: string | null;
}

// Aggregated metrics for reports
export interface GoogleAdsReportMetrics {
  totalImpressions: number;
  totalClicks: number;
  totalCost: number;
  totalConversions: number;
  avgCtr: number;
  avgCpc: number;
  costPerLead: number;
  dailyMetrics: Array<{
    date: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    cpl: number;
  }>;
}
