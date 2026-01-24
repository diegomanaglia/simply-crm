import { ReactNode } from 'react';
import { Briefcase, CheckCircle, TrendingUp, Users } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const benefits = [
    { icon: TrendingUp, text: 'Aumente suas vendas em até 40%' },
    { icon: Users, text: 'Gerencie leads de forma inteligente' },
    { icon: CheckCircle, text: 'Integração com Google Ads e Facebook' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-2/5 flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12 bg-background">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-2xl text-foreground">Simply CRM</span>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>

          {/* Form content */}
          {children}
        </div>
      </div>

      {/* Right side - Hero (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-12 items-center justify-center relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-lg text-white">
          <h2 className="text-4xl font-bold mb-6">
            Transforme leads em clientes fiéis
          </h2>
          <p className="text-lg text-white/80 mb-8">
            O CRM mais simples e poderoso para pequenas e médias empresas. 
            Organize seus negócios, automatize processos e feche mais vendas.
          </p>

          {/* Benefits */}
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <benefit.icon className="w-5 h-5" />
                </div>
                <span className="text-lg">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-white/30 border-2 border-white flex items-center justify-center text-sm font-medium"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <p className="font-medium">+2.500 empresas</p>
                <p className="text-sm text-white/70">já usam o Simply CRM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
