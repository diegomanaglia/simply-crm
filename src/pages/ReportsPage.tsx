import { useCRMStore } from '@/store/crmStore';
import { BarChart3, TrendingUp, DollarSign, Target, PieChart } from 'lucide-react';

export default function ReportsPage() {
  const { pipelines } = useCRMStore();

  const totalDeals = pipelines.reduce((sum, p) => sum + p.deals.length, 0);
  const totalValue = pipelines.reduce(
    (sum, p) => sum + p.deals.reduce((s, d) => s + d.value, 0),
    0
  );

  const temperatureStats = {
    cold: pipelines.reduce((sum, p) => sum + p.deals.filter((d) => d.temperature === 'cold').length, 0),
    warm: pipelines.reduce((sum, p) => sum + p.deals.filter((d) => d.temperature === 'warm').length, 0),
    hot: pipelines.reduce((sum, p) => sum + p.deals.filter((d) => d.temperature === 'hot').length, 0),
  };

  const phaseStats = pipelines.reduce((acc, p) => {
    p.phases.forEach((phase) => {
      const count = p.deals.filter((d) => d.phaseId === phase.id).length;
      if (!acc[phase.name]) {
        acc[phase.name] = 0;
      }
      acc[phase.name] += count;
    });
    return acc;
  }, {} as Record<string, number>);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const avgDealValue = totalDeals > 0 ? totalValue / totalDeals : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground">Análise detalhada do seu pipeline</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total de Negócios</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalDeals}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-success/10 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Valor Total</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totalValue)}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-info/10 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-info" />
            </div>
            <span className="text-sm text-muted-foreground">Ticket Médio</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(avgDealValue)}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-warning/10 p-2 rounded-lg">
              <BarChart3 className="w-5 h-5 text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Pipelines</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{pipelines.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Distribuição por Temperatura</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Frio</span>
                <span className="text-sm font-medium text-info">{temperatureStats.cold}</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-info rounded-full transition-all duration-500"
                  style={{
                    width: `${totalDeals > 0 ? (temperatureStats.cold / totalDeals) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Morno</span>
                <span className="text-sm font-medium text-warning">{temperatureStats.warm}</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-warning rounded-full transition-all duration-500"
                  style={{
                    width: `${totalDeals > 0 ? (temperatureStats.warm / totalDeals) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Quente</span>
                <span className="text-sm font-medium text-destructive">{temperatureStats.hot}</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-destructive rounded-full transition-all duration-500"
                  style={{
                    width: `${totalDeals > 0 ? (temperatureStats.hot / totalDeals) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Phase Distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Negócios por Fase</h3>
          </div>
          {Object.keys(phaseStats).length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Adicione negócios para ver a distribuição por fase.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(phaseStats)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([name, count]) => {
                  const maxCount = Math.max(...Object.values(phaseStats), 1);
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground truncate max-w-[60%]">
                          {name}
                        </span>
                        <span className="text-sm font-medium text-foreground">{count}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
