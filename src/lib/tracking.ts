import { Temperature, Tag } from '@/types/crm';

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string; // Google Click ID for offline conversions
}

export interface LeadOrigin {
  utmParams: UTMParams;
  referrer?: string;
  device?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  landingPage?: string;
  capturedAt: string;
  gclid?: string; // Separate field for easy access
}

export interface CaptureFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface PipelineCaptureSettings {
  pipelineId: string;
  enabled: boolean;
  customFields?: string[];
}

// Capture and store UTM parameters from URL
export function captureUTMParams(): UTMParams {
  const urlParams = new URLSearchParams(window.location.search);
  
  const utmParams: UTMParams = {};
  
  const params = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid'] as const;
  
  params.forEach((param) => {
    const value = urlParams.get(param);
    if (value) {
      utmParams[param] = value;
    }
  });
  
  // Only store if we have any UTM params or gclid
  if (Object.keys(utmParams).length > 0) {
    sessionStorage.setItem('crm_utm_params', JSON.stringify(utmParams));
    
    // Store gclid separately for easy access (important for Google Ads conversions)
    if (utmParams.gclid) {
      sessionStorage.setItem('crm_gclid', utmParams.gclid);
    }
  }
  
  return utmParams;
}

// Get stored UTM params
export function getStoredUTMParams(): UTMParams {
  try {
    const stored = sessionStorage.getItem('crm_utm_params');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Get stored gclid
export function getStoredGclid(): string | null {
  try {
    return sessionStorage.getItem('crm_gclid');
  } catch {
    return null;
  }
}

// Detect device type
export function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  const ua = navigator.userAgent;
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
}

// Get browser name
export function getBrowser(): string {
  const ua = navigator.userAgent;
  
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  
  return 'Outro';
}

// Get OS name
export function getOS(): string {
  const ua = navigator.userAgent;
  
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  
  return 'Outro';
}

// Collect all origin data
export function collectLeadOrigin(): LeadOrigin {
  const utmParams = getStoredUTMParams();
  const gclid = getStoredGclid();
  
  return {
    utmParams,
    referrer: document.referrer || undefined,
    device: getDeviceType(),
    browser: getBrowser(),
    os: getOS(),
    landingPage: window.location.href,
    capturedAt: new Date().toISOString(),
    gclid: gclid || utmParams.gclid,
  };
}

// Generate auto tags based on source
export function generateSourceTags(origin: LeadOrigin): Tag[] {
  const tags: Tag[] = [];
  
  const source = origin.utmParams.utm_source?.toLowerCase();
  
  const sourceTagColors: Record<string, string> = {
    facebook: '#1877f2',
    instagram: '#e4405f',
    google: '#4285f4',
    linkedin: '#0077b5',
    twitter: '#1da1f2',
    tiktok: '#000000',
    youtube: '#ff0000',
    email: '#ea4335',
    whatsapp: '#25d366',
    organic: '#22c55e',
  };
  
  if (source) {
    const color = sourceTagColors[source] || '#6366f1';
    tags.push({
      id: `source-${source}`,
      name: source.charAt(0).toUpperCase() + source.slice(1),
      color,
    });
  }
  
  // Add device tag
  if (origin.device) {
    const deviceColors: Record<string, string> = {
      mobile: '#f59e0b',
      desktop: '#6366f1',
      tablet: '#8b5cf6',
    };
    tags.push({
      id: `device-${origin.device}`,
      name: origin.device === 'mobile' ? 'Mobile' : origin.device === 'tablet' ? 'Tablet' : 'Desktop',
      color: deviceColors[origin.device],
    });
  }
  
  return tags;
}

// Generate tracking script for embedding (updated to capture gclid)
export function generateTrackingScript(baseUrl: string): string {
  return `<!-- Simply CRM Tracking Script -->
<script>
(function() {
  var params = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid'];
  var urlParams = new URLSearchParams(window.location.search);
  var utmData = {};
  
  params.forEach(function(param) {
    var value = urlParams.get(param);
    if (value) utmData[param] = value;
  });
  
  if (Object.keys(utmData).length > 0) {
    sessionStorage.setItem('crm_utm_params', JSON.stringify(utmData));
    if (utmData.gclid) {
      sessionStorage.setItem('crm_gclid', utmData.gclid);
    }
  }
})();
</script>`;
}

// Format source for display
export function formatSource(source?: string): string {
  if (!source) return 'Direto';
  
  const sourceNames: Record<string, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    google: 'Google Ads',
    linkedin: 'LinkedIn',
    twitter: 'Twitter/X',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    email: 'E-mail Marketing',
    whatsapp: 'WhatsApp',
    organic: 'Busca Orgânica',
  };
  
  return sourceNames[source.toLowerCase()] || source.charAt(0).toUpperCase() + source.slice(1);
}

// Format medium for display
export function formatMedium(medium?: string): string {
  if (!medium) return '-';
  
  const mediumNames: Record<string, string> = {
    cpc: 'Pago (CPC)',
    organic: 'Orgânico',
    social: 'Social',
    email: 'E-mail',
    referral: 'Referência',
    display: 'Display',
    video: 'Vídeo',
  };
  
  return mediumNames[medium.toLowerCase()] || medium;
}
