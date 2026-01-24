import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CRMState, Pipeline, Phase, Deal, Activity } from '@/types/crm';
import { generateMockData } from '@/utils/mockData';

const generateId = () => Math.random().toString(36).substring(2, 15);

const createActivity = (type: Activity['type'], description: string, metadata?: Activity['metadata']): Activity => ({
  id: generateId(),
  type,
  timestamp: new Date().toISOString(),
  description,
  metadata,
});

const createDefaultPhases = (): Phase[] => [
  { id: generateId(), name: 'Entrada', order: 0, isDefault: true, type: 'entry' },
  { id: generateId(), name: 'Qualificação', order: 1, isDefault: false },
  { id: generateId(), name: 'Proposta', order: 2, isDefault: false },
  { id: generateId(), name: 'Negociação', order: 3, isDefault: false },
  { id: generateId(), name: 'Perdido', order: 98, isDefault: true, type: 'lost' },
  { id: generateId(), name: 'Ganho', order: 99, isDefault: true, type: 'won' },
];

export const useCRMStore = create<CRMState>()(
  persist(
    (set, get) => ({
      pipelines: [],
      selectedPipelineId: null,
      archivedDeals: [],
      captureSettings: [],

      getPhaseName: (pipelineId: string, phaseId: string) => {
        const pipeline = get().pipelines.find((p) => p.id === pipelineId);
        const phase = pipeline?.phases.find((ph) => ph.id === phaseId);
        return phase?.name || 'Desconhecida';
      },

      getPipelineName: (pipelineId: string) => {
        const pipeline = get().pipelines.find((p) => p.id === pipelineId);
        return pipeline?.name || 'Desconhecido';
      },

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
            const phaseName = phaseToDelete?.name || 'fase';
            
            return {
              ...p,
              phases: p.phases.filter((phase) => phase.id !== phaseId),
              deals: p.deals.map((deal) => {
                if (deal.phaseId !== phaseId) return deal;
                
                const activity = createActivity(
                  'phase_changed',
                  `Movido de "${phaseName}" para "Entrada" (fase excluída)`,
                  { fromPhase: phaseName, toPhase: 'Entrada' }
                );
                
                return {
                  ...deal,
                  phaseId: entryPhase?.id || p.phases[0].id,
                  activities: [...(deal.activities || []), activity],
                };
              }),
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

      addDeal: (pipelineId: string, deal: Omit<Deal, 'id' | 'createdAt' | 'activities'>) => {
        const pipeline = get().pipelines.find((p) => p.id === pipelineId);
        const phase = pipeline?.phases.find((ph) => ph.id === deal.phaseId);
        
        const creationActivity = createActivity(
          'created',
          `Negócio criado na fase "${phase?.name || 'Entrada'}"`
        );
        
        const newDeal: Deal = {
          ...deal,
          id: generateId(),
          createdAt: new Date().toISOString(),
          activities: [creationActivity],
        };
        set((state) => ({
          pipelines: state.pipelines.map((p) =>
            p.id === pipelineId ? { ...p, deals: [...p.deals, newDeal] } : p
          ),
        }));
      },

      updateDeal: (pipelineId: string, dealId: string, dealUpdate: Partial<Deal>) => {
        set((state) => ({
          pipelines: state.pipelines.map((p) => {
            if (p.id !== pipelineId) return p;
            
            return {
              ...p,
              deals: p.deals.map((d) => {
                if (d.id !== dealId) return d;
                
                const activities = [...(d.activities || [])];
                
                // Track value changes
                if (dealUpdate.value !== undefined && dealUpdate.value !== d.value) {
                  activities.push(createActivity(
                    'value_changed',
                    `Valor alterado de R$ ${d.value.toLocaleString('pt-BR')} para R$ ${dealUpdate.value.toLocaleString('pt-BR')}`,
                    { fromValue: d.value, toValue: dealUpdate.value }
                  ));
                }
                
                // Track temperature changes
                if (dealUpdate.temperature && dealUpdate.temperature !== d.temperature) {
                  const tempNames = { cold: 'Frio', warm: 'Morno', hot: 'Quente' };
                  activities.push(createActivity(
                    'temperature_changed',
                    `Temperatura alterada de "${tempNames[d.temperature]}" para "${tempNames[dealUpdate.temperature]}"`,
                    { fromTemperature: d.temperature, toTemperature: dealUpdate.temperature }
                  ));
                }

                // Track notes changes
                if (dealUpdate.notes !== undefined && dealUpdate.notes !== d.notes) {
                  activities.push(createActivity(
                    'notes_updated',
                    'Notas/observações atualizadas'
                  ));
                }
                
                // Track general info updates
                const fieldsChanged: string[] = [];
                if (dealUpdate.title && dealUpdate.title !== d.title) fieldsChanged.push('título');
                if (dealUpdate.contactName && dealUpdate.contactName !== d.contactName) fieldsChanged.push('contato');
                if (dealUpdate.email && dealUpdate.email !== d.email) fieldsChanged.push('email');
                if (dealUpdate.phone && dealUpdate.phone !== d.phone) fieldsChanged.push('telefone');
                
                if (fieldsChanged.length > 0) {
                  activities.push(createActivity(
                    'info_updated',
                    `Informações atualizadas: ${fieldsChanged.join(', ')}`,
                    { fieldChanged: fieldsChanged.join(', ') }
                  ));
                }
                
                return { ...d, ...dealUpdate, activities };
              }),
            };
          }),
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
          pipelines: state.pipelines.map((p) => {
            if (p.id !== pipelineId) return p;
            
            return {
              ...p,
              deals: p.deals.map((d) => {
                if (d.id !== dealId || d.phaseId === newPhaseId) return d;
                
                const fromPhase = p.phases.find((ph) => ph.id === d.phaseId);
                const toPhase = p.phases.find((ph) => ph.id === newPhaseId);
                
                const activity = createActivity(
                  'phase_changed',
                  `Movido de "${fromPhase?.name}" para "${toPhase?.name}"`,
                  { fromPhase: fromPhase?.name, toPhase: toPhase?.name }
                );
                
                return {
                  ...d,
                  phaseId: newPhaseId,
                  activities: [...(d.activities || []), activity],
                };
              }),
            };
          }),
        }));
      },

      moveDealToPipeline: (fromPipelineId: string, dealId: string, toPipelineId: string, toPhaseId: string) => {
        const fromPipeline = get().pipelines.find((p) => p.id === fromPipelineId);
        const toPipeline = get().pipelines.find((p) => p.id === toPipelineId);
        const deal = fromPipeline?.deals.find((d) => d.id === dealId);
        
        if (!deal || !fromPipeline || !toPipeline) return;
        
        const fromPhase = fromPipeline.phases.find((ph) => ph.id === deal.phaseId);
        const toPhase = toPipeline.phases.find((ph) => ph.id === toPhaseId);
        
        const activity = createActivity(
          'pipeline_changed',
          `Movido do pipeline "${fromPipeline.name}" (${fromPhase?.name}) para "${toPipeline.name}" (${toPhase?.name})`,
          { 
            fromPipeline: fromPipeline.name, 
            toPipeline: toPipeline.name,
            fromPhase: fromPhase?.name,
            toPhase: toPhase?.name,
          }
        );
        
        const updatedDeal = {
          ...deal,
          phaseId: toPhaseId,
          activities: [...(deal.activities || []), activity],
        };
        
        set((state) => ({
          pipelines: state.pipelines.map((p) => {
            if (p.id === fromPipelineId) {
              return { ...p, deals: p.deals.filter((d) => d.id !== dealId) };
            }
            if (p.id === toPipelineId) {
              return { ...p, deals: [...p.deals, updatedDeal] };
            }
            return p;
          }),
        }));
      },

      archiveDeal: (pipelineId: string, dealId: string) => {
        const pipeline = get().pipelines.find((p) => p.id === pipelineId);
        const deal = pipeline?.deals.find((d) => d.id === dealId);
        if (!deal || !pipeline) return;
        
        const phase = pipeline.phases.find((ph) => ph.id === deal.phaseId);
        
        const activity = createActivity(
          'archived',
          `Negócio arquivado do pipeline "${pipeline.name}"`
        );
        
        const archivedDeal: Deal = {
          ...deal,
          activities: [...(deal.activities || []), activity],
          archivedAt: new Date().toISOString(),
          archivedFromPipelineId: pipelineId,
          archivedFromPipelineName: pipeline.name,
          archivedFromPhaseName: phase?.name || 'Desconhecida',
        };

        set((state) => ({
          archivedDeals: [...state.archivedDeals, archivedDeal],
          pipelines: state.pipelines.map((p) =>
            p.id === pipelineId
              ? { ...p, deals: p.deals.filter((d) => d.id !== dealId) }
              : p
          ),
        }));
      },

      duplicateDeal: (pipelineId: string, dealId: string) => {
        const pipeline = get().pipelines.find((p) => p.id === pipelineId);
        const deal = pipeline?.deals.find((d) => d.id === dealId);
        if (!deal || !pipeline) return;

        const phase = pipeline.phases.find((ph) => ph.id === deal.phaseId);
        
        const duplicateActivity = createActivity(
          'duplicated',
          `Negócio duplicado de "${deal.title}"`,
          { duplicatedFromId: deal.id }
        );

        const newDeal: Deal = {
          ...deal,
          id: generateId(),
          title: `${deal.title} (Cópia)`,
          createdAt: new Date().toISOString(),
          activities: [duplicateActivity],
        };

        set((state) => ({
          pipelines: state.pipelines.map((p) =>
            p.id === pipelineId ? { ...p, deals: [...p.deals, newDeal] } : p
          ),
        }));
      },

      restoreDeal: (dealId: string, pipelineId: string, phaseId: string) => {
        const deal = get().archivedDeals.find((d) => d.id === dealId);
        const pipeline = get().pipelines.find((p) => p.id === pipelineId);
        const phase = pipeline?.phases.find((ph) => ph.id === phaseId);
        
        if (!deal || !pipeline) return;
        
        const activity = createActivity(
          'restored',
          `Negócio restaurado para o pipeline "${pipeline.name}" na fase "${phase?.name}"`
        );
        
        const restoredDeal = {
          ...deal,
          phaseId,
          activities: [...(deal.activities || []), activity],
        };

        set((state) => ({
          archivedDeals: state.archivedDeals.filter((d) => d.id !== dealId),
          pipelines: state.pipelines.map((p) =>
            p.id === pipelineId
              ? { ...p, deals: [...p.deals, restoredDeal] }
              : p
          ),
        }));
      },

      // Add deal from public capture form
      addDealFromCapture: (pipelineId: string, deal: Omit<Deal, 'id' | 'createdAt' | 'activities' | 'phaseId'>) => {
        const pipeline = get().pipelines.find((p) => p.id === pipelineId);
        if (!pipeline) return;
        
        const entryPhase = pipeline.phases.find((ph) => ph.type === 'entry');
        if (!entryPhase) return;
        
        const creationActivity = createActivity(
          'created',
          `Lead capturado via formulário público - Fase "${entryPhase.name}"`
        );
        
        const newDeal: Deal = {
          ...deal,
          id: generateId(),
          phaseId: entryPhase.id,
          createdAt: new Date().toISOString(),
          activities: [creationActivity],
        };
        
        set((state) => ({
          pipelines: state.pipelines.map((p) =>
            p.id === pipelineId ? { ...p, deals: [...p.deals, newDeal] } : p
          ),
        }));
      },

      // Toggle capture settings for a pipeline
      toggleCaptureSettings: (pipelineId: string, enabled: boolean) => {
        set((state) => {
          const existing = state.captureSettings.find((s) => s.pipelineId === pipelineId);
          if (existing) {
            return {
              captureSettings: state.captureSettings.map((s) =>
                s.pipelineId === pipelineId ? { ...s, enabled } : s
              ),
            };
          }
          return {
            captureSettings: [...state.captureSettings, { pipelineId, enabled }],
          };
        });
      },

      // Get capture settings for a pipeline
      getCaptureSettings: (pipelineId: string) => {
        return get().captureSettings.find((s) => s.pipelineId === pipelineId);
      },
    }),
    {
      name: 'simply-crm-storage',
    }
  )
);

// Function to load mock data - replaces current data
export const loadMockData = () => {
  const mockData = generateMockData();
  useCRMStore.setState({ 
    pipelines: mockData.pipelines,
    archivedDeals: [],
    selectedPipelineId: null
  });
};

// Function to completely reset and reload with mock data
export const resetToMockData = () => {
  localStorage.removeItem('simply-crm-storage');
  const mockData = generateMockData();
  useCRMStore.setState({ 
    pipelines: mockData.pipelines,
    archivedDeals: [],
    selectedPipelineId: null
  });
};
