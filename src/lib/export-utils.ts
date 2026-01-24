import * as XLSX from 'xlsx';
import { Deal, Pipeline, Phase, Temperature } from '@/types/crm';

export interface ExportDeal extends Deal {
  pipelineName?: string;
  phaseName?: string;
  status?: 'active' | 'archived';
}

export interface ExportFilters {
  phases?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  status?: 'all' | 'active' | 'archived';
  temperatures?: Temperature[];
  tags?: string[];
}

export interface ExportSummary {
  totalDeals: number;
  totalValue: number;
  averageValue: number;
  conversionRate: number;
  temperatureDistribution: { temperature: string; count: number; percentage: number }[];
  topSources: { source: string; count: number }[];
}

const temperatureLabels: Record<string, string> = {
  cold: 'Frio',
  warm: 'Morno',
  hot: 'Quente',
};

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR');
}

export function filterDeals(deals: ExportDeal[], filters: ExportFilters): ExportDeal[] {
  return deals.filter(deal => {
    // Filter by phases
    if (filters.phases && filters.phases.length > 0) {
      if (!filters.phases.includes(deal.phaseId)) return false;
    }

    // Filter by date range
    if (filters.dateFrom) {
      const dealDate = new Date(deal.createdAt);
      if (dealDate < filters.dateFrom) return false;
    }
    if (filters.dateTo) {
      const dealDate = new Date(deal.createdAt);
      const endDate = new Date(filters.dateTo);
      endDate.setHours(23, 59, 59, 999);
      if (dealDate > endDate) return false;
    }

    // Filter by status
    if (filters.status === 'active' && deal.archivedAt) return false;
    if (filters.status === 'archived' && !deal.archivedAt) return false;

    // Filter by temperature
    if (filters.temperatures && filters.temperatures.length > 0) {
      if (!filters.temperatures.includes(deal.temperature)) return false;
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      const dealTagNames = deal.tags.map(t => t.name.toLowerCase());
      const hasMatchingTag = filters.tags.some(tag => 
        dealTagNames.includes(tag.toLowerCase())
      );
      if (!hasMatchingTag) return false;
    }

    return true;
  });
}

