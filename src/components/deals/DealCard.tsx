import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Snowflake, Flame, Sun, Calendar } from 'lucide-react';
import { Deal, Temperature } from '@/types/crm';
import { cn } from '@/lib/utils';

interface DealCardProps {
  deal: Deal;
  onClick?: (deal: Deal) => void;
}

const temperatureConfig: Record<Temperature, { icon: typeof Snowflake; className: string; label: string }> = {
  cold: { icon: Snowflake, className: 'text-info', label: 'Frio' },
  warm: { icon: Sun, className: 'text-warning', label: 'Morno' },
  hot: { icon: Flame, className: 'text-destructive', label: 'Quente' },
};

export function DealCard({ deal, onClick }: DealCardProps) {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if not dragging
    if (!isDragging && onClick) {
      onClick(deal);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        'deal-card group',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-primary'
      )}
    >
      {/* Header with Avatar and Title */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
          {getInitials(deal.contactName || deal.title)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground line-clamp-1">
            {deal.title}
          </h4>
          <p className="text-xs text-muted-foreground truncate">{deal.contactName || 'Sem contato'}</p>
        </div>
      </div>

      {/* Value and Temperature */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm text-primary">
          {formatCurrency(deal.value)}
        </span>
        <div className="flex items-center gap-1">
          <TempIcon className={cn('w-4 h-4', temperatureConfig[deal.temperature].className)} />
        </div>
      </div>

      {/* Tags */}
      {deal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {deal.tags.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="tag-badge text-[10px]"
              style={{ backgroundColor: tag.color + '20', color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
          {deal.tags.length > 2 && (
            <span className="text-[10px] text-muted-foreground">
              +{deal.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Date */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t border-border/50">
        <Calendar className="w-3 h-3" />
        <span>{formatDate(deal.createdAt)}</span>
      </div>
    </div>
  );
}
