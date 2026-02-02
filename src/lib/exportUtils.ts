import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExportData {
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  rows: Record<string, any>[];
  filename: string;
}

// Helper to translate values to Portuguese
const translateValue = (key: string, value: any): string => {
  if (value === null || value === undefined) return '-';
  
  // Status translations
  const statusMap: Record<string, string> = {
    'active': 'Ativo',
    'inactive': 'Inativo',
    'suspended': 'Suspenso',
    'ok': 'Em dia',
    'pending': 'Pendente',
    'overdue': 'Vencido',
    'blocked': 'Bloqueado',
    'paid': 'Pago',
    'open': 'Aberto',
    'canceled': 'Cancelado',
    'male': 'Masculino',
    'female': 'Feminino',
  };

  // Belt translations
  const beltMap: Record<string, string> = {
    'white': 'Branca',
    'grey_white': 'Cinza e Branca',
    'grey': 'Cinza',
    'grey_black': 'Cinza e Preta',
    'yellow_white': 'Amarela e Branca',
    'yellow': 'Amarela',
    'yellow_black': 'Amarela e Preta',
    'orange_white': 'Laranja e Branca',
    'orange': 'Laranja',
    'orange_black': 'Laranja e Preta',
    'green_white': 'Verde e Branca',
    'green': 'Verde',
    'green_black': 'Verde e Preta',
    'blue': 'Azul',
    'purple': 'Roxa',
    'brown': 'Marrom',
    'black': 'Preta',
    'red_black': 'Vermelha e Preta',
    'red_white': 'Vermelha e Branca',
    'red': 'Vermelha',
  };

  if (key === 'belt' || key === 'belt_current' || key === 'faixa') {
    return beltMap[value] || value;
  }

  if (statusMap[value]) {
    return statusMap[value];
  }

  return String(value);
};

// Format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Export to Excel (XLSX)
export function exportToExcel(data: ExportData): void {
  // Prepare data for Excel
  const headers = data.columns.map(col => col.header);
  const rows = data.rows.map(row => 
    data.columns.map(col => {
      const value = row[col.key];
      return translateValue(col.key, value);
    })
  );

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  
  // Add title row
  const wsData = [
    [data.title],
    data.subtitle ? [data.subtitle] : [],
    [`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`],
    [], // Empty row
    headers,
    ...rows
  ].filter(row => row.length > 0);

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = data.columns.map(col => ({ wch: col.width || 15 }));
  ws['!cols'] = colWidths;

  // Merge title cells
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, // Title
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Relatório');

  // Generate and download file
  XLSX.writeFile(wb, `${data.filename}.xlsx`);
}

// Export to PDF
export function exportToPDF(data: ExportData): void {
  const doc = new jsPDF({
    orientation: data.columns.length > 6 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Add logo/header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title, pageWidth / 2, 15, { align: 'center' });

  if (data.subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(data.subtitle, pageWidth / 2, 22, { align: 'center' });
  }

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    pageWidth / 2,
    data.subtitle ? 28 : 22,
    { align: 'center' }
  );

  // Prepare table data
  const headers = data.columns.map(col => col.header);
  const rows = data.rows.map(row => 
    data.columns.map(col => {
      const value = row[col.key];
      return translateValue(col.key, value);
    })
  );

  // Add table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: data.subtitle ? 35 : 30,
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
      halign: 'left',
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: data.columns.reduce((acc, col, index) => {
      acc[index] = { cellWidth: col.width ? col.width * 0.5 : 'auto' };
      return acc;
    }, {} as Record<number, any>),
    didDrawPage: (hookData) => {
      // Add page number
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${hookData.pageNumber} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    },
  });

  // Save PDF
  doc.save(`${data.filename}.pdf`);
}

