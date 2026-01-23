import { useState } from 'react';
import { Archive, RotateCcw, Trash2, Search, Snowflake, Sun, Flame } from 'lucide-react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const temperatureConfig: Record<Temperature, { icon: typeof Snowflake; className: string }> = {
  cold: { icon: Snowflake, className: 'text-info' },
  warm: { icon: Sun, className: 'text-warning' },
  hot: { icon: Flame, className: 'text-destructive' },
};

export default function ArchivedLeadsPage() {
  const { archivedDeals, pipelines, restoreDeal } = useCRMStore();
  const [search, setSearch] = useState('');
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoringDealId, setRestoringDealId] = useState<string | null>(null);

  const filteredDeals = archivedDeals.filter((deal) => {
    const matchesSearch =
      deal.title.toLowerCase().includes(search.toLowerCase()) ||
      deal.contactName.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const handleRestore = () => {
    if (restoringDealId && selectedPipeline) {
      const pipeline = pipelines.find((p) => p.id === selectedPipeline);
      const entryPhase = pipeline?.phases.find((p) => p.type === 'entry');
      if (entryPhase) {
        restoreDeal(restoringDealId, selectedPipeline, entryPhase.id);
      }
    }
    setShowRestoreDialog(false);
    setRestoringDealId(null);
    setSelectedPipeline('');
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

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads Arquivados</h1>
          <p className="text-muted-foreground">Negócios que foram arquivados</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar leads arquivados..."
          className="pl-10"
        />
      </div>

      {/* Archived Deals List */}
      {filteredDeals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border rounded-xl bg-card">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Archive className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum lead arquivado</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Leads arquivados aparecerão aqui. Você pode restaurá-los a qualquer momento.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDeals.map((deal) => {
            const TempIcon = temperatureConfig[deal.temperature].icon;
            return (
              <div
                key={deal.id}
                className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:shadow-card transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                    <TempIcon
                      className={cn('w-5 h-5', temperatureConfig[deal.temperature].className)}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{deal.title}</h3>
                    <p className="text-sm text-muted-foreground">{deal.contactName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-primary">{formatCurrency(deal.value)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(deal.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openRestoreDialog(deal.id)}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restaurar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Restore Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione o pipeline para onde deseja restaurar este lead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} disabled={!selectedPipeline}>
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
