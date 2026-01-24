import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { WebhookLog, InboundWebhookLog } from '@/types/webhook';
import { format } from 'date-fns';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Send, 
  ArrowDownToLine,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface WebhookLogsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhookId: string | null;
  outboundLogs: WebhookLog[];
  inboundLogs: InboundWebhookLog[];
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'success':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'retrying':
      return <RefreshCw className="w-4 h-4 text-yellow-500" />;
    case 'rejected':
      return <XCircle className="w-4 h-4 text-orange-500" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'success':
      return 'Sucesso';
    case 'failed':
      return 'Falhou';
    case 'retrying':
      return 'Tentando...';
    case 'rejected':
      return 'Rejeitado';
    default:
      return 'Pendente';
  }
}

function OutboundLogItem({ log }: { log: WebhookLog }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="p-3 bg-muted/30 rounded-lg">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 -m-3 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(log.status)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{log.event_type}</span>
                  {log.response_status && (
                    <Badge variant="outline" className="text-xs">
                      {log.response_status}
                    </Badge>
                  )}
                  {log.attempt > 1 && (
                    <Badge variant="secondary" className="text-xs">
                      Tentativa {log.attempt}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                  {log.response_time_ms && ` • ${log.response_time_ms}ms`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={log.status === 'success' ? 'default' : 'destructive'}
                className={log.status === 'success' ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}
              >
                {getStatusLabel(log.status)}
              </Badge>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 space-y-3">
          {log.error_message && (
            <div className="p-2 bg-red-500/10 rounded text-sm text-red-600">
              <strong>Erro:</strong> {log.error_message}
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Payload Enviado:</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-40">
              {JSON.stringify(log.payload, null, 2)}
            </pre>
          </div>

          {log.response_body && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Resposta:</p>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-40">
                {log.response_body}
              </pre>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function InboundLogItem({ log }: { log: InboundWebhookLog }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="p-3 bg-muted/30 rounded-lg">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer hover:bg-muted/50 -m-3 p-3 rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(log.status)}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {log.status === 'success' ? 'Negócio Criado' : 'Requisição Recebida'}
                  </span>
                  {log.source_ip && (
                    <Badge variant="outline" className="text-xs">
                      {log.source_ip}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={log.status === 'success' ? 'default' : 'destructive'}
                className={log.status === 'success' ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}
              >
                {getStatusLabel(log.status)}
              </Badge>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 space-y-3">
          {log.error_message && (
            <div className="p-2 bg-red-500/10 rounded text-sm text-red-600">
              <strong>Erro:</strong> {log.error_message}
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Payload Recebido:</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-40">
              {JSON.stringify(log.payload, null, 2)}
            </pre>
          </div>

          {log.mapped_data && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Dados Mapeados:</p>
              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-40">
                {JSON.stringify(log.mapped_data, null, 2)}
              </pre>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function WebhookLogsPanel({ 
  open, 
  onOpenChange, 
  webhookId,
  outboundLogs,
  inboundLogs,
}: WebhookLogsPanelProps) {
  const filteredOutbound = webhookId 
    ? outboundLogs.filter(l => l.webhook_id === webhookId)
    : outboundLogs;

  const filteredInbound = webhookId
    ? inboundLogs.filter(l => l.inbound_webhook_id === webhookId)
    : inboundLogs;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Logs de Webhooks</SheetTitle>
          <SheetDescription>
            Histórico das últimas 100 execuções
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="outbound" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="outbound" className="gap-2">
              <Send className="w-4 h-4" />
              Saída ({filteredOutbound.length})
            </TabsTrigger>
            <TabsTrigger value="inbound" className="gap-2">
              <ArrowDownToLine className="w-4 h-4" />
              Entrada ({filteredInbound.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="outbound" className="mt-4">
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="space-y-2 pr-4">
                {filteredOutbound.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum log de webhook de saída
                  </p>
                ) : (
                  filteredOutbound.map((log) => (
                    <OutboundLogItem key={log.id} log={log} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="inbound" className="mt-4">
            <ScrollArea className="h-[calc(100vh-250px)]">
              <div className="space-y-2 pr-4">
                {filteredInbound.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum log de webhook de entrada
                  </p>
                ) : (
                  filteredInbound.map((log) => (
                    <InboundLogItem key={log.id} log={log} />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
