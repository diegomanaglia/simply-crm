import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Snowflake, Flame, Sun, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { Deal, Temperature } from '@/types/crm';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface DealCardProps {
  deal: Deal;
  onEdit?: (deal: Deal) => void;
  onDelete?: (dealId: string) => void;
  onArchive?: (dealId: string) => void;
}

const temperatureConfig: Record<Temperature, { icon: typeof Snowflake; className: string; label: string }> = {
  cold: { icon: Snowflake, className: 'text-info', label: 'Frio' },
  warm: { icon: Sun, className: 'text-warning', label: 'Morno' },
  hot: { icon: Flame, className: 'text-destructive', label: 'Quente' },
};

export function DealCard({ deal, onEdit, onDelete, onArchive }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const TempIcon = temperatureConfig[deal.temperature].icon;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'deal-card group',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm text-foreground line-clamp-1 flex-1">
          {deal.title}
        </h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(deal)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onArchive?.(deal.id)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Arquivar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete?.(deal.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="text-xs text-muted-foreground mb-2">{deal.contactName}</p>

      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm text-primary">
          {formatCurrency(deal.value)}
        </span>
        <div className="flex items-center gap-1">
          <TempIcon className={cn('w-4 h-4', temperatureConfig[deal.temperature].className)} />
        </div>
      </div>

      {deal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {deal.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="tag-badge text-[10px]"
              style={{ backgroundColor: tag.color + '20', color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {deal.tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{deal.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
