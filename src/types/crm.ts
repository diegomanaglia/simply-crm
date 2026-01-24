export type Temperature = 'cold' | 'warm' | 'hot';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export type ActivityType = 
  | 'created'
  | 'phase_changed'
  | 'pipeline_changed'
  | 'info_updated'
  | 'archived'
  | 'restored'
  | 'temperature_changed'
  | 'value_changed'
  | 'notes_updated'
  | 'duplicated';

export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: string;
  description: string;
  metadata?: {
    fromPhase?: string;
    toPhase?: string;
    fromPipeline?: string;
    toPipeline?: string;
    fromValue?: number;
    toValue?: number;
    fromTemperature?: Temperature;
    toTemperature?: Temperature;
    fieldChanged?: string;
    duplicatedFromId?: string;
  };
}

export interface LeadOrigin {
  utmParams?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
  referrer?: string;
  device?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  landingPage?: string;
  capturedAt?: string;
}

export interface Deal {
  id: string;
  title: string;
  contactName: string;
  document: string; // CPF/CNPJ
  phone: string;
  email: string;
  value: number;
  tags: Tag[];
  source: string;
  temperature: Temperature;
  createdAt: string;
  phaseId: string;
  activities: Activity[];
  notes?: string;
  origin?: LeadOrigin; // New field for lead origin tracking
  company?: string; // Optional company name
  // For archived deals
  archivedAt?: string;
  archivedFromPipelineId?: string;
  archivedFromPipelineName?: string;
  archivedFromPhaseName?: string;
}

export interface Phase {
  id: string;
  name: string;
  order: number;
  isDefault: boolean; // Entrada, Perdido, Ganho
  type?: 'entry' | 'lost' | 'won';
}

export interface Pipeline {
  id: string;
  name: string;
  phases: Phase[];
  deals: Deal[];
  createdAt: string;
}

export interface PipelineCaptureSettings {
  pipelineId: string;
  enabled: boolean;
}

export interface CRMState {
  pipelines: Pipeline[];
  selectedPipelineId: string | null;
  captureSettings: PipelineCaptureSettings[];
  
  // Actions
  addPipeline: (name: string) => void;
  updatePipeline: (id: string, name: string) => void;
  deletePipeline: (id: string) => void;
  selectPipeline: (id: string | null) => void;
  
  addPhase: (pipelineId: string, name: string) => void;
  updatePhase: (pipelineId: string, phaseId: string, name: string) => void;
  deletePhase: (pipelineId: string, phaseId: string) => void;
  reorderPhases: (pipelineId: string, phases: Phase[]) => void;
  
  addDeal: (pipelineId: string, deal: Omit<Deal, 'id' | 'createdAt' | 'activities'>) => void;
  addDealFromCapture: (pipelineId: string, deal: Omit<Deal, 'id' | 'createdAt' | 'activities' | 'phaseId'>) => void;
  updateDeal: (pipelineId: string, dealId: string, deal: Partial<Deal>) => void;
  deleteDeal: (pipelineId: string, dealId: string) => void;
  moveDeal: (pipelineId: string, dealId: string, newPhaseId: string) => void;
  moveDealToPipeline: (fromPipelineId: string, dealId: string, toPipelineId: string, toPhaseId: string) => void;
  archiveDeal: (pipelineId: string, dealId: string) => void;
  duplicateDeal: (pipelineId: string, dealId: string) => void;
  
  archivedDeals: Deal[];
  restoreDeal: (dealId: string, pipelineId: string, phaseId: string) => void;
  
  // Capture settings
  toggleCaptureSettings: (pipelineId: string, enabled: boolean) => void;
  getCaptureSettings: (pipelineId: string) => PipelineCaptureSettings | undefined;
  
  // Helper to get phase/pipeline names
  getPhaseName: (pipelineId: string, phaseId: string) => string;
  getPipelineName: (pipelineId: string) => string;
}
