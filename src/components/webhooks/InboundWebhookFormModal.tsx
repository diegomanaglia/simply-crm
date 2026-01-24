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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useWebhooks } from '@/hooks/use-webhooks';
import { useCRMStore } from '@/store/crmStore';
import { InboundWebhook, FieldMapping, TARGET_FIELDS, FIELD_TRANSFORMS } from '@/types/webhook';
import { Plus, Trash2, ArrowRight, GripVertical } from 'lucide-react';

interface InboundWebhookFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook: InboundWebhook | null;
}

export function InboundWebhookFormModal({ open, onOpenChange, webhook }: InboundWebhookFormModalProps) {
  const { createInboundWebhook, updateInboundWebhook } = useWebhooks();
  const { pipelines } = useCRMStore();
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [pipelineId, setPipelineId] = useState('');
  const [phaseId, setPhaseId] = useState('');
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [defaultTags, setDefaultTags] = useState('Webhook');
  const [defaultTemperature, setDefaultTemperature] = useState<'cold' | 'warm' | 'hot'>('warm');
  const [hmacSecret, setHmacSecret] = useState('');
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [isActive, setIsActive] = useState(true);

  const selectedPipeline = pipelines.find(p => p.id === pipelineId);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (webhook) {
        setName(webhook.name);
        setPipelineId(webhook.pipeline_id);
        setPhaseId(webhook.phase_id || '');
        setFieldMappings(webhook.field_mappings);
        setDefaultTags(webhook.default_tags.join(', '));
        setDefaultTemperature(webhook.default_temperature);
        setHmacSecret(webhook.hmac_secret || '');
        setIpWhitelist(webhook.ip_whitelist?.join(', ') || '');
        setIsActive(webhook.is_active);
      } else {
        setName('');
        setPipelineId('');
        setPhaseId('');
        setFieldMappings([
          { id: crypto.randomUUID(), source: '', target: 'contact_name' },
          { id: crypto.randomUUID(), source: '', target: 'email' },
          { id: crypto.randomUUID(), source: '', target: 'phone' },
        ]);
        setDefaultTags('Webhook');
        setDefaultTemperature('warm');
        setHmacSecret('');
        setIpWhitelist('');
        setIsActive(true);
      }
    }
  }, [open, webhook]);

  const handleAddMapping = () => {
    setFieldMappings([
      ...fieldMappings,
      { id: crypto.randomUUID(), source: '', target: '' },
    ]);
  };

  const handleRemoveMapping = (id: string) => {
    setFieldMappings(fieldMappings.filter(m => m.id !== id));
  };

  const handleMappingChange = (id: string, field: keyof FieldMapping, value: string) => {
    setFieldMappings(fieldMappings.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handleSave = async () => {
    if (!name || !pipelineId) return;

    setSaving(true);
    try {
      const tags = defaultTags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const ipList = ipWhitelist
        .split(',')
        .map(ip => ip.trim())
        .filter(Boolean);

      const data = {
        name,
        pipeline_id: pipelineId,
        phase_id: phaseId || null,
        field_mappings: fieldMappings.filter(m => m.source && m.target),
        default_tags: tags,
        default_temperature: defaultTemperature,
        hmac_secret: hmacSecret || null,
        ip_whitelist: ipList.length > 0 ? ipList : null,
        is_active: isActive,
      };

      if (webhook) {
        await updateInboundWebhook(webhook.id, data);
      } else {
        await createInboundWebhook(data);
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving inbound webhook:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {webhook ? 'Editar Webhook de Entrada' : 'Novo Webhook de Entrada'}
          </DialogTitle>
          <DialogDescription>
            Configure um endpoint para receber dados externos e criar negócios
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Webhook *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Formulário do Site"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pipeline de Destino *</Label>
              <Select value={pipelineId} onValueChange={setPipelineId}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Fase Inicial</Label>
              <Select value={phaseId} onValueChange={setPhaseId} disabled={!selectedPipeline}>
                <SelectTrigger>
                  <SelectValue placeholder="Primeira fase" />
                </SelectTrigger>
                <SelectContent>
                  {selectedPipeline?.phases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Field Mappings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Mapeamento de Campos</Label>
                <p className="text-xs text-muted-foreground">
                  Mapeie os campos do payload recebido para os campos do negócio
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleAddMapping}>
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              {fieldMappings.map((mapping) => (
                <div key={mapping.id} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                  
                  <Input
                    placeholder="Campo no payload (ex: customer.name)"
                    value={mapping.source}
                    onChange={(e) => handleMappingChange(mapping.id, 'source', e.target.value)}
                    className="flex-1"
                  />
                  
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  
                  <Select 
                    value={mapping.target} 
                    onValueChange={(v) => handleMappingChange(mapping.id, 'target', v)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Campo CRM" />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_FIELDS.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={mapping.transform || ''} 
                    onValueChange={(v) => handleMappingChange(mapping.id, 'transform', v)}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Transformar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma</SelectItem>
                      {FIELD_TRANSFORMS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMapping(mapping.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Dica:</strong> Use notação de ponto para campos aninhados. 
                Ex: <code className="bg-muted px-1 rounded">customer.contact.email</code>
              </p>
            </div>
          </div>

          <Separator />

          {/* Default Values */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tags">Tags Padrão</Label>
              <Input
                id="tags"
                value={defaultTags}
                onChange={(e) => setDefaultTags(e.target.value)}
                placeholder="Separadas por vírgula"
              />
            </div>

            <div className="space-y-2">
              <Label>Temperatura Padrão</Label>
              <Select value={defaultTemperature} onValueChange={(v) => setDefaultTemperature(v as 'cold' | 'warm' | 'hot')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold">❄️ Frio</SelectItem>
                  <SelectItem value="warm">🌡️ Morno</SelectItem>
                  <SelectItem value="hot">🔥 Quente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Security */}
          <div className="space-y-4">
            <Label className="text-base">Segurança</Label>
            
            <div className="space-y-2">
              <Label htmlFor="hmac">Chave HMAC (opcional)</Label>
              <Input
                id="hmac"
                value={hmacSecret}
                onChange={(e) => setHmacSecret(e.target.value)}
                placeholder="Se definida, valida assinatura do header X-Webhook-Signature"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ipList">IP Whitelist (opcional)</Label>
              <Input
                id="ipList"
                value={ipWhitelist}
                onChange={(e) => setIpWhitelist(e.target.value)}
                placeholder="IPs permitidos, separados por vírgula"
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Rate Limit:</strong> Máximo de 100 requisições por minuto por webhook
              </p>
            </div>
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
            disabled={saving || !name || !pipelineId}
          >
            {saving ? 'Salvando...' : webhook ? 'Salvar Alterações' : 'Criar Webhook'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
