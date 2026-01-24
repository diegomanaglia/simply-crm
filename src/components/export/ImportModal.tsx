import { useState, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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
import { Pipeline } from '@/types/crm';
import { useCRMStore } from '@/store/crmStore';
import { parseImportFile, generateImportTemplate, ParsedImportRow } from '@/lib/export-utils';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

export function ImportModal({ open, onOpenChange }: ImportModalProps) {
  const { pipelines, addDeal } = useCRMStore();
  const [step, setStep] = useState<ImportStep>('upload');
  const [selectedPipeline, setSelectedPipeline] = useState('');
  const [parsedData, setParsedData] = useState<ParsedImportRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.[0]) {
      await processFile(files[0]);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    try {
      const data = await parseImportFile(file);
      setParsedData(data);
      setStep('preview');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao processar arquivo');
    }
  };

  const handleImport = async () => {
    if (!selectedPipeline || parsedData.length === 0) return;

    const pipeline = pipelines.find(p => p.id === selectedPipeline);
    if (!pipeline) return;

    const entryPhase = pipeline.phases.find(p => p.type === 'entry');
    if (!entryPhase) {
      toast.error('Pipeline não possui fase de entrada');
      return;
    }

    setStep('importing');
    let success = 0;
    let failed = 0;

    const validRows = parsedData.filter(r => r.isValid);

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        addDeal(selectedPipeline, {
          title: row.title,
          contactName: row.contactName,
          email: row.email,
          phone: row.phone,
          document: row.document,
          value: row.value,
          temperature: row.temperature,
          source: row.source || 'Importação',
          tags: row.tags.map((name, idx) => ({
            id: `import-tag-${idx}`,
            name,
            color: '#6366f1',
          })),
          notes: row.notes,
          company: row.company,
          phaseId: entryPhase.id,
        });
        success++;
      } catch (error) {
        failed++;
      }

      setImportProgress(((i + 1) / validRows.length) * 100);
      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setImportResults({ success, failed });
    setStep('complete');
  };

  const handleClose = () => {
    setStep('upload');
    setParsedData([]);
    setSelectedPipeline('');
    setImportProgress(0);
    setImportResults({ success: 0, failed: 0 });
    onOpenChange(false);
  };

  const validCount = parsedData.filter(r => r.isValid).length;
  const invalidCount = parsedData.filter(r => !r.isValid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Importar Negócios
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Faça upload de um arquivo CSV ou Excel com seus negócios'}
            {step === 'preview' && 'Confira os dados antes de importar'}
            {step === 'importing' && 'Importando negócios...'}
            {step === 'complete' && 'Importação concluída!'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-4">
          {/* Upload Step */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div
                className={`
                  border-2 border-dashed rounded-lg p-12 text-center transition-colors
                  ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  Arraste um arquivo ou clique para selecionar
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Suporta arquivos .xlsx, .xls e .csv
                </p>
                <input
                  type="file"
                  id="file-upload"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Selecionar Arquivo
                  </label>
                </Button>
              </div>

              <div className="flex items-center justify-center gap-4">
                <div className="h-px bg-border flex-1" />
                <span className="text-sm text-muted-foreground">ou</span>
                <div className="h-px bg-border flex-1" />
              </div>

              <div className="text-center">
                <Button variant="outline" onClick={generateImportTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Template de Importação
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Use o template para garantir que seus dados estão no formato correto
                </p>
              </div>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {validCount} válidos
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      {invalidCount} com erros
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Label>Pipeline de destino:</Label>
                  <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Selecione" />
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
              </div>

              <ScrollArea className="flex-1 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead>Negócio</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Temp.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, index) => (
                      <TableRow key={index} className={!row.isValid ? 'bg-destructive/5' : ''}>
                        <TableCell>
                          {row.isValid ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="group relative">
                              <AlertCircle className="w-4 h-4 text-destructive" />
                              <div className="absolute left-0 top-6 hidden group-hover:block z-10 p-2 bg-popover border rounded-lg shadow-lg text-xs max-w-xs">
                                {row.errors.join(', ')}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{row.title}</TableCell>
                        <TableCell>{row.contactName}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.phone}</TableCell>
                        <TableCell className="text-right">
                          {row.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </TableCell>
                        <TableCell>
                          {row.temperature === 'cold' && '❄️'}
                          {row.temperature === 'warm' && '🌡️'}
                          {row.temperature === 'hot' && '🔥'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {/* Importing Step */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <div className="text-center">
                <p className="text-lg font-medium">Importando negócios...</p>
                <p className="text-sm text-muted-foreground">
                  Por favor, aguarde
                </p>
              </div>
              <Progress value={importProgress} className="w-64" />
              <p className="text-sm text-muted-foreground">
                {Math.round(importProgress)}% concluído
              </p>
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <div className="text-center">
                <p className="text-xl font-medium">Importação Concluída!</p>
                <p className="text-muted-foreground mt-2">
                  {importResults.success} negócios importados com sucesso
                  {importResults.failed > 0 && (
                    <span className="text-destructive">
                      , {importResults.failed} falharam
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}

          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => { setStep('upload'); setParsedData([]); }}>
                Voltar
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={validCount === 0 || !selectedPipeline}
              >
                Importar {validCount} Negócios
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button onClick={handleClose}>
              Concluir
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
