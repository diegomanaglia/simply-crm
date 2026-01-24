import { useState, useMemo, useRef } from 'react';
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
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ArrowLeft, Plus, Search, X, Filter, SortAsc, Snowflake, Sun, Flame, Facebook, Globe, Download, Upload } from 'lucide-react';
import { Pipeline, Deal, Phase, Temperature } from '@/types/crm';
import { useCRMStore } from '@/store/crmStore';
import { KanbanColumn } from './KanbanColumn';
import { DealCard } from '@/components/deals/DealCard';
import { CreateDealModal } from '@/components/deals/CreateDealModal';
import { DealDetailModal } from '@/components/deals/DealDetailModal';
import { ExportModal, ImportModal } from '@/components/export';
import { ExportDeal } from '@/lib/export-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface KanbanBoardProps {
  pipeline: Pipeline;
  onBack: () => void;
}

type SortOption = 'recent' | 'value-high' | 'value-low';
type OriginFilter = 'all' | 'facebook' | 'capture' | 'manual';

export function KanbanBoard({ pipeline, onBack }: KanbanBoardProps) {
  const { addPhase, updatePhase, deletePhase, addDeal, updateDeal, moveDeal } = useCRMStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [showEditPhaseModal, setShowEditPhaseModal] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('');
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>(undefined);
  
  // Detail modal
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [temperatureFilter, setTemperatureFilter] = useState<Temperature | 'all'>('all');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [valueMin, setValueMin] = useState('');
  const [valueMax, setValueMax] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [originFilter, setOriginFilter] = useState<OriginFilter>('all');
  const [showDeletePhaseConfirm, setShowDeletePhaseConfirm] = useState(false);
  const [deletingPhaseId, setDeletingPhaseId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewDeal: () => handleOpenDealModal(),
    onSearch: () => searchInputRef.current?.focus(),
  });

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

  // Get all unique tags from deals
  const allTags = useMemo(() => {
    const tags = new Map<string, { id: string; name: string; color: string }>();
    pipeline.deals.forEach((deal) => {
      deal.tags.forEach((tag) => {
        if (!tags.has(tag.name)) {
          tags.set(tag.name, tag);
        }
      });
    });
    return Array.from(tags.values());
  }, [pipeline.deals]);

  // Filter and sort deals
  const filteredDeals = useMemo(() => {
    let deals = [...pipeline.deals];

    // Search filter (using debounced value)
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      deals = deals.filter(
        (d) =>
          d.title.toLowerCase().includes(query) ||
          d.contactName.toLowerCase().includes(query)
      );
    }

    // Temperature filter
    if (temperatureFilter !== 'all') {
      deals = deals.filter((d) => d.temperature === temperatureFilter);
    }

    // Tag filter
    if (tagFilter) {
      deals = deals.filter((d) => d.tags.some((t) => t.name === tagFilter));
    }

    // Value range filter
    if (valueMin) {
      deals = deals.filter((d) => d.value >= parseFloat(valueMin));
    }
    if (valueMax) {
      deals = deals.filter((d) => d.value <= parseFloat(valueMax));
    }

    // Origin filter
    if (originFilter !== 'all') {
      deals = deals.filter((d) => {
        const isFromFacebook = d.source === 'Facebook Lead Ads' || 
          d.origin?.utmParams?.utm_source === 'facebook';
        const isFromCapture = d.origin?.landingPage || 
          (d.origin?.utmParams && Object.keys(d.origin.utmParams).length > 0);
        
        if (originFilter === 'facebook') return isFromFacebook;
        if (originFilter === 'capture') return isFromCapture && !isFromFacebook;
        if (originFilter === 'manual') return !isFromFacebook && !isFromCapture;
        return true;
      });
    }

    // Sort
    switch (sortOption) {
      case 'recent':
        deals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'value-high':
        deals.sort((a, b) => b.value - a.value);
        break;
      case 'value-low':
        deals.sort((a, b) => a.value - b.value);
        break;
    }

    return deals;
  }, [pipeline.deals, debouncedSearch, temperatureFilter, tagFilter, valueMin, valueMax, originFilter, sortOption]);

  const hasActiveFilters = searchQuery || temperatureFilter !== 'all' || tagFilter || valueMin || valueMax || originFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setTemperatureFilter('all');
    setTagFilter('');
    setValueMin('');
    setValueMax('');
    setOriginFilter('all');
  };

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

    const targetPhase = pipeline.phases.find((p) => p.id === overId);
    if (targetPhase) {
      moveDeal(pipeline.id, dealId, targetPhase.id);
      return;
    }

    const targetDeal = pipeline.deals.find((d) => d.id === overId);
    if (targetDeal && targetDeal.phaseId) {
      moveDeal(pipeline.id, dealId, targetDeal.phaseId);
    }
  };

  const handleAddPhase = () => {
    if (newPhaseName.trim()) {
      addPhase(pipeline.id, newPhaseName.trim());
      toast({ title: 'Fase criada', description: `"${newPhaseName.trim()}" foi adicionada.` });
      setNewPhaseName('');
      setShowPhaseModal(false);
    }
  };

  const handleConfirmDeletePhase = () => {
    if (deletingPhaseId) {
      const phase = pipeline.phases.find(p => p.id === deletingPhaseId);
      deletePhase(pipeline.id, deletingPhaseId);
      toast({ title: 'Fase excluída', description: `"${phase?.name}" foi removida. Negócios movidos para Entrada.` });
      setDeletingPhaseId(null);
      setShowDeletePhaseConfirm(false);
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
      toast({ title: 'Fase atualizada', description: `Nome alterado para "${newPhaseName.trim()}".` });
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
    setShowDetailModal(false);
    setShowDealModal(true);
  };

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setShowDetailModal(true);
  };

  const handleSubmitDeal = (dealData: Omit<Deal, 'id' | 'createdAt'>) => {
    if (editingDeal) {
      updateDeal(pipeline.id, editingDeal.id, dealData);
      toast({ title: 'Negócio atualizado', description: `"${dealData.title}" foi salvo.` });
    } else {
      addDeal(pipeline.id, dealData);
      toast({ title: 'Negócio criado', description: `"${dealData.title}" foi adicionado.` });
    }
  };

  const getDealsForPhase = (phaseId: string) => {
    return filteredDeals.filter((d) => d.phaseId === phaseId);
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
              {filteredDeals.length} negócios {hasActiveFilters && '(filtrados)'} • {pipeline.phases.length} fases
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
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

      {/* Filter Bar */}
      <div className="p-4 bg-card border-b border-border">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar negócios... (pressione /)"
              className="pl-9"
            />
          </div>

          {/* Temperature Filter */}
          <Select value={temperatureFilter} onValueChange={(v) => setTemperatureFilter(v as Temperature | 'all')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Temperatura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="cold">
                <div className="flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-info" />
                  Frio
                </div>
              </SelectItem>
              <SelectItem value="warm">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-warning" />
                  Morno
                </div>
              </SelectItem>
              <SelectItem value="hot">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-destructive" />
                  Quente
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Tag Filter */}
          <Select value={tagFilter || '__all__'} onValueChange={(v) => setTagFilter(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag.id} value={tag.name}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Value Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Valor
                {(valueMin || valueMax) && (
                  <Badge variant="secondary" className="ml-2">
                    {valueMin || '0'} - {valueMax || '∞'}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Valor Mínimo (R$)</Label>
                  <Input
                    type="number"
                    value={valueMin}
                    onChange={(e) => setValueMin(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Máximo (R$)</Label>
                  <Input
                    type="number"
                    value={valueMax}
                    onChange={(e) => setValueMax(e.target.value)}
                    placeholder="Sem limite"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Origin Filter */}
          <Select value={originFilter} onValueChange={(v) => setOriginFilter(v as OriginFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas origens</SelectItem>
              <SelectItem value="facebook">
                <div className="flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-[#1877F2]" />
                  Facebook
                </div>
              </SelectItem>
              <SelectItem value="capture">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Formulário
                </div>
              </SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger className="w-[150px]">
              <SortAsc className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="value-high">Maior valor</SelectItem>
              <SelectItem value="value-low">Menor valor</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
          )}
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
                deals={getDealsForPhase(phase.id)}
                onEditPhase={handleEditPhase}
                onDeletePhase={(phaseId) => {
                  setDeletingPhaseId(phaseId);
                  setShowDeletePhaseConfirm(true);
                }}
                onDealClick={handleDealClick}
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

      {/* Delete Phase Confirmation */}
      <AlertDialog open={showDeletePhaseConfirm} onOpenChange={setShowDeletePhaseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Fase</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta fase? Os negócios serão movidos automaticamente para a fase "Entrada".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeletePhase} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Deal Detail Modal */}
      <DealDetailModal
        deal={selectedDeal}
        pipeline={pipeline}
        open={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedDeal(null);
        }}
        onEdit={handleEditDeal}
      />

      {/* Export Modal */}
      <ExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        pipeline={pipeline}
        allDeals={pipeline.deals.map(deal => {
          const phase = pipeline.phases.find(p => p.id === deal.phaseId);
          return {
            ...deal,
            pipelineName: pipeline.name,
            phaseName: phase?.name || '',
          } as ExportDeal;
        })}
      />

      {/* Import Modal */}
      <ImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
      />
    </div>
  );
}
