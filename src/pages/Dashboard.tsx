import { useCRMStore } from '@/store/crmStore';
import { TrendingUp, Users, DollarSign, Target, Trophy, Flame, Globe } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Deal } from '@/types/crm';
import { useMemo } from 'react';

export default function Dashboard() {
  const { pipelines, archivedDeals } = useCRMStore();

  // Calculate KPIs
  const allDeals = pipelines.flatMap((p) => p.deals);
  const totalDeals = allDeals.length;
  
  // Active deals (not in won/lost phases)
  const activeDeals = pipelines.reduce((sum, p) => {
    return sum + p.deals.filter((d) => {
      const phase = p.phases.find((ph) => ph.id === d.phaseId);
      return phase?.type !== 'won' && phase?.type !== 'lost';
    }).length;
  }, 0);

  // Total value in negotiation (not won/lost)
  const valueInNegotiation = pipelines.reduce((sum, p) => {
    return sum + p.deals
      .filter((d) => {
        const phase = p.phases.find((ph) => ph.id === d.phaseId);
        return phase?.type !== 'won' && phase?.type !== 'lost';
      })
      .reduce((s, d) => s + d.value, 0);
  }, 0);

  // Won deals
  const wonDeals = pipelines.reduce((sum, p) => {
    return sum + p.deals.filter((d) => {
      const phase = p.phases.find((ph) => ph.id === d.phaseId);
      return phase?.type === 'won';
    }).length;
  }, 0);

  // Lost deals
  const lostDeals = pipelines.reduce((sum, p) => {
    return sum + p.deals.filter((d) => {
      const phase = p.phases.find((ph) => ph.id === d.phaseId);
      return phase?.type === 'lost';
    }).length;
  }, 0);

  // Conversion rate
  const completedDeals = wonDeals + lostDeals;
  const conversionRate = completedDeals > 0 ? (wonDeals / completedDeals) * 100 : 0;

  // Won this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const wonThisMonth = pipelines.reduce((sum, p) => {
    return sum + p.deals.filter((d) => {
      const phase = p.phases.find((ph) => ph.id === d.phaseId);
      const dealDate = new Date(d.createdAt);
      return phase?.type === 'won' && 
             dealDate.getMonth() === currentMonth && 
             dealDate.getFullYear() === currentYear;
    }).length;
  }, 0);

  // Temperature distribution for pie chart
  const temperatureData = [
    { name: 'Frio', value: allDeals.filter((d) => d.temperature === 'cold').length, color: '#0ea5e9' },
    { name: 'Morno', value: allDeals.filter((d) => d.temperature === 'warm').length, color: '#f59e0b' },
    { name: 'Quente', value: allDeals.filter((d) => d.temperature === 'hot').length, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  // Source distribution (Leads by Source) - this month
  const sourceData = useMemo(() => {
    const sourceMap = new Map<string, number>();
    
    allDeals.forEach((deal) => {
      const source = deal.origin?.utmParams?.utm_source || deal.source || 'Direto';
      const sourceName = source.charAt(0).toUpperCase() + source.slice(1).toLowerCase();
      sourceMap.set(sourceName, (sourceMap.get(sourceName) || 0) + 1);
    });
    
    return Array.from(sourceMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [allDeals]);

  // Last 5 deals created
  const recentDeals = pipelines
    .flatMap((p) =>
      p.deals.map((d) => ({
        ...d,
        pipelineName: p.name,
        phaseName: p.phases.find((ph) => ph.id === d.phaseId)?.name || '',
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const stats = [
    {
      title: 'Negócios Ativos',
      value: activeDeals,
      icon: Users,
      subtitle: `${totalDeals} total`,
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Em Negociação',
      value: formatCurrency(valueInNegotiation),
      icon: DollarSign,
      subtitle: 'Valor total',
      bgColor: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      title: 'Taxa de Conversão',
      value: `${conversionRate.toFixed(1)}%`,
      icon: Target,
      subtitle: `${wonDeals} ganhos de ${completedDeals}`,
      bgColor: 'bg-info/10',
      iconColor: 'text-info',
    },
    {
      title: 'Ganhos este Mês',
      value: wonThisMonth,
      icon: Trophy,
      subtitle: new Date().toLocaleDateString('pt-BR', { month: 'long' }),
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
            <div className="flex items-start justify-between mb-3">
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.title}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart - Temperature Distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Por Temperatura</h3>
          </div>
          {temperatureData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              Adicione negócios para ver o gráfico
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={temperatureData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {temperatureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} negócios`, 'Quantidade']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar Chart - Leads by Source */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Leads por Fonte</h3>
          </div>
          {sourceData.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              Nenhum lead com fonte registrada
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [value, 'Leads']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Deals */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Últimos Negócios</h3>
          </div>
          {recentDeals.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
              Nenhum negócio criado ainda
            </div>
          ) : (
            <div className="space-y-3">
              {recentDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
                    {getInitials(deal.contactName || deal.title)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{deal.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {deal.pipelineName}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-primary text-sm">{formatCurrency(deal.value)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pipeline Overview */}
      <div className="mt-6 bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Visão Geral dos Pipelines</h3>
        {pipelines.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhum pipeline criado ainda. Vá para a seção Pipelines para criar o primeiro.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pipelines.map((pipeline) => {
              const pipelineValue = pipeline.deals.reduce((s, d) => s + d.value, 0);
              const pipelineWon = pipeline.deals.filter(
                (d) => pipeline.phases.find((p) => p.id === d.phaseId)?.type === 'won'
              ).length;

              return (
                <div key={pipeline.id} className="p-4 bg-secondary/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-foreground">{pipeline.name}</h4>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {pipeline.deals.length} negócios
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Valor total</span>
                    <span className="font-medium text-foreground">{formatCurrency(pipelineValue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Ganhos</span>
                    <span className="font-medium text-success">{pipelineWon}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
