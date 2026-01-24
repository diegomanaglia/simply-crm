import { useState, useMemo } from 'react';
import { useCRMStore } from '@/store/crmStore';
import { 
  BarChart3, TrendingUp, DollarSign, Target, Calendar, 
  Clock, Filter, XCircle, Trophy, Users, Flame, Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RechartPie, Pie, Cell, Legend 
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/empty-state';
import { Deal, Temperature } from '@/types/crm';
import { exportDealsToCSV } from '@/lib/csv-export';
import { toast } from '@/hooks/use-toast';

type PeriodFilter = 'week' | 'month' | '3months' | 'all';

const temperatureConfig: Record<Temperature, { label: string; className: string }> = {
  cold: { label: 'Frio', className: 'text-info' },
  warm: { label: 'Morno', className: 'text-warning' },
  hot: { label: 'Quente', className: 'text-destructive' },
};

export default function ReportsPage() {
  const { pipelines } = useCRMStore();
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('month');
  const [pipelineFilter, setPipelineFilter] = useState<string>('__all__');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate date range based on period filter
  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    
    switch (periodFilter) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'all':
        start.setFullYear(2000);
        break;
    }
    
    return { start, end: now };
  };

  // Filter deals by period and pipeline
  const filteredDeals = useMemo(() => {
    const { start, end } = getDateRange();
    
    let allDeals: (Deal & { pipelineName: string; phaseName: string; phaseType?: string })[] = [];
    
    pipelines.forEach((pipeline) => {
      if (pipelineFilter !== '__all__' && pipeline.id !== pipelineFilter) return;
      
      pipeline.deals.forEach((deal) => {
        const dealDate = new Date(deal.createdAt);
        if (dealDate >= start && dealDate <= end) {
          const phase = pipeline.phases.find((p) => p.id === deal.phaseId);
          allDeals.push({
            ...deal,
            pipelineName: pipeline.name,
            phaseName: phase?.name || 'Desconhecida',
            phaseType: phase?.type,
          });
        }
      });
    });
    
    return allDeals;
  }, [pipelines, periodFilter, pipelineFilter]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalLeads = filteredDeals.length;
    const lostDeals = filteredDeals.filter((d) => d.phaseType === 'lost');
    const wonDeals = filteredDeals.filter((d) => d.phaseType === 'won');
    const activeDeals = filteredDeals.filter((d) => d.phaseType !== 'lost' && d.phaseType !== 'won');
    
    const totalValue = filteredDeals.reduce((sum, d) => sum + d.value, 0);
    const lostValue = lostDeals.reduce((sum, d) => sum + d.value, 0);
    const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const avgTicket = wonDeals.length > 0 ? wonValue / wonDeals.length : 0;
    
    // Phase distribution
    const phaseDistribution: Record<string, number> = {};
    filteredDeals.forEach((deal) => {
      phaseDistribution[deal.phaseName] = (phaseDistribution[deal.phaseName] || 0) + 1;
    });
    
    // Temperature distribution
    const temperatureDistribution = {
      cold: filteredDeals.filter((d) => d.temperature === 'cold').length,
      warm: filteredDeals.filter((d) => d.temperature === 'warm').length,
      hot: filteredDeals.filter((d) => d.temperature === 'hot').length,
    };
    
    return {
      totalLeads,
      lostDeals: lostDeals.length,
      wonDeals: wonDeals.length,
      activeDeals: activeDeals.length,
      totalValue,
      lostValue,
      wonValue,
      avgTicket,
      phaseDistribution,
      temperatureDistribution,
      conversionRate: totalLeads > 0 ? (wonDeals.length / totalLeads) * 100 : 0,
    };
  }, [filteredDeals]);

  // Chart data
  const funnelData = useMemo(() => {
    return [
      { name: 'Entrada', value: metrics.activeDeals + metrics.wonDeals + metrics.lostDeals, fill: '#6366f1' },
      { name: 'Em Progresso', value: metrics.activeDeals, fill: '#f59e0b' },
      { name: 'Ganhos', value: metrics.wonDeals, fill: '#22c55e' },
      { name: 'Perdidos', value: metrics.lostDeals, fill: '#ef4444' },
    ];
  }, [metrics]);

  const temperatureData = [
    { name: 'Frio', value: metrics.temperatureDistribution.cold, color: '#0ea5e9' },
    { name: 'Morno', value: metrics.temperatureDistribution.warm, color: '#f59e0b' },
    { name: 'Quente', value: metrics.temperatureDistribution.hot, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatFullCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Filter table data
  const tableDeals = useMemo(() => {
    if (!searchQuery) return filteredDeals;
    const query = searchQuery.toLowerCase();
    return filteredDeals.filter(
      (d) =>
        d.title.toLowerCase().includes(query) ||
        d.contactName.toLowerCase().includes(query)
    );
  }, [filteredDeals, searchQuery]);

  const periodLabels: Record<PeriodFilter, string> = {
    week: 'Última semana',
    month: 'Último mês',
    '3months': 'Últimos 3 meses',
    all: 'Todo o período',
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Análise detalhada do seu pipeline</p>
        </div>
        
        {/* Export Button */}
        <Button
          variant="outline"
          onClick={() => {
            exportDealsToCSV(tableDeals, 'relatorio-crm');
            toast({ title: 'Relatório exportado', description: 'O arquivo CSV foi baixado.' });
          }}
          disabled={tableDeals.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os Pipelines</SelectItem>
              {pipelines.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Leads no Período</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{metrics.totalLeads}</p>
            <p className="text-xs text-muted-foreground">{periodLabels[periodFilter]}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-info/10 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-info" />
              </div>
              <span className="text-sm text-muted-foreground">Em Andamento</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{metrics.activeDeals}</p>
            <p className="text-xs text-muted-foreground">Negociações ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{metrics.conversionRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Ganhos / Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-success/10 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">Valor Total</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(metrics.totalValue)}</p>
            <p className="text-xs text-muted-foreground">Em negociação</p>
          </CardContent>
        </Card>
      </div>

      {/* Won and Lost Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Won Card */}
        <Card className="border-success/30 bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-success">
              <Trophy className="w-5 h-5" />
              Negócios Ganhos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-success/10 rounded-lg">
                <p className="text-3xl font-bold text-success">{metrics.wonDeals}</p>
                <p className="text-xs text-muted-foreground">Total Ganhos</p>
              </div>
              <div className="text-center p-3 bg-success/10 rounded-lg">
                <p className="text-xl font-bold text-success">{formatCurrency(metrics.avgTicket)}</p>
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
              </div>
              <div className="text-center p-3 bg-success/10 rounded-lg">
                <p className="text-xl font-bold text-success">{formatCurrency(metrics.wonValue)}</p>
                <p className="text-xs text-muted-foreground">Valor Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lost Card */}
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" />
              Negócios Perdidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-destructive/10 rounded-lg">
                <p className="text-3xl font-bold text-destructive">{metrics.lostDeals}</p>
                <p className="text-xs text-muted-foreground">Total Perdidos</p>
              </div>
              <div className="text-center p-3 bg-destructive/10 rounded-lg">
                <p className="text-xl font-bold text-destructive">
                  {metrics.totalLeads > 0 ? ((metrics.lostDeals / metrics.totalLeads) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Taxa de Perda</p>
              </div>
              <div className="text-center p-3 bg-destructive/10 rounded-lg">
                <p className="text-xl font-bold text-destructive">{formatCurrency(metrics.lostValue)}</p>
                <p className="text-xs text-muted-foreground">Valor Perdido</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Funil de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.totalLeads === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Sem dados no período selecionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip
                    formatter={(value: number) => [value, 'Negócios']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Temperature Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              Distribuição por Temperatura
            </CardTitle>
          </CardHeader>
          <CardContent>
            {temperatureData.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Sem dados no período selecionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <RechartPie>
                  <Pie
                    data={temperatureData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
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
                  <Legend
                    formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
                  />
                </RechartPie>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Phase Distribution */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Distribuição por Fase
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(metrics.phaseDistribution).length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Sem dados no período selecionado
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(metrics.phaseDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => {
                  const maxCount = Math.max(...Object.values(metrics.phaseDistribution), 1);
                  const percentage = (count / maxCount) * 100;
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground">{name}</span>
                        <span className="text-sm font-medium text-foreground">{count} negócios</span>
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
        </CardContent>
      </Card>

      {/* Deals Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Lista de Negócios</CardTitle>
            <Input
              placeholder="Buscar negócios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          {tableDeals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum negócio encontrado no período
            </p>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Negócio</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Pipeline</TableHead>
                    <TableHead>Fase</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Temp.</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableDeals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium">{deal.title}</TableCell>
                      <TableCell>{deal.contactName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{deal.pipelineName}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={deal.phaseType === 'won' ? 'default' : deal.phaseType === 'lost' ? 'destructive' : 'secondary'}
                          className={deal.phaseType === 'won' ? 'bg-success text-success-foreground' : ''}
                        >
                          {deal.phaseName}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{formatFullCurrency(deal.value)}</TableCell>
                      <TableCell>
                        <span className={temperatureConfig[deal.temperature].className}>
                          {temperatureConfig[deal.temperature].label}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(deal.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
