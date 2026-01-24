import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, Briefcase, Link2, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCRMStore } from '@/store/crmStore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: () => void;
  actionLabel?: string;
  skippable: boolean;
}

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const { updateProfile } = useAuth();
  const { addPipeline, pipelines } = useCRMStore();
  const navigate = useNavigate();

  const createDefaultPipeline = () => {
    // Check if default pipeline already exists
    const hasDefault = pipelines.some(p => p.name === 'Vendas');
    if (!hasDefault) {
      addPipeline('Vendas');
    }
    setCompletedSteps([...completedSteps, 0]);
  };

  const steps: OnboardingStep[] = [
    {
      id: 0,
      title: 'Bem-vindo ao Simply CRM!',
      description: 'Vamos configurar seu primeiro pipeline de vendas. É rápido e fácil.',
      icon: Sparkles,
      action: createDefaultPipeline,
      actionLabel: 'Criar pipeline "Vendas"',
      skippable: false,
    },
    {
      id: 1,
      title: 'Crie seu primeiro negócio',
      description: 'Adicione um negócio ao seu pipeline para começar a rastrear suas oportunidades.',
      icon: Briefcase,
      action: () => {
        setCompletedSteps([...completedSteps, 1]);
        navigate('/pipelines');
      },
      actionLabel: 'Ir para Pipelines',
      skippable: true,
    },
    {
      id: 2,
      title: 'Integre suas ferramentas',
      description: 'Conecte Google Ads, Facebook e outras ferramentas para capturar leads automaticamente.',
      icon: Link2,
      action: () => {
        setCompletedSteps([...completedSteps, 2]);
        navigate('/integrations');
      },
      actionLabel: 'Ver Integrações',
      skippable: true,
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isStepCompleted = completedSteps.includes(currentStep);

  const handleAction = () => {
    if (currentStepData.action) {
      currentStepData.action();
    }
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    await updateProfile({ onboarding_completed: true });
    onOpenChange(false);
  };

  const Icon = currentStepData.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  index === currentStep
                    ? 'bg-primary'
                    : index < currentStep || completedSteps.includes(index)
                    ? 'bg-primary/50'
                    : 'bg-muted'
                )}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-primary" />
          </div>

          <DialogTitle className="text-2xl">{currentStepData.title}</DialogTitle>
          <DialogDescription className="text-base">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-6">
          <Button onClick={handleAction} className="w-full" size="lg">
            {isStepCompleted ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Concluído
              </>
            ) : (
              <>
                {currentStepData.actionLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          {currentStepData.skippable && (
            <Button variant="ghost" onClick={handleSkip} className="w-full">
              {isLastStep ? 'Concluir' : 'Pular'}
            </Button>
          )}

          {isLastStep && !currentStepData.skippable && (
            <Button variant="ghost" onClick={completeOnboarding} className="w-full">
              Começar a usar
            </Button>
          )}
        </div>

        {/* Step count */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          Passo {currentStep + 1} de {steps.length}
        </p>
      </DialogContent>
    </Dialog>
  );
}
