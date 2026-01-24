import { useState } from 'react';
import { 
  Facebook, 
  Settings2, 
  RefreshCw, 
  Check, 
  X, 
  Copy,
  ExternalLink,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFacebookIntegration } from '@/hooks/use-facebook-integration';
import { useCRMStore } from '@/store/crmStore';
import { FacebookFormMapping } from '@/types/facebook';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function IntegrationsPage() {
  const {
    integration,
    formMappings,
    syncLogs,
    loading,
    syncing,
    connectFacebook,
    disconnectFacebook,
    saveFormMapping,
    deleteFormMapping,
    triggerSync,
  } = useFacebookIntegration();

  const { pipelines } = useCRMStore();
  
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<FacebookFormMapping | null>(null);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [showLogsSection, setShowLogsSection] = useState(false);
  
  // Form state for mapping
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [autoTags, setAutoTags] = useState<string>('Facebook Leads');
  const [defaultTemp, setDefaultTemp] = useState<'cold' | 'warm' | 'hot'>('warm');

  const handleEditMapping = (mapping: FacebookFormMapping) => {
    setEditingMapping(mapping);
    setSelectedPipeline(mapping.pipeline_id);
    setSelectedPhase(mapping.phase_id || '');
    setAutoTags(mapping.auto_tags.join(', '));
    setDefaultTemp(mapping.default_temperature);
    setShowMappingModal(true);
  };

  const handleSaveMapping = async () => {
    if (!editingMapping || !selectedPipeline) return;
    
    await saveFormMapping({
      id: editingMapping.id,
      pipeline_id: selectedPipeline,
      phase_id: selectedPhase || null,
      auto_tags: autoTags.split(',').map(t => t.trim()).filter(Boolean),
      default_temperature: defaultTemp,
      is_active: editingMapping.is_active,
    });
    
    setShowMappingModal(false);
    setEditingMapping(null);
  };

  const selectedPipelineData = pipelines.find(p => p.id === selectedPipeline);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Carregando integrações..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
        <p className="text-muted-foreground mt-1">
          Conecte serviços externos para capturar leads automaticamente
        </p>
      </div>

      {/* Facebook Lead Ads Card */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1877F2] rounded-xl flex items-center justify-center">
              <Facebook className="w-7 h-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Facebook Lead Ads</CardTitle>
              <CardDescription>
                Importe leads de formulários do Facebook automaticamente
              </CardDescription>
            </div>
          </div>
          
          {integration?.status === 'connected' ? (
            <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
              <Check className="w-3 h-3 mr-1" />
              Conectado
            </Badge>
          ) : (
            <Badge variant="secondary">
              <X className="w-3 h-3 mr-1" />
              Desconectado
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Connection Status */}
          {integration?.status === 'connected' ? (
            <>
              {/* Connected Account Info */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={integration.user_picture || undefined} />
                    <AvatarFallback>{integration.user_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{integration.user_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Conectado em {format(new Date(integration.connected_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowDisconnectDialog(true)}
                >
                  Desconectar
                </Button>
              </div>

              {/* Pages */}
              {integration.pages.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Páginas Vinculadas</h4>
                  <div className="grid gap-2">
                    {integration.pages.map((page) => (
                      <div 
                        key={page.id} 
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={page.picture} />
                          <AvatarFallback>{page.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{page.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Form Mappings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium">Mapeamento de Formulários</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure como os leads são importados para cada pipeline
                    </p>
                  </div>
                </div>

                {formMappings.length === 0 ? (
                  <EmptyState
                    icon={Settings2}
                    title="Nenhum formulário configurado"
                    description="Formulários do Facebook Lead Ads aparecerão aqui após a sincronização"
                  />
                ) : (
                  <div className="space-y-3">
                    {formMappings.map((mapping) => {
                      const pipeline = pipelines.find(p => p.id === mapping.pipeline_id);
                      const phase = pipeline?.phases.find(ph => ph.id === mapping.phase_id);
                      
                      return (
                        <div 
                          key={mapping.id} 
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{mapping.form_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {mapping.page_name}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              → {pipeline?.name || 'Pipeline não encontrado'} 
                              {phase && ` → ${phase.name}`}
                            </p>
                            <div className="flex gap-1 mt-2">
                              {mapping.auto_tags.map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={mapping.is_active}
                              onCheckedChange={(checked) => 
                                saveFormMapping({ ...mapping, is_active: checked })
                              }
                            />
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditMapping(mapping)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteFormMapping(mapping.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Separator />

              {/* Sync Controls */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Sincronização</h4>
                  <p className="text-sm text-muted-foreground">
                    Leads são sincronizados automaticamente a cada 5 minutos
                  </p>
                </div>
                <Button 
                  onClick={triggerSync} 
                  disabled={syncing}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                </Button>
              </div>

              {/* Sync Logs Collapsible */}
              <Collapsible open={showLogsSection} onOpenChange={setShowLogsSection}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Histórico de Sincronizações
                    </span>
                    {showLogsSection ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  {syncLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma sincronização realizada ainda
                    </p>
                  ) : (
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {syncLogs.map((log) => (
                          <div 
                            key={log.id} 
                            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg text-sm"
                          >
                            <div className="flex items-center gap-3">
                              {log.status === 'success' ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : log.status === 'error' ? (
                                <X className="w-4 h-4 text-destructive" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                              )}
                              <div>
                                <span className="font-medium">
                                  {log.leads_imported} leads importados
                                </span>
                                {log.leads_duplicates > 0 && (
                                  <span className="text-muted-foreground ml-2">
                                    ({log.leads_duplicates} duplicados)
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {log.sync_type === 'manual' ? 'Manual' : 'Auto'}
                              </Badge>
                              <span>
                                {format(new Date(log.started_at), "dd/MM HH:mm")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </>
          ) : (
            /* Not Connected State */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Facebook className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">Conecte sua conta do Facebook</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Importe leads automaticamente dos seus formulários de Lead Ads 
                diretamente para seus pipelines
              </p>
              <Button onClick={connectFacebook} className="gap-2">
                <Facebook className="w-4 h-4" />
                Conectar Facebook
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future Integrations Placeholder */}
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="py-8 text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-muted-foreground mb-1">
            Mais integrações em breve
          </h3>
          <p className="text-sm text-muted-foreground">
            Google Ads, LinkedIn, Instagram e mais...
          </p>
        </CardContent>
      </Card>

      {/* Mapping Edit Modal */}
      <Dialog open={showMappingModal} onOpenChange={setShowMappingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Mapeamento</DialogTitle>
            <DialogDescription>
              Configure como os leads deste formulário serão importados
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {editingMapping && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{editingMapping.form_name}</p>
                <p className="text-sm text-muted-foreground">{editingMapping.page_name}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Pipeline de Destino</Label>
              <Select value={selectedPipeline} onValueChange={setSelectedPipeline}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um pipeline" />
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

            {selectedPipelineData && (
              <div className="space-y-2">
                <Label>Fase de Entrada</Label>
                <Select value={selectedPhase} onValueChange={setSelectedPhase}>
                  <SelectTrigger>
                    <SelectValue placeholder="Fase padrão (Entrada)" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedPipelineData.phases.map((phase) => (
                      <SelectItem key={phase.id} value={phase.id}>
                        {phase.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Tags Automáticas</Label>
              <Input 
                value={autoTags}
                onChange={(e) => setAutoTags(e.target.value)}
                placeholder="Facebook Leads, Campanha X"
              />
              <p className="text-xs text-muted-foreground">
                Separe múltiplas tags por vírgula
              </p>
            </div>

            <div className="space-y-2">
              <Label>Temperatura Padrão</Label>
              <Select 
                value={defaultTemp} 
                onValueChange={(v) => setDefaultTemp(v as 'cold' | 'warm' | 'hot')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold">Frio</SelectItem>
                  <SelectItem value="warm">Morno</SelectItem>
                  <SelectItem value="hot">Quente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMappingModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMapping} disabled={!selectedPipeline}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desconectar Facebook?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá parar a sincronização automática de leads. 
              Os leads já importados permanecerão no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={disconnectFacebook}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
