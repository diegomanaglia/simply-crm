import { useState } from 'react';
import { 
  RefreshCw, 
  Check, 
  X, 
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  TrendingUp
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
import { useGoogleIntegration } from '@/hooks/use-google-integration';
import { useCRMStore } from '@/store/crmStore';
import { GoogleCampaignMapping } from '@/types/google';
import { EmptyState } from '@/components/ui/empty-state';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Google Ads logo SVG
function GoogleAdsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12.92 19.26l5.92-10.24a2.78 2.78 0 0 0-1.02-3.8 2.78 2.78 0 0 0-3.8 1.02L8.1 16.48a2.78 2.78 0 0 0 1.02 3.8 2.78 2.78 0 0 0 3.8-1.02z" fill="#FBBC04"/>
      <path d="M5.16 19.26l5.92-10.24a2.78 2.78 0 0 0-1.02-3.8 2.78 2.78 0 0 0-3.8 1.02L.34 16.48a2.78 2.78 0 0 0 1.02 3.8 2.78 2.78 0 0 0 3.8-1.02z" fill="#4285F4"/>
      <circle cx="18.54" cy="17.29" r="2.78" fill="#34A853"/>
    </svg>
  );
}

interface GoogleAdsCardProps {
  onOpenReports?: () => void;
}

export function GoogleAdsCard({ onOpenReports }: GoogleAdsCardProps) {
  const {
    integration,
    campaignMappings,
    syncLogs,
    syncing,
    connectGoogle,
    disconnectGoogle,
    selectAdsAccount,
    saveCampaignMapping,
    deleteCampaignMapping,
    triggerSync,
    getReportMetrics,
  } = useGoogleIntegration();

  const { pipelines } = useCRMStore();
  
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState<GoogleCampaignMapping | null>(null);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [showLogsSection, setShowLogsSection] = useState(false);
  
  // Form state for mapping
  const [selectedPipeline, setSelectedPipeline] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [autoTags, setAutoTags] = useState<string>('Google Ads');
  const [defaultTemp, setDefaultTemp] = useState<'cold' | 'warm' | 'hot'>('warm');

  const handleEditMapping = (mapping: GoogleCampaignMapping) => {
    setEditingMapping(mapping);
    setSelectedPipeline(mapping.pipeline_id);
    setSelectedPhase(mapping.phase_id || '');
    setAutoTags(mapping.auto_tags.join(', '));
    setDefaultTemp(mapping.default_temperature);
    setShowMappingModal(true);
  };

  const handleSaveMapping = async () => {
    if (!editingMapping || !selectedPipeline) return;
    
    await saveCampaignMapping({
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
  const metrics = getReportMetrics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <>
      <Card className="border-border">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border">
              <GoogleAdsIcon className="w-7 h-7" />
            </div>
            <div>
              <CardTitle className="text-lg">Google Ads</CardTitle>
              <CardDescription>
                Sincronize campanhas e envie conversões offline
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
          {integration?.status === 'connected' ? (
            <>
              {/* Connected Account Info */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={integration.user_picture || undefined} />
                    <AvatarFallback>{integration.user_email[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{integration.user_name || integration.user_email}</p>
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

              {/* Account Selection */}
              {integration.ads_accounts.length > 0 && (
                <div className="space-y-2">
                  <Label>Conta Google Ads</Label>
                  <Select 
                    value={integration.selected_account_id || ''} 
                    onValueChange={selectAdsAccount}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {integration.ads_accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({account.id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Quick Metrics */}
              {metrics.totalImpressions > 0 && (
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className="text-2xl font-bold">{metrics.totalImpressions.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-muted-foreground">Impressões</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className="text-2xl font-bold">{metrics.totalClicks.toLocaleString('pt-BR')}</p>
                    <p className="text-xs text-muted-foreground">Cliques</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className="text-2xl font-bold">{formatCurrency(metrics.totalCost)}</p>
                    <p className="text-xs text-muted-foreground">Investimento</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg text-center">
                    <p className="text-2xl font-bold">{metrics.totalConversions.toFixed(0)}</p>
                    <p className="text-xs text-muted-foreground">Conversões</p>
                  </div>
                </div>
              )}

              <Separator />

              {/* Campaign Mappings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium">Mapeamento de Campanhas</h4>
                    <p className="text-sm text-muted-foreground">
                      Associe campanhas a pipelines para rastrear leads
                    </p>
                  </div>
                </div>

                {campaignMappings.length === 0 ? (
                  <EmptyState
                    icon={TrendingUp}
                    title="Nenhuma campanha configurada"
                    description="Sincronize para ver suas campanhas ativas"
                  />
                ) : (
                  <div className="space-y-3">
                    {campaignMappings.map((mapping) => {
                      const pipeline = pipelines.find(p => p.id === mapping.pipeline_id);
                      const phase = pipeline?.phases.find(ph => ph.id === mapping.phase_id);
                      
                      return (
                        <div 
                          key={mapping.id} 
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{mapping.campaign_name}</span>
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
                                saveCampaignMapping({ ...mapping, is_active: checked })
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
                              onClick={() => deleteCampaignMapping(mapping.id)}
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

              {/* Offline Conversions Info */}
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h4 className="font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Conversões Offline
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Quando um negócio for marcado como "Ganho", a conversão será enviada 
                  automaticamente para o Google Ads usando o GCLID capturado.
                </p>
              </div>

              <Separator />

              {/* Sync Controls */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Sincronização</h4>
                  <p className="text-sm text-muted-foreground">
                    Métricas são sincronizadas diariamente
                  </p>
                </div>
                <div className="flex gap-2">
                  {onOpenReports && (
                    <Button variant="outline" onClick={onOpenReports}>
                      Ver Relatórios
                    </Button>
                  )}
                  <Button 
                    onClick={() => triggerSync('metrics')} 
                    disabled={syncing}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Sincronizando...' : 'Sincronizar'}
                  </Button>
                </div>
              </div>

              {/* Sync Logs */}
              <Collapsible open={showLogsSection} onOpenChange={setShowLogsSection}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Histórico de Sincronizações
                    </span>
                    {showLogsSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  {syncLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma sincronização realizada ainda
                    </p>
                  ) : (
                    <ScrollArea className="h-48">
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
                                <span className="font-medium">{log.records_synced} registros</span>
                                <span className="text-muted-foreground ml-2">({log.sync_type})</span>
                              </div>
                            </div>
                            <span className="text-muted-foreground">
                              {format(new Date(log.started_at), "dd/MM HH:mm")}
                            </span>
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
                <GoogleAdsIcon className="w-8 h-8" />
              </div>
              <h3 className="font-medium mb-2">Conecte sua conta do Google Ads</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Sincronize métricas de campanhas e envie conversões offline 
                automaticamente quando negócios forem ganhos
              </p>
              <Button onClick={connectGoogle} className="gap-2">
                <GoogleAdsIcon className="w-4 h-4" />
                Conectar com Google
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mapping Edit Modal */}
      <Dialog open={showMappingModal} onOpenChange={setShowMappingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Mapeamento</DialogTitle>
            <DialogDescription>
              Configure como os leads desta campanha serão importados
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {editingMapping && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{editingMapping.campaign_name}</p>
                <p className="text-sm text-muted-foreground">ID: {editingMapping.campaign_id}</p>
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
                placeholder="Google Ads, Campanha X"
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
            <AlertDialogTitle>Desconectar Google Ads?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá parar a sincronização de métricas e envio de conversões. 
              Os dados já sincronizados permanecerão no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={disconnectGoogle}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
