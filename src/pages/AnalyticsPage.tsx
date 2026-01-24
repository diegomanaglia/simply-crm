import { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Settings,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { useAnalyticsData } from '@/hooks/use-analytics-data';
import { useAnalyticsSettings } from '@/hooks/use-analytics-settings';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<number>(30);
  const { summary, loading, refetch } = useAnalyticsData(dateRange);
  const { settings } = useAnalyticsSettings();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" text="Carregando analytics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Métricas e análise de funil do seu CRM
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select 
            value={dateRange.toString()} 
            onValueChange={(v) => setDateRange(parseInt(v))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={refetch}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Link to="/settings">
            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* GA4 Status Banner */}
      {!settings?.tracking_enabled && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Google Analytics não configurado</p>
                <p className="text-sm text-muted-foreground">
                  Configure o GA4 para rastrear visitas e eventos em páginas públicas
                </p>
              </div>
            </div>
            <Link to="/settings">
              <Button size="sm">Configurar</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads Capturados
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Últimos {dateRange} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
            <Target className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {formatPercent(summary.conversionRate)}
              {summary.conversionRate > 0 && (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lead → Ganho
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.totalDealsWon} negócios ganhos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Médio
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.avgDealValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Por negócio ganho
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="funnel">Funil</TabsTrigger>
          <TabsTrigger value="sources">Origens</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Leads Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Leads ao Longo do Tempo</CardTitle>
                <CardDescription>Leads capturados e negócios ganhos/perdidos</CardDescription>
              </CardHeader>
              <CardContent>
                {summary.eventsByDay.length === 0 ? (
                  <EmptyState
                    icon={BarChart3}
                    title="Sem dados"
                    description="Os eventos aparecerão aqui conforme forem registrados"
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={summary.eventsByDay}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(v) => format(parseISO(v), 'dd/MM')}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        labelFormatter={(v) => format(parseISO(v as string), "d 'de' MMMM", { locale: ptBR })}
                        formatter={(value, name) => {
                          const labels: Record<string, string> = {
                            leads: 'Leads',
                            won: 'Ganhos',
                            lost: 'Perdidos',
                          };
                          return [value, labels[name as string] || name];
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="leads" 
                        stackId="1"
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.3}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="won" 
                        stackId="2"
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.3}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="lost" 
                        stackId="3"
                        stroke="#ef4444" 
                        fill="#ef4444" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Win/Loss Ratio */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resultado de Negócios</CardTitle>
                <CardDescription>Ganhos vs Perdidos no período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-500/10 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-green-600">{summary.totalDealsWon}</p>
                    <p className="text-sm text-muted-foreground">Ganhos</p>
                  </div>
                  <div className="text-center p-4 bg-red-500/10 rounded-lg">
                    <TrendingDown className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-red-600">{summary.totalDealsLost}</p>
                    <p className="text-sm text-muted-foreground">Perdidos</p>
                  </div>
                </div>
                {(summary.totalDealsWon + summary.totalDealsLost) > 0 && (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Ganhos', value: summary.totalDealsWon },
                          { name: 'Perdidos', value: summary.totalDealsLost },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Funnel Tab */}
        <TabsContent value="funnel">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Funil de Conversão</CardTitle>
              <CardDescription>Visita → Lead → Negócio → Ganho</CardDescription>
            </CardHeader>
            <CardContent>
              {summary.funnelData.every(f => f.count === 0) ? (
                <EmptyState
                  icon={Target}
                  title="Sem dados de funil"
                  description="Os dados do funil aparecerão conforme leads forem capturados"
                />
              ) : (
                <div className="space-y-4">
                  {summary.funnelData.map((stage, index) => (
                    <div key={stage.stage} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{stage.stage}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{stage.count}</Badge>
                          <span className="text-sm text-muted-foreground">
                            ({formatPercent(stage.percentage)})
                          </span>
                        </div>
                      </div>
                      <div className="h-8 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${stage.percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* By Source */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Leads por Fonte</CardTitle>
                <CardDescription>Origem do tráfego (utm_source)</CardDescription>
              </CardHeader>
              <CardContent>
                {summary.leadsBySource.length === 0 ? (
                  <EmptyState
                    icon={BarChart3}
                    title="Sem dados de origem"
                    description="Origens serão rastreadas via UTMs"
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={summary.leadsBySource.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis dataKey="source" type="category" width={100} className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* By Campaign */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Leads por Campanha</CardTitle>
                <CardDescription>Campanhas de marketing (utm_campaign)</CardDescription>
              </CardHeader>
              <CardContent>
                {summary.leadsByCampaign.length === 0 ? (
                  <EmptyState
                    icon={Target}
                    title="Sem dados de campanha"
                    description="Campanhas serão rastreadas via UTMs"
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={summary.leadsByCampaign.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" />
                      <YAxis dataKey="campaign" type="category" width={100} className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
