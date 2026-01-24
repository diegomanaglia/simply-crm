import { supabase } from '@/integrations/supabase/client';

// GA4 Event Types
export type GA4EventName = 
  | 'lead_captured'
  | 'deal_created'
  | 'deal_won'
  | 'deal_lost'
  | 'deal_moved';

export interface GA4EventParams {
  pipeline_name?: string;
  pipeline_id?: string;
  deal_id?: string;
  deal_value?: number;
  source?: string;
  campaign?: string;
  temperature?: string;
  from_phase?: string;
  to_phase?: string;
  [key: string]: string | number | undefined;
}

// Declare gtag function type
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// Check if GA4 is loaded
export function isGA4Loaded(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

// Send event to GA4
export function sendGA4Event(eventName: GA4EventName, params: GA4EventParams = {}) {
  if (isGA4Loaded() && window.gtag) {
    // Clean undefined values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([_, v]) => v !== undefined)
    );
    
    window.gtag('event', eventName, cleanParams);
    console.log(`[GA4] Event sent: ${eventName}`, cleanParams);
  }
  
  // Also store in our database for internal analytics
  storeAnalyticsEvent(eventName, params);
}

// Store event in database for internal analytics
async function storeAnalyticsEvent(eventName: string, params: GA4EventParams) {
  try {
    await supabase.from('analytics_events').insert({
      event_name: eventName,
      event_params: params,
      pipeline_id: params.pipeline_id,
      deal_id: params.deal_id,
      source: params.source,
      campaign: params.campaign,
    });
  } catch (error) {
    console.error('[Analytics] Failed to store event:', error);
  }
}

// Initialize GA4 tracking script
export function initGA4(measurementId: string) {
  if (!measurementId || typeof window === 'undefined') return;
  
  // Check if already loaded
  if (document.querySelector(`script[src*="${measurementId}"]`)) return;
  
  // Add gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
  
  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: true,
  });
  
  console.log(`[GA4] Initialized with ID: ${measurementId}`);
}

// Generate GA4 tracking script for embedding
export function generateGA4Script(measurementId: string): string {
  if (!measurementId) return '';
  
  return `<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${measurementId}');
</script>`;
}

// Helper to send lead captured event
export function trackLeadCaptured(params: {
  pipelineName: string;
  pipelineId: string;
  source?: string;
  campaign?: string;
}) {
  sendGA4Event('lead_captured', {
    pipeline_name: params.pipelineName,
    pipeline_id: params.pipelineId,
    source: params.source,
    campaign: params.campaign,
  });
}

// Helper to send deal created event
export function trackDealCreated(params: {
  pipelineName: string;
  pipelineId: string;
  dealId: string;
  dealValue: number;
  temperature: string;
  source?: string;
  campaign?: string;
}) {
  sendGA4Event('deal_created', {
    pipeline_name: params.pipelineName,
    pipeline_id: params.pipelineId,
    deal_id: params.dealId,
    deal_value: params.dealValue,
    temperature: params.temperature,
    source: params.source,
    campaign: params.campaign,
  });
}

// Helper to send deal won event
export function trackDealWon(params: {
  pipelineName: string;
  pipelineId: string;
  dealId: string;
  dealValue: number;
  source?: string;
  campaign?: string;
}) {
  sendGA4Event('deal_won', {
    pipeline_name: params.pipelineName,
    pipeline_id: params.pipelineId,
    deal_id: params.dealId,
    deal_value: params.dealValue,
    source: params.source,
    campaign: params.campaign,
  });
}

// Helper to send deal lost event
export function trackDealLost(params: {
  pipelineName: string;
  pipelineId: string;
  dealId: string;
  dealValue: number;
  source?: string;
  campaign?: string;
}) {
  sendGA4Event('deal_lost', {
    pipeline_name: params.pipelineName,
    pipeline_id: params.pipelineId,
    deal_id: params.dealId,
    deal_value: params.dealValue,
    source: params.source,
    campaign: params.campaign,
  });
}

// Helper to send deal moved event
export function trackDealMoved(params: {
  pipelineName: string;
  pipelineId: string;
  dealId: string;
  fromPhase: string;
  toPhase: string;
  dealValue: number;
}) {
  sendGA4Event('deal_moved', {
    pipeline_name: params.pipelineName,
    pipeline_id: params.pipelineId,
    deal_id: params.dealId,
    from_phase: params.fromPhase,
    to_phase: params.toPhase,
    deal_value: params.dealValue,
  });
}
