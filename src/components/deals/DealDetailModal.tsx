import { useState } from 'react';
import { 
  X, Snowflake, Sun, Flame, Edit, Archive, ArrowRight, Calendar, Mail, Phone, 
  FileText, Tag, DollarSign, History, Plus, ArrowRightLeft, ThermometerSun,
  CheckCircle2, XCircle, RotateCcw, PenLine, Copy, StickyNote
} from 'lucide-react';
import { Deal, Temperature, Pipeline, Activity, ActivityType } from '@/types/crm';
import { useCRMStore } from '@/store/crmStore';
import { toast } from '@/hooks/use-toast';
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
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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

const activityIcons: Record<ActivityType, { icon: typeof Plus; className: string }> = {
  created: { icon: Plus, className: 'text-success bg-success/10' },
  phase_changed: { icon: ArrowRight, className: 'text-info bg-info/10' },
  pipeline_changed: { icon: ArrowRightLeft, className: 'text-primary bg-primary/10' },
  info_updated: { icon: PenLine, className: 'text-warning bg-warning/10' },
  archived: { icon: Archive, className: 'text-muted-foreground bg-muted' },
  restored: { icon: RotateCcw, className: 'text-success bg-success/10' },
  temperature_changed: { icon: ThermometerSun, className: 'text-warning bg-warning/10' },
  value_changed: { icon: DollarSign, className: 'text-success bg-success/10' },
  notes_updated: { icon: StickyNote, className: 'text-info bg-info/10' },
  duplicated: { icon: Copy, className: 'text-primary bg-primary/10' },
};

export function DealDetailModal({ deal, pipeline, open, onClose, onEdit }: DealDetailModalProps) {
  const { pipelines, archiveDeal, moveDealToPipeline, duplicateDeal } = useCRMStore();
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
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

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
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
    toast({
      title: 'Negócio arquivado',
      description: `"${deal.title}" foi movido para os arquivados.`,
    });
    setShowArchiveConfirm(false);
    onClose();
  };

  const handleDuplicate = () => {
    duplicateDeal(pipeline.id, deal.id);
    toast({
      title: 'Negócio duplicado',
      description: `Uma cópia de "${deal.title}" foi criada.`,
    });
    onClose();
  };

  const handleMove = () => {
    if (targetPipelineId && targetPhaseId) {
      moveDealToPipeline(pipeline.id, deal.id, targetPipelineId, targetPhaseId);
      toast({
        title: 'Negócio movido',
        description: `"${deal.title}" foi movido para outro pipeline.`,
      });
      setShowMoveDialog(false);
      setTargetPipelineId('');
      setTargetPhaseId('');
      onClose();
    }
  };

  const targetPipeline = pipelines.find((p) => p.id === targetPipelineId);
  const sortedActivities = [...(deal.activities || [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <>
      <Dialog open={open && !showMoveDialog && !showArchiveConfirm} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
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

          <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Histórico
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="flex-1 overflow-auto mt-4 space-y-4">
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

              {/* Notes */}
              {deal.notes && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Observações</h4>
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{deal.notes}</p>
                  </div>
                </div>
              )}

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
              <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border">
                <Button 
                  variant="outline" 
                  onClick={() => onEdit(deal)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDuplicate}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowMoveDialog(true)}
                >
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Mover
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowArchiveConfirm(true)}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Arquivar
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="flex-1 min-h-0 mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {sortedActivities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <History className="w-12 h-12 mb-2 opacity-50" />
                    <p>Nenhuma atividade registrada</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                    
                    <div className="space-y-4">
                      {sortedActivities.map((activity, index) => {
                        const iconConfig = activityIcons[activity.type];
                        const IconComponent = iconConfig.icon;
                        
                        return (
                          <div key={activity.id} className="relative flex gap-4 pl-2">
                            {/* Icon */}
                            <div className={cn(
                              'relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                              iconConfig.className
                            )}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 pb-4">
                              <p className="text-sm text-foreground">{activity.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatShortDate(activity.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Negócio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja arquivar "{deal.title}"? O negócio será movido para os arquivados e poderá ser restaurado posteriormente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover para outro Pipeline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecione o pipeline e a fase de destino para mover este negócio.
            </p>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Pipeline de destino</label>
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
                      {p.name} {p.id === pipeline.id && '(atual)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {targetPipelineId && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Fase de destino</label>
                <Select value={targetPhaseId} onValueChange={setTargetPhaseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fase" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetPipeline?.phases
                      .sort((a, b) => a.order - b.order)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => {
                setShowMoveDialog(false);
                setTargetPipelineId('');
                setTargetPhaseId('');
              }} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleMove} disabled={!targetPipelineId || !targetPhaseId} className="flex-1">
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Mover Negócio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
