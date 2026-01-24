import { useState } from 'react';
import { useCRMStore } from '@/store/crmStore';
import { generateTrackingScript } from '@/lib/tracking';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Settings, 
  Copy, 
  Check, 
  Link, 
  Code, 
  Eye,
  GitBranch
} from 'lucide-react';

export default function SettingsPage() {
  const { pipelines, captureSettings, toggleCaptureSettings } = useCRMStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPipelineId, setPreviewPipelineId] = useState<string | null>(null);
  const [showScript, setShowScript] = useState(false);

  const baseUrl = window.location.origin;

  const getCaptureUrl = (pipelineId: string) => {
    return `${baseUrl}/captura/${pipelineId}`;
  };

  const isEnabled = (pipelineId: string) => {
    const settings = captureSettings.find((s) => s.pipelineId === pipelineId);
    return settings?.enabled ?? true; // Default to enabled
  };

  const handleCopyUrl = async (pipelineId: string) => {
    const url = getCaptureUrl(pipelineId);
    await navigator.clipboard.writeText(url);
    setCopiedId(pipelineId);
    toast({ title: 'URL copiada', description: 'Link do formulário copiado para a área de transferência.' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyScript = async () => {
    const script = generateTrackingScript(baseUrl);
    await navigator.clipboard.writeText(script);
    toast({ title: 'Script copiado', description: 'Código de rastreamento copiado para a área de transferência.' });
  };

  const handleToggle = (pipelineId: string, enabled: boolean) => {
    toggleCaptureSettings(pipelineId, enabled);
    toast({
      title: enabled ? 'Captura ativada' : 'Captura desativada',
      description: enabled 
        ? 'O formulário público agora está disponível.' 
        : 'O formulário público foi desativado.',
    });
  };

  const openPreview = (pipelineId: string) => {
    setPreviewPipelineId(pipelineId);
    setShowPreview(true);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Configurações
        </h1>
        <p className="text-muted-foreground">Gerencie os formulários de captura de leads</p>
      </div>

      {/* Tracking Script Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Script de Rastreamento UTM
          </CardTitle>
          <CardDescription>
            Adicione este script ao seu site para capturar automaticamente parâmetros UTM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowScript(true)}>
              <Eye className="w-4 h-4 mr-2" />
              Ver Script
            </Button>
            <Button variant="outline" onClick={handleCopyScript}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar Script
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pipelines List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="w-5 h-5 text-primary" />
            Formulários de Captura por Pipeline
          </CardTitle>
          <CardDescription>
            Configure quais pipelines podem receber leads via formulário público
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pipelines.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title="Nenhum pipeline"
              description="Crie um pipeline para configurar formulários de captura"
              className="border-0"
            />
          ) : (
            <div className="space-y-4">
              {pipelines.map((pipeline) => (
                <div
                  key={pipeline.id}
                  className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground">{pipeline.name}</h4>
                      <Badge variant={isEnabled(pipeline.id) ? 'default' : 'secondary'}>
                        {isEnabled(pipeline.id) ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate max-w-md">
                      {getCaptureUrl(pipeline.id)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isEnabled(pipeline.id)}
                        onCheckedChange={(checked) => handleToggle(pipeline.id, checked)}
                      />
                      <Label className="text-sm">Ativo</Label>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPreview(pipeline.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyUrl(pipeline.id)}
                    >
                      {copiedId === pipeline.id ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Script Preview Dialog */}
      <Dialog open={showScript} onOpenChange={setShowScript}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Script de Rastreamento UTM</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cole este script no &lt;head&gt; do seu site para capturar automaticamente os parâmetros UTM
              quando visitantes chegarem através de links de campanhas.
            </p>
            <Textarea
              value={generateTrackingScript(baseUrl)}
              readOnly
              rows={12}
              className="font-mono text-xs"
            />
            <Button onClick={handleCopyScript} className="w-full">
              <Copy className="w-4 h-4 mr-2" />
              Copiar Script
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Prévia do Formulário</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden">
            <iframe
              src={previewPipelineId ? getCaptureUrl(previewPipelineId) : ''}
              className="w-full h-[500px]"
              title="Form Preview"
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            URL: {previewPipelineId ? getCaptureUrl(previewPipelineId) : ''}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
