import { useCRMStore } from '@/store/crmStore';
import { TrendingUp, Users, DollarSign, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Dashboard() {
  const { pipelines, archivedDeals } = useCRMStore();

  const totalDeals = pipelines.reduce((sum, p) => sum + p.deals.length, 0);
  const totalValue = pipelines.reduce(
    (sum, p) => sum + p.deals.reduce((s, d) => s + d.value, 0),
    0
  );
  const wonDeals = pipelines.reduce((sum, p) => {
    return sum + p.deals.filter((d) => {
      const phase = p.phases.find((ph) => ph.id === d.phaseId);
      return phase?.type === 'won';
    }).length;
  }, 0);
  const hotDeals = pipelines.reduce(
    (sum, p) => sum + p.deals.filter((d) => d.temperature === 'hot').length,
    0
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const stats = [
    {
      title: 'Total de Negócios',
      value: totalDeals,
      icon: Users,
      change: '+12%',
      positive: true,
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Valor Total',
      value: formatCurrency(totalValue),
      icon: DollarSign,
      change: '+8%',
      positive: true,
      bgColor: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      title: 'Negócios Ganhos',
      value: wonDeals,
      icon: Target,
      change: '+5%',
      positive: true,
      bgColor: 'bg-info/10',
      iconColor: 'text-info',
    },
    {
      title: 'Leads Quentes',
      value: hotDeals,
      icon: TrendingUp,
      change: '-2%',
      positive: false,
      bgColor: 'bg-warning/10',
      iconColor: 'text-warning',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu CRM</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-card border border-border rounded-xl p-5 hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-medium ${
                  stat.positive ? 'text-success' : 'text-destructive'
                }`}
              >
                {stat.positive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {stat.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Pipelines Ativos</h3>
          {pipelines.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhum pipeline criado ainda. Vá para a seção Pipelines para criar o primeiro.
            </p>
          ) : (
            <div className="space-y-3">
              {pipelines.slice(0, 5).map((pipeline) => {
                const pipelineValue = pipeline.deals.reduce((s, d) => s + d.value, 0);
                const maxValue = Math.max(
                  ...pipelines.map((p) => p.deals.reduce((s, d) => s + d.value, 0)),
                  1
                );
                const percentage = (pipelineValue / maxValue) * 100;

                return (
                  <div key={pipeline.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{pipeline.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(pipelineValue)}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Atividade Recente</h3>
          {totalDeals === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nenhuma atividade recente. Adicione negócios para ver as atualizações aqui.
            </p>
          ) : (
            <div className="space-y-3">
              {pipelines
                .flatMap((p) =>
                  p.deals.map((d) => ({
                    ...d,
                    pipelineName: p.name,
                    phaseName: p.phases.find((ph) => ph.id === d.phaseId)?.name,
                  }))
                )
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((deal) => (
                  <div
                    key={deal.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{deal.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {deal.pipelineName} • {deal.phaseName}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      {formatCurrency(deal.value)}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
