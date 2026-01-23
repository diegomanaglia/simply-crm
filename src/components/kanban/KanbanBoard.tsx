import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ArrowLeft, Plus, Settings } from 'lucide-react';
import { Pipeline, Deal, Phase } from '@/types/crm';
import { useCRMStore } from '@/store/crmStore';
import { KanbanColumn } from './KanbanColumn';
import { DealCard } from '@/components/deals/DealCard';
import { CreateDealModal } from '@/components/deals/CreateDealModal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface KanbanBoardProps {
  pipeline: Pipeline;
  onBack: () => void;
}

export function KanbanBoard({ pipeline, onBack }: KanbanBoardProps) {
  const { addPhase, updatePhase, deletePhase, addDeal, updateDeal, deleteDeal, moveDeal, archiveDeal } = useCRMStore();
  
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [showEditPhaseModal, setShowEditPhaseModal] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('');
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>(undefined);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedPhases = [...pipeline.phases].sort((a, b) => a.order - b.order);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const deal = pipeline.deals.find((d) => d.id === active.id);
    if (deal) {
      setActiveDeal(deal);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    const overId = over.id as string;

    // Check if dropped over a phase (column)
    const targetPhase = pipeline.phases.find((p) => p.id === overId);
    if (targetPhase) {
      moveDeal(pipeline.id, dealId, targetPhase.id);
      return;
    }

    // Check if dropped over another deal
    const targetDeal = pipeline.deals.find((d) => d.id === overId);
    if (targetDeal && targetDeal.phaseId) {
      moveDeal(pipeline.id, dealId, targetDeal.phaseId);
    }
  };

  const handleAddPhase = () => {
    if (newPhaseName.trim()) {
      addPhase(pipeline.id, newPhaseName.trim());
      setNewPhaseName('');
      setShowPhaseModal(false);
    }
  };

  const handleEditPhase = (phase: Phase) => {
    setEditingPhase(phase);
    setNewPhaseName(phase.name);
    setShowEditPhaseModal(true);
  };

  const handleSavePhase = () => {
    if (editingPhase && newPhaseName.trim()) {
      updatePhase(pipeline.id, editingPhase.id, newPhaseName.trim());
      setEditingPhase(null);
      setNewPhaseName('');
      setShowEditPhaseModal(false);
    }
  };

  const handleOpenDealModal = (phaseId?: string) => {
    const entryPhase = pipeline.phases.find((p) => p.type === 'entry');
    setSelectedPhaseId(phaseId || entryPhase?.id || pipeline.phases[0]?.id || '');
    setEditingDeal(undefined);
    setShowDealModal(true);
  };

  const handleEditDeal = (deal: Deal) => {
    setSelectedPhaseId(deal.phaseId);
    setEditingDeal(deal);
    setShowDealModal(true);
  };

  const handleSubmitDeal = (dealData: Omit<Deal, 'id' | 'createdAt'>) => {
    if (editingDeal) {
      updateDeal(pipeline.id, editingDeal.id, dealData);
    } else {
      addDeal(pipeline.id, dealData);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{pipeline.name}</h1>
            <p className="text-sm text-muted-foreground">
              {pipeline.deals.length} negócios • {pipeline.phases.length} fases
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPhaseModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Fase
          </Button>
          <Button onClick={() => handleOpenDealModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Negócio
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4 bg-background">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full">
            {sortedPhases.map((phase) => (
              <KanbanColumn
                key={phase.id}
                phase={phase}
                deals={pipeline.deals.filter((d) => d.phaseId === phase.id)}
                onEditPhase={handleEditPhase}
                onDeletePhase={(phaseId) => deletePhase(pipeline.id, phaseId)}
                onEditDeal={handleEditDeal}
                onDeleteDeal={(dealId) => deleteDeal(pipeline.id, dealId)}
                onArchiveDeal={(dealId) => archiveDeal(pipeline.id, dealId)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeDeal ? (
              <div className="opacity-80">
                <DealCard deal={activeDeal} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add Phase Modal */}
      <Dialog open={showPhaseModal} onOpenChange={setShowPhaseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Fase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phaseName">Nome da Fase</Label>
              <Input
                id="phaseName"
                value={newPhaseName}
                onChange={(e) => setNewPhaseName(e.target.value)}
                placeholder="Ex: Em negociação"
                onKeyDown={(e) => e.key === 'Enter' && handleAddPhase()}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowPhaseModal(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleAddPhase} className="flex-1">
                Criar Fase
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Phase Modal */}
      <Dialog open={showEditPhaseModal} onOpenChange={setShowEditPhaseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Fase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editPhaseName">Nome da Fase</Label>
              <Input
                id="editPhaseName"
                value={newPhaseName}
                onChange={(e) => setNewPhaseName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSavePhase()}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowEditPhaseModal(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSavePhase} className="flex-1">
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deal Modal */}
      <CreateDealModal
        open={showDealModal}
        onClose={() => {
          setShowDealModal(false);
          setEditingDeal(undefined);
        }}
        onSubmit={handleSubmitDeal}
        phaseId={selectedPhaseId}
        editingDeal={editingDeal}
      />
    </div>
  );
}
