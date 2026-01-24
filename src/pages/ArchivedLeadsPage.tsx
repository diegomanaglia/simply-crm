import { useState, useMemo } from 'react';
import { Archive, RotateCcw, Search, Filter, Calendar, Snowflake, Sun, Flame } from 'lucide-react';
import { useCRMStore } from '@/store/crmStore';
import { Temperature } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type PeriodFilter = 'week' | 'month' | '3months' | 'all';

const temperatureConfig: Record<Temperature, { icon: typeof Snowflake; className: string; label: string }> = {
  cold: { icon: Snowflake, className: 'text-info', label: 'Frio' },
  warm: { icon: Sun, className: 'text-warning', label: 'Morno' },
  hot: { icon: Flame, className: 'text-destructive', label: 'Quente' },
};

export default function ArchivedLeadsPage() {
  const { archivedDeals, pipelines, restoreDeal } = useCRMStore();
  const [search, setSearch] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState<string>('__all__');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoringDealId, setRestoringDealId] = useState<string | null>(null);

  // Calculate date range based on period filter
  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    
    switch (periodFilter) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'all':
        start.setFullYear(2000);
        break;
    }
    
    return { start, end: now };
  };

  const filteredDeals = useMemo(() => {
    const { start, end } = getDateRange();
    
    return archivedDeals.filter((deal) => {
      // Search filter
      const matchesSearch =
        deal.title.toLowerCase().includes(search.toLowerCase()) ||
        deal.contactName.toLowerCase().includes(search.toLowerCase());
      
      // Pipeline filter
      const matchesPipeline =
        pipelineFilter === '__all__' || deal.archivedFromPipelineId === pipelineFilter;
      
      // Period filter (based on archive date)
      const archiveDate = deal.archivedAt ? new Date(deal.archivedAt) : new Date(deal.createdAt);
      const matchesPeriod = archiveDate >= start && archiveDate <= end;
      
      return matchesSearch && matchesPipeline && matchesPeriod;
    });
  }, [archivedDeals, search, pipelineFilter, periodFilter]);

  const handleRestore = () => {
    if (!restoringDealId) return;
    
    const deal = archivedDeals.find((d) => d.id === restoringDealId);
    if (!deal) return;
    
    // Find original pipeline or use first available
    let targetPipelineId = deal.archivedFromPipelineId;
    let targetPipeline = pipelines.find((p) => p.id === targetPipelineId);
    
    // If original pipeline doesn't exist, use first available
    if (!targetPipeline && pipelines.length > 0) {
      targetPipeline = pipelines[0];
      targetPipelineId = targetPipeline.id;
    }
    
    if (!targetPipeline || !targetPipelineId) {
      setShowRestoreDialog(false);
      setRestoringDealId(null);
      return;
    }
    
    // Find entry phase
    const entryPhase = targetPipeline.phases.find((p) => p.type === 'entry');
    if (entryPhase) {
      restoreDeal(restoringDealId, targetPipelineId, entryPhase.id);
    }
    
    setShowRestoreDialog(false);
    setRestoringDealId(null);
  };

  const openRestoreDialog = (dealId: string) => {
    setRestoringDealId(dealId);
    setShowRestoreDialog(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const restoringDeal = archivedDeals.find((d) => d.id === restoringDealId);
  const targetPipeline = restoringDeal?.archivedFromPipelineId
    ? pipelines.find((p) => p.id === restoringDeal.archivedFromPipelineId)
    : pipelines[0];

  // Stats
  const totalArchived = archivedDeals.length;
  const totalValue = archivedDeals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads Arquivados</h1>
          <p className="text-muted-foreground">Negócios que foram arquivados</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="bg-muted p-3 rounded-lg">
                <Archive className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalArchived}</p>
                <p className="text-sm text-muted-foreground">Total Arquivados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="bg-warning/10 p-3 rounded-lg">
                <Search className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{filteredDeals.length}</p>
                <p className="text-sm text-muted-foreground">Exibindo</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="bg-destructive/10 p-3 rounded-lg">
                <span className="text-destructive font-bold">R$</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    notation: 'compact',
                  }).format(totalValue)}
                </p>
                <p className="text-sm text-muted-foreground">Valor Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-5">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome..."
                className="pl-9"
              />
            </div>

            {/* Pipeline Filter */}
            <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Pipeline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os Pipelines</SelectItem>
                {pipelines.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Period Filter */}
            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
              <SelectTrigger className="w-[160px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="3months">Últimos 3 meses</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Negócios Arquivados</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDeals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Archive className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-1">Nenhum lead arquivado</h3>
              <p className="text-sm">Leads arquivados aparecerão aqui</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Negócio</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Pipeline</TableHead>
                    <TableHead>Última Fase</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Temp.</TableHead>
                    <TableHead>Arquivado em</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.map((deal) => {
                    const TempIcon = temperatureConfig[deal.temperature].icon;
                    return (
                      <TableRow key={deal.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                              {deal.contactName
                                ?.split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2) || '??'}
                            </div>
                            <span className="font-medium">{deal.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>{deal.contactName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {deal.archivedFromPipelineName || 'Desconhecido'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {deal.archivedFromPhaseName || 'Desconhecida'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(deal.value)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TempIcon className={cn('w-4 h-4', temperatureConfig[deal.temperature].className)} />
                            <span className={temperatureConfig[deal.temperature].className}>
                              {temperatureConfig[deal.temperature].label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(deal.archivedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRestoreDialog(deal.id)}
                            disabled={pipelines.length === 0}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Desarquivar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desarquivar Negócio</AlertDialogTitle>
            <AlertDialogDescription>
              {restoringDeal && (
                <div className="space-y-2">
                  <p>
                    O negócio <strong>"{restoringDeal.title}"</strong> será restaurado para a fase <strong>"Entrada"</strong> do pipeline{' '}
                    <strong>"{targetPipeline?.name || restoringDeal.archivedFromPipelineName}"</strong>.
                  </p>
                  {!targetPipeline && (
                    <p className="text-warning">
                      ⚠️ O pipeline original não existe mais. O negócio será restaurado para o primeiro pipeline disponível.
                    </p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={pipelines.length === 0}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Desarquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