export function calculateSummary(deals: ExportDeal[], allDeals: ExportDeal[]): ExportSummary {
  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const averageValue = totalDeals > 0 ? totalValue / totalDeals : 0;

  // Conversion rate (deals marked as won)
  const wonDeals = deals.filter(d => d.phaseName?.toLowerCase().includes('ganho')).length;
  const conversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;

  // Temperature distribution
  const tempCounts: Record<string, number> = { cold: 0, warm: 0, hot: 0 };
  deals.forEach(d => {
    if (tempCounts[d.temperature] !== undefined) {
      tempCounts[d.temperature]++;
    }
  });
  const temperatureDistribution = Object.entries(tempCounts).map(([temp, count]) => ({
    temperature: temperatureLabels[temp] || temp,
    count,
    percentage: totalDeals > 0 ? (count / totalDeals) * 100 : 0,
  }));

  // Top sources
  const sourceCounts: Record<string, number> = {};
  deals.forEach(d => {
    const source = d.source || d.origin?.utmParams?.utm_source || 'Direto';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  const topSources = Object.entries(sourceCounts)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalDeals,
    totalValue,
    averageValue,
    conversionRate,
    temperatureDistribution,
    topSources,
  };
}

export function exportToExcel(
  deals: ExportDeal[], 
  filename: string,
  summary?: ExportSummary
): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Deals
  const dealRows = deals.map(deal => ({
    'Nome do Negócio': deal.title,
    'Nome do Contato': deal.contactName || '',
    'Email': deal.email || '',
    'Telefone': deal.phone || '',
    'CPF/CNPJ': deal.document || '',
    'Valor (R$)': deal.value,
    'Pipeline': deal.pipelineName || '',
    'Fase Atual': deal.phaseName || '',
    'Tags': deal.tags.map(t => t.name).join(', '),
    'Temperatura': temperatureLabels[deal.temperature] || deal.temperature,
    'Fonte/Origem': deal.source || '',
    'UTM Source': deal.origin?.utmParams?.utm_source || '',
    'UTM Medium': deal.origin?.utmParams?.utm_medium || '',
    'UTM Campaign': deal.origin?.utmParams?.utm_campaign || '',
    'Data de Criação': formatDate(deal.createdAt),
    'Última Atualização': deal.activities?.length > 0 
      ? formatDateTime(deal.activities[deal.activities.length - 1].timestamp)
      : formatDate(deal.createdAt),
    'Status': deal.archivedAt ? 'Arquivado' : 'Ativo',
    'Empresa': deal.company || '',
    'Observações': deal.notes || '',
  }));

  const dealsSheet = XLSX.utils.json_to_sheet(dealRows);

  // Style headers (column widths)
  const colWidths = [
    { wch: 25 }, // Nome do Negócio
    { wch: 20 }, // Nome do Contato
    { wch: 25 }, // Email
    { wch: 15 }, // Telefone
    { wch: 18 }, // CPF/CNPJ
    { wch: 15 }, // Valor
    { wch: 15 }, // Pipeline
    { wch: 15 }, // Fase
    { wch: 20 }, // Tags
    { wch: 12 }, // Temperatura
    { wch: 15 }, // Fonte
    { wch: 15 }, // UTM Source
    { wch: 15 }, // UTM Medium
    { wch: 20 }, // UTM Campaign
    { wch: 15 }, // Data Criação
    { wch: 18 }, // Última Atualização
    { wch: 10 }, // Status
    { wch: 20 }, // Empresa
    { wch: 30 }, // Observações
  ];
  dealsSheet['!cols'] = colWidths;

  // Add autofilter
  if (dealRows.length > 0) {
    dealsSheet['!autofilter'] = { ref: `A1:S${dealRows.length + 1}` };
  }

  XLSX.utils.book_append_sheet(workbook, dealsSheet, 'Negócios');

  // Sheet 2: Summary
  if (summary) {
    const summaryData = [
      ['RESUMO DO RELATÓRIO'],
      [''],
      ['Métricas Gerais'],
      ['Total de Negócios', summary.totalDeals],
      ['Valor Total', formatCurrency(summary.totalValue)],
      ['Média por Negócio', formatCurrency(summary.averageValue)],
      ['Taxa de Conversão', `${summary.conversionRate.toFixed(1)}%`],
      [''],
      ['Distribuição por Temperatura'],
      ['Temperatura', 'Quantidade', 'Percentual'],
      ...summary.temperatureDistribution.map(t => [
        t.temperature,
        t.count,
        `${t.percentage.toFixed(1)}%`,
      ]),
      [''],
      ['Top 5 Fontes de Tráfego'],
      ['Fonte', 'Quantidade'],
      ...summary.topSources.map(s => [s.source, s.count]),
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');
  }

  // Download
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${filename}-${dateStr}.xlsx`);
}

export function exportToCSV(deals: ExportDeal[], filename: string): void {
  const headers = [
    'Nome do Negócio',
    'Nome do Contato',
    'Email',
    'Telefone',
    'CPF/CNPJ',
    'Valor',
    'Pipeline',
    'Fase Atual',
    'Tags',
    'Temperatura',
    'Fonte/Origem',
    'UTM Source',
    'UTM Medium',
    'UTM Campaign',
    'Data de Criação',
    'Status',
  ];

  const rows = deals.map(deal => [
    deal.title,
    deal.contactName || '',
    deal.email || '',
    deal.phone || '',
    deal.document || '',
    deal.value.toFixed(2).replace('.', ','),
    deal.pipelineName || '',
    deal.phaseName || '',
    deal.tags.map(t => t.name).join('; '),
    temperatureLabels[deal.temperature] || deal.temperature,
    deal.source || '',
    deal.origin?.utmParams?.utm_source || '',
    deal.origin?.utmParams?.utm_medium || '',
    deal.origin?.utmParams?.utm_campaign || '',
    formatDate(deal.createdAt),
    deal.archivedAt ? 'Arquivado' : 'Ativo',
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map(row =>
      row.map(cell => {
        const cellStr = String(cell);
        if (cellStr.includes(';') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(';')
    ),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateImportTemplate(): void {
  const template = [
    {
      'Nome do Negócio*': 'Exemplo: Venda para João',
      'Nome do Contato*': 'João Silva',
      'Email': 'joao@email.com',
      'Telefone': '11999999999',
      'CPF/CNPJ': '123.456.789-00',
      'Valor': '5000',
      'Temperatura': 'quente (frio/morno/quente)',
      'Fonte': 'Site',
      'Tags': 'VIP, Urgente',
      'Observações': 'Notas adicionais',
      'Empresa': 'Empresa XYZ',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(template);
  ws['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 18 },
    { wch: 12 },
    { wch: 25 },
    { wch: 15 },
    { wch: 20 },
    { wch: 30 },
    { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');

  XLSX.writeFile(wb, 'template-importacao-crm.xlsx');
}

export interface ParsedImportRow {
  title: string;
  contactName: string;
  email: string;
  phone: string;
  document: string;
  value: number;
  temperature: Temperature;
  source: string;
  tags: string[];
  notes: string;
  company: string;
  isValid: boolean;
  errors: string[];
}

export function parseImportFile(file: File): Promise<ParsedImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet);

        const parsedRows: ParsedImportRow[] = jsonData.map((row, index) => {
          const errors: string[] = [];

          // Get values from different possible column names
          const title = row['Nome do Negócio*'] || row['Nome do Negócio'] || row['Titulo'] || '';
          const contactName = row['Nome do Contato*'] || row['Nome do Contato'] || row['Contato'] || '';
          const email = row['Email'] || row['E-mail'] || '';
          const phone = row['Telefone'] || row['Phone'] || '';
          const document = row['CPF/CNPJ'] || row['Documento'] || '';
          const valueStr = row['Valor'] || row['Value'] || '0';
          const tempStr = (row['Temperatura'] || row['Temperature'] || 'warm').toLowerCase();
          const source = row['Fonte'] || row['Source'] || row['Origem'] || '';
          const tagsStr = row['Tags'] || '';
          const notes = row['Observações'] || row['Notas'] || row['Notes'] || '';
          const company = row['Empresa'] || row['Company'] || '';

          // Validate required fields
          if (!title) errors.push('Nome do negócio é obrigatório');
          if (!contactName) errors.push('Nome do contato é obrigatório');

          // Parse value
          const value = parseFloat(valueStr.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;

          // Parse temperature
          let temperature: Temperature = 'warm';
          if (tempStr.includes('frio') || tempStr.includes('cold')) temperature = 'cold';
          else if (tempStr.includes('quente') || tempStr.includes('hot')) temperature = 'hot';

          // Parse tags
          const tags = tagsStr
            .split(/[,;]/)
            .map(t => t.trim())
            .filter(Boolean);

          return {
            title,
            contactName,
            email,
            phone,
            document,
            value,
            temperature,
            source,
            tags,
            notes,
            company,
            isValid: errors.length === 0,
            errors,
          };
        });

        resolve(parsedRows);
      } catch (error) {
        reject(new Error('Erro ao processar arquivo. Verifique se é um arquivo Excel ou CSV válido.'));
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}
