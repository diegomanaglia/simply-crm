import { Deal } from '@/types/crm';

interface ExportDeal extends Deal {
  pipelineName?: string;
  phaseName?: string;
}

export function exportDealsToCSV(deals: ExportDeal[], filename: string = 'relatorio-crm') {
  const headers = [
    'Título',
    'Contato',
    'CPF/CNPJ',
    'Telefone',
    'Email',
    'Valor',
    'Temperatura',
    'Fonte',
    'Pipeline',
    'Fase',
    'Data de Criação',
    'Tags',
  ];

  const temperatureLabels: Record<string, string> = {
    cold: 'Frio',
    warm: 'Morno',
    hot: 'Quente',
  };

  const rows = deals.map((deal) => [
    deal.title,
    deal.contactName || '',
    deal.document || '',
    deal.phone || '',
    deal.email || '',
    deal.value.toFixed(2).replace('.', ','),
    temperatureLabels[deal.temperature] || deal.temperature,
    deal.source || '',
    deal.pipelineName || '',
    deal.phaseName || '',
    new Date(deal.createdAt).toLocaleDateString('pt-BR'),
    deal.tags.map((t) => t.name).join('; '),
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map((row) =>
      row.map((cell) => {
        // Escape quotes and wrap in quotes if contains separator
        const cellStr = String(cell);
        if (cellStr.includes(';') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(';')
    ),
  ].join('\n');

  // Add BOM for Excel compatibility with UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportArchivedDealsToCSV(deals: Deal[], filename: string = 'leads-arquivados') {
  const headers = [
    'Título',
    'Contato',
    'CPF/CNPJ',
    'Telefone',
    'Email',
    'Valor',
    'Pipeline Original',
    'Última Fase',
    'Data de Arquivamento',
  ];

  const rows = deals.map((deal) => [
    deal.title,
    deal.contactName || '',
    deal.document || '',
    deal.phone || '',
    deal.email || '',
    deal.value.toFixed(2).replace('.', ','),
    deal.archivedFromPipelineName || '',
    deal.archivedFromPhaseName || '',
    deal.archivedAt ? new Date(deal.archivedAt).toLocaleDateString('pt-BR') : '',
  ]);

  const csvContent = [
    headers.join(';'),
    ...rows.map((row) =>
      row.map((cell) => {
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
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