// Student report specific exports
export function exportStudentsToExcel(students: any[], reportTitle: string = 'Relatório de Alunos'): void {
  const columns: ExportColumn[] = [
    { header: 'Nome', key: 'name', width: 25 },
    { header: 'Telefone', key: 'phone', width: 15 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Faixa', key: 'belt_current', width: 15 },
    { header: 'Graus', key: 'stripes_cached', width: 8 },
    { header: 'Idade', key: 'age', width: 8 },
    { header: 'Categoria', key: 'category', width: 15 },
    { header: 'Sexo', key: 'gender', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Financeiro', key: 'financial_status', width: 12 },
  ];

  const rows = students.map(s => ({
    ...s,
    age: s.age || '-',
    phone: s.phone || '-',
    email: s.email || '-',
    category: s.category || '-',
  }));

  exportToExcel({
    title: reportTitle,
    subtitle: `Total: ${students.length} aluno(s)`,
    columns,
    rows,
    filename: `alunos-${format(new Date(), 'yyyy-MM-dd-HHmm')}`,
  });
}

export function exportStudentsToPDF(students: any[], reportTitle: string = 'Relatório de Alunos'): void {
  const columns: ExportColumn[] = [
    { header: 'Nome', key: 'name', width: 30 },
    { header: 'Telefone', key: 'phone', width: 20 },
    { header: 'Faixa', key: 'belt_current', width: 18 },
    { header: 'Graus', key: 'stripes_cached', width: 10 },
    { header: 'Idade', key: 'age', width: 10 },
    { header: 'Categoria', key: 'category', width: 18 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Financeiro', key: 'financial_status', width: 15 },
  ];

  const rows = students.map(s => ({
    ...s,
    age: s.age ? `${s.age} anos` : '-',
    phone: s.phone || '-',
    category: s.category || '-',
  }));

  exportToPDF({
    title: reportTitle,
    subtitle: `Total: ${students.length} aluno(s)`,
    columns,
    rows,
    filename: `alunos-${format(new Date(), 'yyyy-MM-dd-HHmm')}`,
  });
}

// Financial report specific exports
export function exportFinancialToExcel(
  invoices: any[], 
  expenses: any[], 
  month: number, 
  year: number,
  summary: { received: number; receivable: number; overdue: number; expenses: number; net: number }
): void {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ['RESUMO FINANCEIRO'],
    [`Período: ${format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: ptBR })}`],
    [`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`],
    [],
    ['Indicador', 'Valor'],
    ['Receita Recebida', formatCurrency(summary.received)],
    ['A Receber', formatCurrency(summary.receivable)],
    ['Vencido', formatCurrency(summary.overdue)],
    ['Total Despesas', formatCurrency(summary.expenses)],
    ['Resultado Líquido', formatCurrency(summary.net)],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumo');

  // Invoices sheet
  const invoiceHeaders = ['Aluno', 'Valor', 'Vencimento', 'Status', 'Data Pagamento'];
  const invoiceRows = invoices.map(i => [
    i.student?.name || 'Desconhecido',
    formatCurrency(Number(i.amount)),
    format(new Date(i.due_date), 'dd/MM/yyyy'),
    translateValue('status', i.status),
    i.paid_at ? format(new Date(i.paid_at), 'dd/MM/yyyy') : '-',
  ]);
  const invoiceData = [
    ['FATURAS'],
    [`Total: ${invoices.length}`],
    [],
    invoiceHeaders,
    ...invoiceRows,
  ];
  const invoiceWs = XLSX.utils.aoa_to_sheet(invoiceData);
  invoiceWs['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, invoiceWs, 'Faturas');

  // Expenses sheet
  const expenseHeaders = ['Descrição', 'Categoria', 'Valor', 'Vencimento', 'Status'];
  const expenseRows = expenses.map(e => [
    e.description,
    e.category?.name || '-',
    formatCurrency(Number(e.amount)),
    e.due_date ? format(new Date(e.due_date), 'dd/MM/yyyy') : '-',
    e.paid_at ? 'Pago' : 'Pendente',
  ]);
  const expenseData = [
    ['DESPESAS'],
    [`Total: ${expenses.length}`],
    [],
    expenseHeaders,
    ...expenseRows,
  ];
  const expenseWs = XLSX.utils.aoa_to_sheet(expenseData);
  expenseWs['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, expenseWs, 'Despesas');

  XLSX.writeFile(wb, `financeiro-${year}-${month.toString().padStart(2, '0')}.xlsx`);
}

export function exportFinancialToPDF(
  invoices: any[], 
  expenses: any[], 
  month: number, 
  year: number,
  summary: { received: number; receivable: number; overdue: number; expenses: number; net: number }
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 15;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório Financeiro', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: ptBR }), pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Summary box
  doc.setTextColor(0);
  doc.setFillColor(240, 240, 240);
  doc.rect(14, yPos, pageWidth - 28, 35, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO', 20, yPos + 8);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const col1X = 20;
  const col2X = pageWidth / 2 + 10;
  const lineHeight = 6;
  
  doc.text(`Receita Recebida: ${formatCurrency(summary.received)}`, col1X, yPos + 16);
  doc.text(`A Receber: ${formatCurrency(summary.receivable)}`, col2X, yPos + 16);
  doc.text(`Vencido: ${formatCurrency(summary.overdue)}`, col1X, yPos + 22);
  doc.text(`Despesas: ${formatCurrency(summary.expenses)}`, col2X, yPos + 22);
  
  doc.setFont('helvetica', 'bold');
  const netColor = summary.net >= 0 ? [0, 128, 0] : [200, 0, 0];
  doc.setTextColor(netColor[0], netColor[1], netColor[2]);
  doc.text(`Resultado Líquido: ${formatCurrency(summary.net)}`, col1X, yPos + 30);
  doc.setTextColor(0);
  
  yPos += 45;

  // Invoices table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Faturas (${invoices.length})`, 14, yPos);
  yPos += 5;

  const invoiceRows = invoices.slice(0, 30).map(i => [
    i.student?.name || 'Desconhecido',
    formatCurrency(Number(i.amount)),
    format(new Date(i.due_date), 'dd/MM/yyyy'),
    translateValue('status', i.status),
  ]);

  autoTable(doc, {
    head: [['Aluno', 'Valor', 'Vencimento', 'Status']],
    body: invoiceRows,
    startY: yPos,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // Add new page for expenses if needed
  const finalY = (doc as any).lastAutoTable.finalY;
  if (finalY > 200) {
    doc.addPage();
    yPos = 20;
  } else {
    yPos = finalY + 15;
  }

  // Expenses table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Despesas (${expenses.length})`, 14, yPos);
  yPos += 5;

  const expenseRows = expenses.slice(0, 30).map(e => [
    e.description,
    e.category?.name || '-',
    formatCurrency(Number(e.amount)),
    e.paid_at ? 'Pago' : 'Pendente',
  ]);

  autoTable(doc, {
    head: [['Descrição', 'Categoria', 'Valor', 'Status']],
    body: expenseRows,
    startY: yPos,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [155, 89, 182], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  }

  doc.save(`financeiro-${year}-${month.toString().padStart(2, '0')}.pdf`);
}

// Overdue students export
export function exportOverdueStudentsToExcel(students: any[]): void {
  const columns: ExportColumn[] = [
    { header: 'Aluno', key: 'studentName', width: 25 },
    { header: 'Faturas Vencidas', key: 'invoiceCount', width: 15 },
    { header: 'Total Devido', key: 'totalOwed', width: 18 },
    { header: 'Vencimento Mais Antigo', key: 'oldestDueDate', width: 20 },
  ];

  const rows = students.map(s => ({
    ...s,
    totalOwed: formatCurrency(s.totalOwed),
    oldestDueDate: format(new Date(s.oldestDueDate), 'dd/MM/yyyy'),
  }));

  exportToExcel({
    title: 'Relatório de Inadimplentes',
    subtitle: `Total: ${students.length} aluno(s) com faturas vencidas`,
    columns,
    rows,
    filename: `inadimplentes-${format(new Date(), 'yyyy-MM-dd-HHmm')}`,
  });
}

export function exportOverdueStudentsToPDF(students: any[]): void {
  const columns: ExportColumn[] = [
    { header: 'Aluno', key: 'studentName', width: 30 },
    { header: 'Faturas Vencidas', key: 'invoiceCount', width: 20 },
    { header: 'Total Devido', key: 'totalOwed', width: 25 },
    { header: 'Vencimento Mais Antigo', key: 'oldestDueDate', width: 25 },
  ];

  const rows = students.map(s => ({
    ...s,
    totalOwed: formatCurrency(s.totalOwed),
    oldestDueDate: format(new Date(s.oldestDueDate), 'dd/MM/yyyy'),
  }));

  exportToPDF({
    title: 'Relatório de Inadimplentes',
    subtitle: `Total: ${students.length} aluno(s) com faturas vencidas`,
    columns,
    rows,
    filename: `inadimplentes-${format(new Date(), 'yyyy-MM-dd-HHmm')}`,
  });
}
