export type Temperature = 'cold' | 'warm' | 'hot';

export interface Tag {
  id: string;
  name: string;
  color: string;
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

export interface CRMState {
  pipelines: Pipeline[];
  selectedPipelineId: string | null;
  
  // Actions
  addPipeline: (name: string) => void;
  updatePipeline: (id: string, name: string) => void;
  deletePipeline: (id: string) => void;
  selectPipeline: (id: string | null) => void;
  
  addPhase: (pipelineId: string, name: string) => void;
  updatePhase: (pipelineId: string, phaseId: string, name: string) => void;
  deletePhase: (pipelineId: string, phaseId: string) => void;
  reorderPhases: (pipelineId: string, phases: Phase[]) => void;
  
  addDeal: (pipelineId: string, deal: Omit<Deal, 'id' | 'createdAt'>) => void;
  updateDeal: (pipelineId: string, dealId: string, deal: Partial<Deal>) => void;
  deleteDeal: (pipelineId: string, dealId: string) => void;
  moveDeal: (pipelineId: string, dealId: string, newPhaseId: string) => void;
  archiveDeal: (pipelineId: string, dealId: string) => void;
  
  archivedDeals: Deal[];
  restoreDeal: (dealId: string, pipelineId: string, phaseId: string) => void;
}
