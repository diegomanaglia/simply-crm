import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Check, 
  Copy, 
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAnalyticsSettings } from '@/hooks/use-analytics-settings';
import { generateGA4Script } from '@/lib/analytics';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export function GoogleAnalyticsCard() {
  const { settings, loading, saving, saveMeasurementId, toggleTracking } = useAnalyticsSettings();
  const [measurementId, setMeasurementId] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings?.ga4_measurement_id) {
      setMeasurementId(settings.ga4_measurement_id);
    }
  }, [settings?.ga4_measurement_id]);

  const handleSave = async () => {
    // Validate measurement ID format
    if (measurementId && !measurementId.match(/^G-[A-Z0-9]+$/)) {
      toast.error('ID de medição inválido. Deve começar com "G-"');
      return;
    }
    
    await saveMeasurementId(measurementId);
    setHasChanges(false);
  };

  const handleCopyScript = () => {
    if (!measurementId) return;
    navigator.clipboard.writeText(generateGA4Script(measurementId));
    toast.success('Script copiado para a área de transferência');
  };

  const handleInputChange = (value: string) => {
    setMeasurementId(value.toUpperCase());
    setHasChanges(value !== (settings?.ga4_measurement_id || ''));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <LoadingSpinner text="Carregando configurações..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#E37400] rounded-xl flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Google Analytics 4</CardTitle>
            <CardDescription>
              Rastreie visitas e eventos nos formulários públicos
            </CardDescription>
          </div>
        </div>
        
        {settings?.tracking_enabled && settings?.ga4_measurement_id ? (
          <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
            <Check className="w-3 h-3 mr-1" />
            Ativo
          </Badge>
        ) : (
          <Badge variant="secondary">
            Inativo
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Measurement ID Input */}
        <div className="space-y-2">
          <Label htmlFor="measurementId">ID de Medição (Measurement ID)</Label>
          <div className="flex gap-2">
            <Input
              id="measurementId"
              value={measurementId}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="font-mono"
            />
            <Button 
              onClick={handleSave} 
              disabled={saving || !hasChanges}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Encontre seu ID de medição no painel do{' '}
            <a 
              href="https://analytics.google.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Google Analytics
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>

        {settings?.ga4_measurement_id && (
          <>
            <Separator />

            {/* Toggle Tracking */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Ativar Tracking</Label>
                <p className="text-sm text-muted-foreground">
                  Envia eventos para o Google Analytics
                </p>
              </div>
              <Switch
                checked={settings.tracking_enabled}
                onCheckedChange={toggleTracking}
              />
            </div>

            <Separator />

            {/* Tracking Script */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Script de Tracking</Label>
                <Button variant="outline" size="sm" onClick={handleCopyScript}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Script
                </Button>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <pre className="text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                  {generateGA4Script(settings.ga4_measurement_id)}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground">
                Este script já está incluído automaticamente nas páginas de captura públicas
              </p>
            </div>

            <Separator />

            {/* Events Info */}
            <div className="space-y-3">
              <Label>Eventos Rastreados</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: 'lead_captured', desc: 'Formulário enviado' },
                  { name: 'deal_created', desc: 'Negócio criado' },
                  { name: 'deal_won', desc: 'Negócio ganho' },
                  { name: 'deal_lost', desc: 'Negócio perdido' },
                  { name: 'deal_moved', desc: 'Negócio movido' },
                ].map((event) => (
                  <div 
                    key={event.name}
                    className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div>
                      <p className="text-xs font-mono">{event.name}</p>
                      <p className="text-[10px] text-muted-foreground">{event.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Help */}
        {!settings?.ga4_measurement_id && (
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Como configurar</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Acesse o Google Analytics e crie uma propriedade GA4</li>
                <li>Vá em Administrador → Fluxos de dados → Web</li>
                <li>Copie o ID de medição (formato G-XXXXXXXXXX)</li>
                <li>Cole no campo acima e salve</li>
              </ol>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
