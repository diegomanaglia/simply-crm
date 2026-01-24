import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useWebhooks } from '@/hooks/use-webhooks';
import { Webhook, WebhookEvent, WEBHOOK_EVENTS } from '@/types/webhook';
import { Plus, Trash2 } from 'lucide-react';

interface WebhookFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook: Webhook | null;
}

interface HeaderField {
  key: string;
  value: string;
}

export function WebhookFormModal({ open, onOpenChange, webhook }: WebhookFormModalProps) {
  const { createWebhook, updateWebhook } = useWebhooks();
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<'POST' | 'PUT'>('POST');
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [secretKey, setSecretKey] = useState('');
  const [headers, setHeaders] = useState<HeaderField[]>([]);
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [retryEnabled, setRetryEnabled] = useState(true);
  const [maxRetries, setMaxRetries] = useState(3);
  const [isActive, setIsActive] = useState(true);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (webhook) {
        setName(webhook.name);
        setUrl(webhook.url);
        setMethod(webhook.method);
        setEvents(webhook.events);
        setSecretKey(webhook.secret_key || '');
        setHeaders(
          Object.entries(webhook.headers || {}).map(([key, value]) => ({ key, value }))
        );
        setIpWhitelist(webhook.ip_whitelist?.join(', ') || '');
        setRetryEnabled(webhook.retry_enabled);
        setMaxRetries(webhook.max_retries);
        setIsActive(webhook.is_active);
      } else {
        setName('');
        setUrl('');
        setMethod('POST');
        setEvents([]);
        setSecretKey('');
        setHeaders([]);
        setIpWhitelist('');
        setRetryEnabled(true);
        setMaxRetries(3);
        setIsActive(true);
      }
    }
  }, [open, webhook]);

  const handleToggleEvent = (event: WebhookEvent) => {
    setEvents(prev => 
      prev.includes(event) 
        ? prev.filter(e => e !== event) 
        : [...prev, event]
    );
  };

  const handleAddHeader = () => {
    setHeaders([...headers, { key: '', value: '' }]);
  };

  const handleRemoveHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...headers];
    updated[index][field] = value;
    setHeaders(updated);
  };

  const handleSave = async () => {
    if (!name || !url || events.length === 0) return;

    setSaving(true);
    try {
      const headersObj = headers.reduce((acc, h) => {
        if (h.key && h.value) acc[h.key] = h.value;
        return acc;
      }, {} as Record<string, string>);

      const ipList = ipWhitelist
        .split(',')
        .map(ip => ip.trim())
        .filter(Boolean);

      const data = {
        name,
        url,
        method,
        events,
        secret_key: secretKey || null,
        headers: headersObj,
        ip_whitelist: ipList.length > 0 ? ipList : null,
        retry_enabled: retryEnabled,
        max_retries: maxRetries,
        is_active: isActive,
      };

      if (webhook) {
        await updateWebhook(webhook.id, data);
      } else {
        await createWebhook(data);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving webhook:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {webhook ? 'Editar Webhook' : 'Novo Webhook de Saída'}
          </DialogTitle>
          <DialogDescription>
            Configure um webhook para enviar dados quando eventos ocorrerem
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Webhook *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Notificação Slack"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Método HTTP</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as 'POST' | 'PUT')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL de Destino *</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.example.com/webhook"
            />
          </div>

          <Separator />

          {/* Events */}
          <div className="space-y-3">
            <Label>Eventos que Disparam o Webhook *</Label>
            <div className="grid grid-cols-2 gap-3">
              {WEBHOOK_EVENTS.map((event) => (
                <label
                  key={event.value}
                  className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={events.includes(event.value)}
                    onCheckedChange={() => handleToggleEvent(event.value)}
                  />
                  <div>
                    <span className="font-medium text-sm">{event.label}</span>
                    <p className="text-xs text-muted-foreground">{event.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Separator />

          {/* Headers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Headers Customizados</Label>
              <Button variant="outline" size="sm" onClick={handleAddHeader}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>
            
            {headers.length > 0 && (
              <div className="space-y-2">
                {headers.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Header (ex: Authorization)"
                      value={header.key}
                      onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                    />
                    <Input
                      placeholder="Valor"
                      value={header.value}
                      onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveHeader(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Ex: Authorization: Bearer token123
            </p>
          </div>

          <Separator />

          {/* Security */}
          <div className="space-y-4">
            <Label className="text-base">Segurança</Label>
            
            <div className="space-y-2">
              <Label htmlFor="secret">Chave Secreta (HMAC)</Label>
              <Input
                id="secret"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Opcional - será usada para assinar o payload"
              />
              <p className="text-xs text-muted-foreground">
                Se definida, o header X-Webhook-Signature será incluído com a assinatura HMAC-SHA256
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ipWhitelist">IP Whitelist</Label>
              <Input
                id="ipWhitelist"
                value={ipWhitelist}
                onChange={(e) => setIpWhitelist(e.target.value)}
                placeholder="Opcional - IPs separados por vírgula"
              />
            </div>
          </div>

          <Separator />

          {/* Retry Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Retry Automático</Label>
                <p className="text-xs text-muted-foreground">
                  Tentar novamente em caso de falha
                </p>
              </div>
              <Switch
                checked={retryEnabled}
                onCheckedChange={setRetryEnabled}
              />
            </div>

            {retryEnabled && (
              <div className="space-y-2">
                <Label htmlFor="maxRetries">Máximo de Tentativas</Label>
                <Select value={String(maxRetries)} onValueChange={(v) => setMaxRetries(Number(v))}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Webhook Ativo</Label>
              <p className="text-xs text-muted-foreground">
                Desative temporariamente sem remover
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !name || !url || events.length === 0}
          >
            {saving ? 'Salvando...' : webhook ? 'Salvar Alterações' : 'Criar Webhook'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
