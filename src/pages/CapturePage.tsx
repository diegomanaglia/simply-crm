import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRMStore } from '@/store/crmStore';
import { 
  collectLeadOrigin, 
  captureUTMParams, 
  generateSourceTags 
} from '@/lib/tracking';
import { 
  validateEmail, 
  validatePhone, 
  formatPhone 
} from '@/lib/validators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Briefcase, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

export default function CapturePage() {
  const { pipelineId } = useParams<{ pipelineId: string }>();
  const navigate = useNavigate();
  const { pipelines, addDealFromCapture, getCaptureSettings } = useCRMStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const pipeline = pipelines.find((p) => p.id === pipelineId);
  const captureSettings = pipelineId ? getCaptureSettings(pipelineId) : undefined;

  // Capture UTMs on page load
  useEffect(() => {
    captureUTMParams();
  }, []);

  useEffect(() => {
    if (!pipeline || (captureSettings && !captureSettings.enabled)) {
      setNotFound(true);
    }
  }, [pipeline, captureSettings]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else {
      const emailResult = validateEmail(email);
      if (!emailResult.valid) {
        newErrors.email = emailResult.message;
      }
    }

    if (phone) {
      const phoneResult = validatePhone(phone);
      if (!phoneResult.valid) {
        newErrors.phone = phoneResult.message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !pipelineId) return;

    setIsSubmitting(true);

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 500));

    const origin = collectLeadOrigin();
    const autoTags = generateSourceTags(origin);

    addDealFromCapture(pipelineId, {
      title: name.trim(),
      contactName: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      document: '',
      value: 0,
      source: origin.utmParams.utm_source || 'Formulário',
      temperature: 'cold',
      tags: autoTags,
      origin,
      notes: company ? `Empresa: ${company}` : undefined,
    });

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Formulário não disponível</h2>
            <p className="text-muted-foreground">
              Este formulário de captura não está disponível ou foi desativado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full animate-scale-in">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Obrigado pelo contato!</h2>
            <p className="text-muted-foreground">
              Recebemos suas informações e entraremos em contato em breve.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full animate-fade-in">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Entre em Contato</CardTitle>
          <CardDescription>
            Preencha o formulário abaixo e entraremos em contato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className={cn(errors.name && 'border-destructive')}
              />
              {errors.name && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className={cn(errors.email && 'border-destructive')}
              />
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
                className={cn(errors.phone && 'border-destructive')}
              />
              {errors.phone && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Empresa (opcional)</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Nome da empresa"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
