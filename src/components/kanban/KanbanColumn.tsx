import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Edit2, Trophy, XCircle, Inbox, MoreVertical, Trash2 } from 'lucide-react';
import { Phase, Deal } from '@/types/crm';
import { DealCard } from '@/components/deals/DealCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface KanbanColumnProps {
  phase: Phase;
  deals: Deal[];
  onEditPhase: (phase: Phase) => void;
  onDeletePhase: (phaseId: string) => void;
  onDealClick: (deal: Deal) => void;
}

const phaseTypeConfig = {
  entry: { icon: Inbox, className: 'bg-info/10 text-info' },
  lost: { icon: XCircle, className: 'bg-destructive/10 text-destructive' },
  won: { icon: Trophy, className: 'bg-success/10 text-success' },
};

export function KanbanColumn({
  phase,
  deals,
  onEditPhase,
  onDeletePhase,
  onDealClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: phase.id,
  });

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const TypeIcon = phase.type ? phaseTypeConfig[phase.type]?.icon : null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value);
  };

  return (
    <div
      className={cn(
        'kanban-column flex flex-col w-72 min-w-72 flex-shrink-0 h-full',
        isOver && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {/* Column Header */}
      <div className="p-3 bg-kanban-column-header rounded-t-xl border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {TypeIcon && (
              <div className={cn('p-1 rounded', phaseTypeConfig[phase.type!].className)}>
                <TypeIcon className="w-3.5 h-3.5" />
              </div>
            )}
            <h3 className="font-semibold text-sm text-foreground">{phase.name}</h3>
          </div>
          <div className="flex items-center gap-1">
            <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
              {deals.length}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEditPhase(phase)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Editar nome
                </DropdownMenuItem>
                {!phase.isDefault && (
                  <DropdownMenuItem
                    onClick={() => onDeletePhase(phase.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir fase
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{formatCurrency(totalValue)}</p>
      </div>

      {/* Column Body */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto scrollbar-thin"
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onClick={onDealClick}
            />
          ))}
        </SortableContext>
        
        {deals.length === 0 && (
          <div className="flex items-center justify-center h-20 border-2 border-dashed border-border rounded-lg">
            <p className="text-xs text-muted-foreground">Arraste negócios aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}
