import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CRMState, Pipeline, Phase, Deal } from '@/types/crm';
import { generateMockData } from '@/utils/mockData';

const generateId = () => Math.random().toString(36).substring(2, 15);

const createDefaultPhases = (): Phase[] => [
  { id: generateId(), name: 'Entrada', order: 0, isDefault: true, type: 'entry' },
  { id: generateId(), name: 'Qualificação', order: 1, isDefault: false },
  { id: generateId(), name: 'Proposta', order: 2, isDefault: false },
  { id: generateId(), name: 'Negociação', order: 3, isDefault: false },
  { id: generateId(), name: 'Perdido', order: 98, isDefault: true, type: 'lost' },
  { id: generateId(), name: 'Ganho', order: 99, isDefault: true, type: 'won' },
];

// Check if this is first time loading (no data in localStorage)
const getInitialPipelines = (): Pipeline[] => {
  const stored = localStorage.getItem('simply-crm-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.state?.pipelines?.length > 0) {
        return parsed.state.pipelines;
      }
    } catch (e) {
      // Invalid data, generate mock
    }
  }
  // Generate mock data for first time users
  return generateMockData().pipelines;
};

export const useCRMStore = create<CRMState>()(
  persist(
    (set, get) => ({
      pipelines: getInitialPipelines(),
      selectedPipelineId: null,
      archivedDeals: [],

      addPipeline: (name: string) => {
        const newPipeline: Pipeline = {
          id: generateId(),
          name,
          phases: createDefaultPhases(),
          deals: [],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          pipelines: [...state.pipelines, newPipeline],
        }));
      },

      updatePipeline: (id: string, name: string) => {
        set((state) => ({
          pipelines: state.pipelines.map((p) =>
            p.id === id ? { ...p, name } : p
          ),
        }));
      },

      deletePipeline: (id: string) => {
        set((state) => ({
          pipelines: state.pipelines.filter((p) => p.id !== id),
          selectedPipelineId:
            state.selectedPipelineId === id ? null : state.selectedPipelineId,
        }));
      },

      selectPipeline: (id: string | null) => {
        set({ selectedPipelineId: id });
      },

      addPhase: (pipelineId: string, name: string) => {
        set((state) => ({
          pipelines: state.pipelines.map((p) => {
            if (p.id !== pipelineId) return p;
            
            const customPhases = p.phases.filter(
              (phase) => !phase.isDefault || phase.type === 'entry'
            );
            const endPhases = p.phases.filter(
              (phase) => phase.type === 'lost' || phase.type === 'won'
            );
            
            const newPhase: Phase = {
              id: generateId(),
              name,
              order: customPhases.length,
              isDefault: false,
            };

            return {
              ...p,
              phases: [...customPhases, newPhase, ...endPhases].map((phase, idx) => ({
                ...phase,
                order: phase.type === 'lost' ? 98 : phase.type === 'won' ? 99 : idx,
              })),
            };
          }),
        }));
      },

      updatePhase: (pipelineId: string, phaseId: string, name: string) => {
        set((state) => ({
          pipelines: state.pipelines.map((p) =>
            p.id === pipelineId
              ? {
                  ...p,
                  phases: p.phases.map((phase) =>
                    phase.id === phaseId ? { ...phase, name } : phase
                  ),
                }
              : p
          ),
        }));
      },

      deletePhase: (pipelineId: string, phaseId: string) => {
        set((state) => ({
          pipelines: state.pipelines.map((p) => {
            if (p.id !== pipelineId) return p;
            const phaseToDelete = p.phases.find((phase) => phase.id === phaseId);
            if (phaseToDelete?.isDefault) return p;
            
            const entryPhase = p.phases.find((phase) => phase.type === 'entry');
            return {
              ...p,
              phases: p.phases.filter((phase) => phase.id !== phaseId),
              deals: p.deals.map((deal) =>
                deal.phaseId === phaseId
                  ? { ...deal, phaseId: entryPhase?.id || p.phases[0].id }
                  : deal
              ),
            };
          }),
        }));
      },

      reorderPhases: (pipelineId: string, phases: Phase[]) => {
        set((state) => ({
          pipelines: state.pipelines.map((p) =>
            p.id === pipelineId ? { ...p, phases } : p
          ),
        }));
      },

      addDeal: (pipelineId: string, deal: Omit<Deal, 'id' | 'createdAt'>) => {
        const newDeal: Deal = {
          ...deal,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          pipelines: state.pipelines.map((p) =>
            p.id === pipelineId ? { ...p, deals: [...p.deals, newDeal] } : p
          ),
        }));
      },

      updateDeal: (pipelineId: string, dealId: string, dealUpdate: Partial<Deal>) => {
        set((state) => ({
          pipelines: state.pipelines.map((p) =>
            p.id === pipelineId
              ? {
                  ...p,
                  deals: p.deals.map((d) =>
                    d.id === dealId ? { ...d, ...dealUpdate } : d
                  ),
                }
              : p
          ),
        }));
      },

      deleteDeal: (pipelineId: string, dealId: string) => {
        set((state) => ({
          pipelines: state.pipelines.map((p) =>
            p.id === pipelineId
              ? { ...p, deals: p.deals.filter((d) => d.id !== dealId) }
              : p
          ),
        }));
      },

      moveDeal: (pipelineId: string, dealId: string, newPhaseId: string) => {
        set((state) => ({
          pipelines: state.pipelines.map((p) =>
            p.id === pipelineId
              ? {
                  ...p,
                  deals: p.deals.map((d) =>
                    d.id === dealId ? { ...d, phaseId: newPhaseId } : d
                  ),
                }
              : p
          ),
        }));
      },

      archiveDeal: (pipelineId: string, dealId: string) => {
        const pipeline = get().pipelines.find((p) => p.id === pipelineId);
        const deal = pipeline?.deals.find((d) => d.id === dealId);
        if (!deal) return;

        set((state) => ({
          archivedDeals: [...state.archivedDeals, deal],
          pipelines: state.pipelines.map((p) =>
            p.id === pipelineId
              ? { ...p, deals: p.deals.filter((d) => d.id !== dealId) }
              : p
          ),
        }));
      },

      restoreDeal: (dealId: string, pipelineId: string, phaseId: string) => {
        const deal = get().archivedDeals.find((d) => d.id === dealId);
        if (!deal) return;

        set((state) => ({
          archivedDeals: state.archivedDeals.filter((d) => d.id !== dealId),
          pipelines: state.pipelines.map((p) =>
            p.id === pipelineId
              ? { ...p, deals: [...p.deals, { ...deal, phaseId }] }
              : p
          ),
        }));
      },
    }),
    {
      name: 'simply-crm-storage',
    }
  )
);

// Function to reset data with fresh mock data
export const resetToMockData = () => {
  localStorage.removeItem('simply-crm-storage');
  window.location.reload();
};
