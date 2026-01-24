import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExportDeal, ExportSummary } from './export-utils';

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

export function exportToPDF(
  deals: ExportDeal[],
  filename: string,
  title: string,
  summary?: ExportSummary,
  dateRange?: { from?: Date; to?: Date }
): void {
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const textColor: [number, number, number] = [31, 41, 55];
  const mutedColor: [number, number, number] = [107, 114, 128];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 25, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Simply CRM', 14, 16);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(title, pageWidth - 14, 16, { align: 'right' });

  // Report period
  let yPos = 35;
  doc.setTextColor(...textColor);
  doc.setFontSize(10);

  let periodText = 'Período: ';
  if (dateRange?.from && dateRange?.to) {
    periodText += `${formatDate(dateRange.from.toISOString())} a ${formatDate(dateRange.to.toISOString())}`;
  } else if (dateRange?.from) {
    periodText += `A partir de ${formatDate(dateRange.from.toISOString())}`;
  } else if (dateRange?.to) {
    periodText += `Até ${formatDate(dateRange.to.toISOString())}`;
  } else {
    periodText += 'Todos os períodos';
  }
  doc.text(periodText, 14, yPos);

  doc.setTextColor(...mutedColor);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - 14, yPos, { align: 'right' });

  yPos += 10;

  // Summary KPIs
  if (summary) {
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, yPos, pageWidth - 28, 30, 3, 3, 'F');

    const kpiWidth = (pageWidth - 28) / 4;
    const kpis = [
      { label: 'Total de Negócios', value: summary.totalDeals.toString() },
      { label: 'Valor Total', value: formatCurrency(summary.totalValue) },
      { label: 'Média por Negócio', value: formatCurrency(summary.averageValue) },
      { label: 'Taxa de Conversão', value: `${summary.conversionRate.toFixed(1)}%` },
    ];

    kpis.forEach((kpi, index) => {
      const x = 14 + (kpiWidth * index) + (kpiWidth / 2);
      
      doc.setTextColor(...textColor);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(kpi.value, x, yPos + 15, { align: 'center' });

      doc.setTextColor(...mutedColor);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(kpi.label, x, yPos + 23, { align: 'center' });
    });

    yPos += 40;
  }

  // Deals Table
  const tableData = deals.map(deal => [
    deal.title.substring(0, 25) + (deal.title.length > 25 ? '...' : ''),
    deal.contactName?.substring(0, 20) || '',
    deal.email?.substring(0, 25) || '',
    deal.phone || '',
    formatCurrency(deal.value),
    deal.pipelineName || '',
    deal.phaseName || '',
    temperatureLabels[deal.temperature] || deal.temperature,
    formatDate(deal.createdAt),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [[
      'Negócio',
      'Contato',
      'Email',
      'Telefone',
      'Valor',
      'Pipeline',
      'Fase',
      'Temp.',
      'Criação',
    ]],
    body: tableData,
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: textColor,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 35 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 25 },
      6: { cellWidth: 25 },
      7: { cellWidth: 18 },
      8: { cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(...mutedColor);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
      doc.text('Simply CRM', 14, pageHeight - 10);
      doc.text(
        new Date().toLocaleDateString('pt-BR'),
        pageWidth - 14,
        pageHeight - 10,
        { align: 'right' }
      );
    },
  });

  // Save
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`${filename}-${dateStr}.pdf`);
}

export function exportSummaryToPDF(
  summary: ExportSummary,
  title: string,
  dateRange?: { from?: Date; to?: Date }
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const primaryColor: [number, number, number] = [59, 130, 246];
  const textColor: [number, number, number] = [31, 41, 55];
  const mutedColor: [number, number, number] = [107, 114, 128];

  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 30, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Simply CRM', 14, 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(title, pageWidth - 14, 20, { align: 'right' });

  // Period and date
  let yPos = 45;
  doc.setTextColor(...mutedColor);
  doc.setFontSize(10);

  let periodText = 'Período: ';
  if (dateRange?.from && dateRange?.to) {
    periodText += `${formatDate(dateRange.from.toISOString())} a ${formatDate(dateRange.to.toISOString())}`;
  } else {
    periodText += 'Todos os períodos';
  }
  doc.text(periodText, 14, yPos);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth - 14, yPos, { align: 'right' });

  yPos += 20;

  // KPIs Section
  doc.setTextColor(...textColor);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Métricas Principais', 14, yPos);
  yPos += 10;

  const kpis = [
    ['Total de Negócios', summary.totalDeals.toString()],
    ['Valor Total', formatCurrency(summary.totalValue)],
    ['Média por Negócio', formatCurrency(summary.averageValue)],
    ['Taxa de Conversão', `${summary.conversionRate.toFixed(1)}%`],
  ];

  autoTable(doc, {
    startY: yPos,
    body: kpis,
    theme: 'plain',
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { halign: 'right' },
    },
    styles: { fontSize: 11 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // Temperature Distribution
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Distribuição por Temperatura', 14, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [['Temperatura', 'Quantidade', 'Percentual']],
    body: summary.temperatureDistribution.map(t => [
      t.temperature,
      t.count.toString(),
      `${t.percentage.toFixed(1)}%`,
    ]),
    headStyles: { fillColor: primaryColor },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // Top Sources
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Top 5 Fontes de Tráfego', 14, yPos);
  yPos += 10;

  autoTable(doc, {
    startY: yPos,
    head: [['Fonte', 'Quantidade']],
    body: summary.topSources.map(s => [s.source, s.count.toString()]),
    headStyles: { fillColor: primaryColor },
    columnStyles: {
      1: { halign: 'right' },
    },
  });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text('Simply CRM', 14, pageHeight - 10);
  doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - 14, pageHeight - 10, { align: 'right' });

  // Save
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`relatorio-resumo-${dateStr}.pdf`);
}
