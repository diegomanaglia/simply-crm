import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Pipeline, Phase, Temperature } from '@/types/crm';
import { 
  ExportFilters, 
  ExportDeal, 
  filterDeals, 
  calculateSummary,
  exportToExcel, 
  exportToCSV 
} from '@/lib/export-utils';
import { exportToPDF } from '@/lib/pdf-export';
import { FileSpreadsheet, FileText, FileDown, CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline: Pipeline;
  allDeals: ExportDeal[];
}

export function ExportModal({ open, onOpenChange, pipeline, allDeals }: ExportModalProps) {
  const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [status, setStatus] = useState<'all' | 'active' | 'archived'>('all');
  const [selectedTemps, setSelectedTemps] = useState<Temperature[]>([]);
  const [tagFilter, setTagFilter] = useState('');
  const [exportFormat, setExportFormat] = useState<'excel' | 'csv' | 'pdf'>('excel');
  const [includeArchived, setIncludeArchived] = useState(false);

  // Get all unique tags from deals
  const allTags = [...new Set(allDeals.flatMap(d => d.tags.map(t => t.name)))];

  const handleTogglePhase = (phaseId: string) => {
    setSelectedPhases(prev =>
      prev.includes(phaseId)
        ? prev.filter(id => id !== phaseId)
        : [...prev, phaseId]
    );
  };

  const handleToggleTemp = (temp: Temperature) => {
    setSelectedTemps(prev =>
      prev.includes(temp)
        ? prev.filter(t => t !== temp)
        : [...prev, temp]
    );
  };

  const handleExport = () => {
    const filters: ExportFilters = {
      phases: selectedPhases.length > 0 ? selectedPhases : undefined,
      dateFrom,
      dateTo,
      status,
      temperatures: selectedTemps.length > 0 ? selectedTemps : undefined,
      tags: tagFilter ? tagFilter.split(',').map(t => t.trim()) : undefined,
    };

    const filteredDeals = filterDeals(allDeals, filters);
    const summary = calculateSummary(filteredDeals, allDeals);
    const filename = `${pipeline.name.toLowerCase().replace(/\s+/g, '-')}-negocios`;

    switch (exportFormat) {
      case 'excel':
        exportToExcel(filteredDeals, filename, summary);
        break;
      case 'csv':
        exportToCSV(filteredDeals, filename);
        break;
      case 'pdf':
        exportToPDF(
          filteredDeals, 
          filename, 
          `Relatório: ${pipeline.name}`,
          summary,
          { from: dateFrom, to: dateTo }
        );
        break;
    }

    onOpenChange(false);
  };

  const filteredCount = filterDeals(allDeals, {
    phases: selectedPhases.length > 0 ? selectedPhases : undefined,
    dateFrom,
    dateTo,
    status,
    temperatures: selectedTemps.length > 0 ? selectedTemps : undefined,
    tags: tagFilter ? tagFilter.split(',').map(t => t.trim()) : undefined,
  }).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exportar Pipeline: {pipeline.name}
          </DialogTitle>
          <DialogDescription>
            Configure os filtros e escolha o formato de exportação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Phase Filter */}
          <div className="space-y-3">
            <Label>Fases</Label>
            <div className="flex flex-wrap gap-2">
              {pipeline.phases.map((phase) => (
                <label
                  key={phase.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors",
                    selectedPhases.includes(phase.id)
                      ? "border-primary bg-primary/10"
                      : "hover:bg-muted/50"
                  )}
                >
                  <Checkbox
                    checked={selectedPhases.includes(phase.id)}
                    onCheckedChange={() => handleTogglePhase(phase.id)}
                  />
                  <span className="text-sm">{phase.name}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Deixe em branco para exportar todas as fases
            </p>
          </div>

          <Separator />

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Separator />

          {/* Status & Temperature */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Apenas Ativos</SelectItem>
                  <SelectItem value="archived">Apenas Arquivados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Temperatura</Label>
              <div className="flex gap-2">
                {(['cold', 'warm', 'hot'] as Temperature[]).map((temp) => (
                  <Button
                    key={temp}
                    variant={selectedTemps.includes(temp) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleToggleTemp(temp)}
                  >
                    {temp === 'cold' && '❄️ Frio'}
                    {temp === 'warm' && '🌡️ Morno'}
                    {temp === 'hot' && '🔥 Quente'}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (separadas por vírgula)</Label>
            <Input
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              placeholder="Ex: VIP, Urgente"
            />
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {allTags.slice(0, 10).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      const currentTags = tagFilter ? tagFilter.split(',').map(t => t.trim()) : [];
                      if (currentTags.includes(tag)) {
                        setTagFilter(currentTags.filter(t => t !== tag).join(', '));
                      } else {
                        setTagFilter([...currentTags, tag].join(', '));
                      }
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Export Format */}
          <div className="space-y-3">
            <Label>Formato de Exportação</Label>
            <div className="grid grid-cols-3 gap-3">
              <label
                className={cn(
                  "flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors",
                  exportFormat === 'excel'
                    ? "border-primary bg-primary/10"
                    : "hover:bg-muted/50"
                )}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={exportFormat === 'excel'}
                  onChange={() => setExportFormat('excel')}
                />
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
                <span className="font-medium text-sm">Excel</span>
                <span className="text-xs text-muted-foreground">.xlsx</span>
              </label>

              <label
                className={cn(
                  "flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors",
                  exportFormat === 'csv'
                    ? "border-primary bg-primary/10"
                    : "hover:bg-muted/50"
                )}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={exportFormat === 'csv'}
                  onChange={() => setExportFormat('csv')}
                />
                <FileText className="w-8 h-8 text-blue-600" />
                <span className="font-medium text-sm">CSV</span>
                <span className="text-xs text-muted-foreground">.csv</span>
              </label>

              <label
                className={cn(
                  "flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors",
                  exportFormat === 'pdf'
                    ? "border-primary bg-primary/10"
                    : "hover:bg-muted/50"
                )}
              >
                <input
                  type="radio"
                  className="sr-only"
                  checked={exportFormat === 'pdf'}
                  onChange={() => setExportFormat('pdf')}
                />
                <FileDown className="w-8 h-8 text-red-600" />
                <span className="font-medium text-sm">PDF</span>
                <span className="text-xs text-muted-foreground">.pdf</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm">
              <strong>{filteredCount}</strong> negócios serão exportados
              {filteredCount !== allDeals.length && (
                <span className="text-muted-foreground"> (de {allDeals.length} total)</span>
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={filteredCount === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar {exportFormat.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
