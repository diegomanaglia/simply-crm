import { useState } from 'react';
import {
  Webhook,
  Plus,
  Settings2,
  Send,
  ArrowDownToLine,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Copy,
  Trash2,
  Edit2,
  Play,
  MoreVertical,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useWebhooks } from '@/hooks/use-webhooks';
import { useCRMStore } from '@/store/crmStore';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { WebhookFormModal } from './WebhookFormModal';
import { InboundWebhookFormModal } from './InboundWebhookFormModal';
import { WebhookLogsPanel } from './WebhookLogsPanel';
import { Webhook as WebhookType, InboundWebhook, WEBHOOK_EVENTS } from '@/types/webhook';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function WebhooksCard() {
  const {
    webhooks,
    inboundWebhooks,
    webhookLogs,
    inboundLogs,
    loading,
    testing,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    updateInboundWebhook,
    deleteInboundWebhook,
    getWebhookStats,
  } = useWebhooks();

  const { pipelines } = useCRMStore();

  const [showOutboundModal, setShowOutboundModal] = useState(false);
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookType | null>(null);
  const [editingInbound, setEditingInbound] = useState<InboundWebhook | null>(null);
  const [showLogsPanel, setShowLogsPanel] = useState(false);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'outbound' | 'inbound'; id: string } | null>(null);

  const stats = getWebhookStats();

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiada');
  };

  const getInboundUrl = (webhook: InboundWebhook) => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${baseUrl}/functions/v1/webhook-receive/receive/${webhook.pipeline_id}/${webhook.secret_token}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <LoadingSpinner text="Carregando webhooks..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Webhook className="w-7 h-7 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Webhooks</CardTitle>
              <CardDescription>
                Envie e receba dados automaticamente via HTTP
              </CardDescription>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowLogsPanel(true)}>
              <Activity className="w-4 h-4 mr-2" />
              Logs
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-foreground">{stats.activeWebhooks}</p>
              <p className="text-xs text-muted-foreground">Webhooks Ativos</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-2xl font-bold text-foreground">{stats.totalToday}</p>
              <p className="text-xs text-muted-foreground">Eventos Hoje</p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{stats.successCount}</p>
              <p className="text-xs text-muted-foreground">Sucessos</p>
            </div>
            <div className="p-4 bg-red-500/10 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600">{stats.failedCount}</p>
              <p className="text-xs text-muted-foreground">Falhas</p>
            </div>
          </div>

          <Tabs defaultValue="outbound" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="outbound" className="gap-2">
                <Send className="w-4 h-4" />
                Saída ({webhooks.length})
              </TabsTrigger>
              <TabsTrigger value="inbound" className="gap-2">
                <ArrowDownToLine className="w-4 h-4" />
                Entrada ({inboundWebhooks.length})
              </TabsTrigger>
            </TabsList>

            {/* Outbound Webhooks */}
            <TabsContent value="outbound" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Envie dados para URLs externas quando eventos ocorrerem
                </p>
                <Button onClick={() => { setEditingWebhook(null); setShowOutboundModal(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Webhook
                </Button>
              </div>

              {webhooks.length === 0 ? (
                <EmptyState
                  icon={Send}
                  title="Nenhum webhook de saída"
                  description="Configure webhooks para enviar dados para sistemas externos"
                />
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-3">
                    {webhooks.map((webhook) => (
                      <div
                        key={webhook.id}
                        className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium truncate">{webhook.name}</span>
                              {webhook.consecutive_failures > 0 ? (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  {webhook.consecutive_failures} falhas
                                </Badge>
                              ) : webhook.last_success_at ? (
                                <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  OK
                                </Badge>
                              ) : null}
                            </div>
                            
                            <p className="text-xs text-muted-foreground truncate mb-2">
                              {webhook.method} {webhook.url}
                            </p>
                            
                            <div className="flex flex-wrap gap-1">
                              {webhook.events.map((event) => (
                                <Badge key={event} variant="secondary" className="text-xs">
                                  {WEBHOOK_EVENTS.find(e => e.value === event)?.label || event}
                                </Badge>
                              ))}
                            </div>

                            {webhook.last_triggered_at && (
                              <p className="text-xs text-muted-foreground mt-2">
                                <Clock className="w-3 h-3 inline mr-1" />
                                Último: {format(new Date(webhook.last_triggered_at), 'dd/MM HH:mm')}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <Switch
                              checked={webhook.is_active}
                              onCheckedChange={(checked) => 
                                updateWebhook(webhook.id, { is_active: checked })
                              }
                            />
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => testWebhook(webhook.id)}
                              disabled={testing}
                            >
                              <Play className="w-4 h-4" />
                            </Button>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { setEditingWebhook(webhook); setShowOutboundModal(true); }}>
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedWebhookId(webhook.id); setShowLogsPanel(true); }}>
                                  <Activity className="w-4 h-4 mr-2" />
                                  Ver Logs
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => setDeleteConfirm({ type: 'outbound', id: webhook.id })}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remover
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            {/* Inbound Webhooks */}
            <TabsContent value="inbound" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Receba dados de sistemas externos para criar negócios
                </p>
                <Button onClick={() => { setEditingInbound(null); setShowInboundModal(true); }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Webhook
                </Button>
              </div>

              {inboundWebhooks.length === 0 ? (
                <EmptyState
                  icon={ArrowDownToLine}
                  title="Nenhum webhook de entrada"
                  description="Configure webhooks para receber dados e criar negócios automaticamente"
                />
              ) : (
                <ScrollArea className="max-h-96">
                  <div className="space-y-3">
                    {inboundWebhooks.map((webhook) => {
                      const pipeline = pipelines.find(p => p.id === webhook.pipeline_id);
                      const webhookUrl = getInboundUrl(webhook);

                      return (
                        <div
                          key={webhook.id}
                          className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium truncate">{webhook.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {pipeline?.name || 'Pipeline não encontrado'}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate max-w-md">
                                  {webhookUrl}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleCopyUrl(webhookUrl)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>{webhook.requests_today} requisições hoje</span>
                                {webhook.last_request_at && (
                                  <span>
                                    Última: {format(new Date(webhook.last_request_at), 'dd/MM HH:mm')}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              <Switch
                                checked={webhook.is_active}
                                onCheckedChange={(checked) => 
                                  updateInboundWebhook(webhook.id, { is_active: checked })
                                }
                              />

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setEditingInbound(webhook); setShowInboundModal(true); }}>
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleCopyUrl(webhookUrl)}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copiar URL
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => setDeleteConfirm({ type: 'inbound', id: webhook.id })}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Remover
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Outbound Webhook Modal */}
      <WebhookFormModal
        open={showOutboundModal}
        onOpenChange={setShowOutboundModal}
        webhook={editingWebhook}
      />

      {/* Inbound Webhook Modal */}
      <InboundWebhookFormModal
        open={showInboundModal}
        onOpenChange={setShowInboundModal}
        webhook={editingInbound}
      />

      {/* Logs Panel */}
      <WebhookLogsPanel
        open={showLogsPanel}
        onOpenChange={setShowLogsPanel}
        webhookId={selectedWebhookId}
        outboundLogs={webhookLogs}
        inboundLogs={inboundLogs}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Webhook</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O webhook e todos os seus logs serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirm) {
                  if (deleteConfirm.type === 'outbound') {
                    deleteWebhook(deleteConfirm.id);
                  } else {
                    deleteInboundWebhook(deleteConfirm.id);
                  }
                  setDeleteConfirm(null);
                }
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
