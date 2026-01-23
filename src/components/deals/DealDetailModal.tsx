import { useState } from 'react';
import { X, Snowflake, Sun, Flame, Edit, Archive, ArrowRight, Calendar, Mail, Phone, FileText, Tag, DollarSign, Thermometer } from 'lucide-react';
import { Deal, Temperature, Pipeline } from '@/types/crm';
import { useCRMStore } from '@/store/crmStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DealDetailModalProps {
  deal: Deal | null;
  pipeline: Pipeline;
  open: boolean;
  onClose: () => void;
  onEdit: (deal: Deal) => void;
}

const temperatureConfig: Record<Temperature, { icon: typeof Snowflake; className: string; label: string; bgClass: string }> = {
  cold: { icon: Snowflake, className: 'text-info', label: 'Frio', bgClass: 'bg-info/10' },
  warm: { icon: Sun, className: 'text-warning', label: 'Morno', bgClass: 'bg-warning/10' },
  hot: { icon: Flame, className: 'text-destructive', label: 'Quente', bgClass: 'bg-destructive/10' },
};

export function DealDetailModal({ deal, pipeline, open, onClose, onEdit }: DealDetailModalProps) {
  const { pipelines, archiveDeal, moveDeal } = useCRMStore();
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [targetPipelineId, setTargetPipelineId] = useState('');
  const [targetPhaseId, setTargetPhaseId] = useState('');

  if (!deal) return null;

  const TempIcon = temperatureConfig[deal.temperature].icon;
  const currentPhase = pipeline.phases.find((p) => p.id === deal.phaseId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleArchive = () => {
    archiveDeal(pipeline.id, deal.id);
    onClose();
  };

  const handleMove = () => {
    if (targetPipelineId && targetPhaseId) {
      // If moving to same pipeline, just update phase
      if (targetPipelineId === pipeline.id) {
        moveDeal(pipeline.id, deal.id, targetPhaseId);
      }
      // Moving to different pipeline requires more complex logic
      // For now, we'll handle same-pipeline moves
      setShowMoveDialog(false);
      onClose();
    }
  };

  const targetPipeline = pipelines.find((p) => p.id === targetPipelineId);

  return (
    <>
      <Dialog open={open && !showMoveDialog} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                {getInitials(deal.contactName || deal.title)}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{deal.title}</h2>
                <p className="text-sm text-muted-foreground font-normal">
                  {pipeline.name} • {currentPhase?.name}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Value and Temperature */}
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-primary">{formatCurrency(deal.value)}</span>
              </div>
              <div className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full', temperatureConfig[deal.temperature].bgClass)}>
                <TempIcon className={cn('w-4 h-4', temperatureConfig[deal.temperature].className)} />
                <span className={cn('text-sm font-medium', temperatureConfig[deal.temperature].className)}>
                  {temperatureConfig[deal.temperature].label}
                </span>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Informações do Contato</h4>
              
              {deal.contactName && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Nome</p>
                    <p className="text-foreground">{deal.contactName}</p>
                  </div>
                </div>
              )}

              {deal.document && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">CPF/CNPJ</p>
                    <p className="text-foreground">{deal.document}</p>
                  </div>
                </div>
              )}

              {deal.email && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Email</p>
                    <p className="text-foreground">{deal.email}</p>
                  </div>
                </div>
              )}

              {deal.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Telefone</p>
                    <p className="text-foreground">{deal.phone}</p>
                  </div>
                </div>
              )}

              {deal.source && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Fonte</p>
                    <p className="text-foreground">{deal.source}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Criado em</p>
                  <p className="text-foreground">{formatDate(deal.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            {deal.tags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {deal.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="tag-badge"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-border">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => onEdit(deal)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setShowMoveDialog(true)}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Mover
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleArchive}
              >
                <Archive className="w-4 h-4 mr-2" />
                Arquivar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover Negócio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pipeline</label>
              <Select value={targetPipelineId} onValueChange={(value) => {
                setTargetPipelineId(value);
                setTargetPhaseId('');
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {targetPipelineId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Fase</label>
                <Select value={targetPhaseId} onValueChange={setTargetPhaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fase" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetPipeline?.phases.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowMoveDialog(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleMove} disabled={!targetPipelineId || !targetPhaseId} className="flex-1">
                Mover
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
