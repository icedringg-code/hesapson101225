import ExcelJS from 'exceljs';
import { Job, Company, Transaction } from '../types';
import { formatCurrency, formatDate } from './formatters';

interface ExportData {
  jobs: Job[];
  companies: Company[];
  transactions: Transaction[];
}

export async function exportToExcel(data: ExportData) {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = 'SyncArch İş Takip';
  workbook.created = new Date();

  const headerStyle = {
    fill: {
      type: 'pattern' as const,
      pattern: 'solid' as const,
      fgColor: { argb: 'FF2563EB' }
    },
    font: {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 12
    },
    alignment: {
      vertical: 'middle' as const,
      horizontal: 'center' as const
    },
    border: {
      top: { style: 'thin' as const, color: { argb: 'FF000000' } },
      left: { style: 'thin' as const, color: { argb: 'FF000000' } },
      bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
      right: { style: 'thin' as const, color: { argb: 'FF000000' } }
    }
  };

  const cellStyle = {
    alignment: {
      vertical: 'middle' as const,
      horizontal: 'left' as const
    },
    border: {
      top: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } }
    }
  };

  // ÖZET SHEET
  const summarySheet = workbook.addWorksheet('Özet', {
    views: [{ showGridLines: false }]
  });

  const totalIncome = data.transactions.reduce((sum, t) => sum + (t.income || 0), 0);
  const totalExpense = data.transactions.reduce((sum, t) => sum + (t.expense || 0), 0);
  const netBalance = totalIncome - totalExpense;

  summarySheet.columns = [
    { width: 35 },
    { width: 30 }
  ];

  const summaryData = [
    { label: 'Toplam İş Sayısı', value: data.jobs.length, color: 'FF3B82F6' },
    { label: 'Aktif İşler', value: data.jobs.filter(j => j.status === 'Aktif').length, color: 'FF10B981' },
    { label: 'Tamamlanan İşler', value: data.jobs.filter(j => j.status === 'Tamamlandı').length, color: 'FF8B5CF6' },
    { label: 'Duraklatılan İşler', value: data.jobs.filter(j => j.status === 'Duraklatıldı').length, color: 'FFFBBF24' },
    null,
    { label: 'Toplam Firma Sayısı', value: data.companies.length, color: 'FF3B82F6' },
    { label: 'İşveren Firmaları', value: data.companies.filter(c => c.type === 'İşveren').length, color: 'FF10B981' },
    { label: 'Çalışan Firmaları', value: data.companies.filter(c => c.type === 'Çalışan').length, color: 'FF6366F1' },
    null,
    { label: 'Toplam İşlem Sayısı', value: data.transactions.length, color: 'FF3B82F6' },
    { label: 'Toplam Gelir', value: formatCurrency(totalIncome), color: 'FF10B981' },
    { label: 'Toplam Gider', value: formatCurrency(totalExpense), color: 'FFEF4444' },
    { label: 'Net Durum', value: formatCurrency(netBalance), color: netBalance >= 0 ? 'FF10B981' : 'FFEF4444' }
  ];

  summaryData.forEach((item, index) => {
    if (!item) {
      summarySheet.addRow(['', '']);
      return;
    }

    const row = summarySheet.addRow([item.label, item.value]);
    row.height = 25;

    row.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: item.color }
    };
    row.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };

    row.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF9FAFB' }
    };
    row.getCell(2).font = { bold: true, size: 11 };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'right' };

    row.getCell(1).border = cellStyle.border;
    row.getCell(2).border = cellStyle.border;
  });

  // İŞLER SHEET
  const jobsSheet = workbook.addWorksheet('İşler');

  jobsSheet.columns = [
    { header: 'Sıra', key: 'index', width: 8 },
    { header: 'İş Adı', key: 'name', width: 35 },
    { header: 'Açıklama', key: 'description', width: 45 },
    { header: 'Durum', key: 'status', width: 15 },
    { header: 'Başlangıç Tarihi', key: 'start_date', width: 18 },
    { header: 'Bitiş Tarihi', key: 'end_date', width: 18 },
    { header: 'Sözleşme Tutarı', key: 'contract_amount', width: 20 },
    { header: 'Oluşturma Tarihi', key: 'created_at', width: 18 }
  ];

  const headerRow = jobsSheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = headerStyle.fill;
    cell.font = headerStyle.font;
    cell.alignment = headerStyle.alignment;
    cell.border = headerStyle.border;
  });

  data.jobs.forEach((job, index) => {
    const row = jobsSheet.addRow({
      index: index + 1,
      name: job.name,
      description: job.description || '',
      status: job.status,
      start_date: formatDate(job.start_date),
      end_date: job.end_date ? formatDate(job.end_date) : '',
      contract_amount: job.contract_amount || 0,
      created_at: formatDate(job.created_at)
    });

    row.height = 22;
    row.eachCell((cell, colNumber) => {
      cell.border = cellStyle.border;
      cell.alignment = cellStyle.alignment;

      if (index % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }
        };
      }

      if (colNumber === 4) {
        const statusColors: Record<string, string> = {
          'Aktif': 'FF10B981',
          'Tamamlandı': 'FF8B5CF6',
          'Duraklatıldı': 'FFFBBF24'
        };
        const color = statusColors[job.status] || 'FF6B7280';
        cell.font = { bold: true, color: { argb: color } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      if (colNumber === 7) {
        cell.numFmt = '#,##0.00 ₺';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    });
  });

  // FİRMALAR SHEET
  const companiesSheet = workbook.addWorksheet('Firmalar');

  companiesSheet.columns = [
    { header: 'Sıra', key: 'index', width: 8 },
    { header: 'Firma Adı', key: 'name', width: 35 },
    { header: 'Tip', key: 'type', width: 15 },
    { header: 'Oluşturma Tarihi', key: 'created_at', width: 18 }
  ];

  const companyHeaderRow = companiesSheet.getRow(1);
  companyHeaderRow.height = 30;
  companyHeaderRow.eachCell((cell) => {
    cell.fill = headerStyle.fill;
    cell.font = headerStyle.font;
    cell.alignment = headerStyle.alignment;
    cell.border = headerStyle.border;
  });

  data.companies.forEach((company, index) => {
    const row = companiesSheet.addRow({
      index: index + 1,
      name: company.name,
      type: company.type,
      created_at: formatDate(company.created_at)
    });

    row.height = 22;
    row.eachCell((cell, colNumber) => {
      cell.border = cellStyle.border;
      cell.alignment = cellStyle.alignment;

      if (index % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }
        };
      }

      if (colNumber === 3) {
        const typeColor = company.type === 'İşveren' ? 'FF10B981' : 'FF6366F1';
        cell.font = { bold: true, color: { argb: typeColor } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });
  });

  // İŞLEMLER SHEET
  const transactionsSheet = workbook.addWorksheet('İşlemler');

  transactionsSheet.columns = [
    { header: 'Sıra', key: 'index', width: 8 },
    { header: 'Tarih', key: 'date', width: 14 },
    { header: 'Firma Adı', key: 'company', width: 30 },
    { header: 'İşlemi Yapan', key: 'performed_by', width: 30 },
    { header: 'Açıklama', key: 'description', width: 40 },
    { header: 'Gelir', key: 'income', width: 18 },
    { header: 'Gider', key: 'expense', width: 18 },
    { header: 'Para Birimi', key: 'currency', width: 12 },
    { header: 'Ödeme Yöntemi', key: 'payment_method', width: 18 },
    { header: 'Not', key: 'note', width: 35 }
  ];

  const transHeaderRow = transactionsSheet.getRow(1);
  transHeaderRow.height = 30;
  transHeaderRow.eachCell((cell) => {
    cell.fill = headerStyle.fill;
    cell.font = headerStyle.font;
    cell.alignment = headerStyle.alignment;
    cell.border = headerStyle.border;
  });

  data.transactions.forEach((transaction, index) => {
    const row = transactionsSheet.addRow({
      index: index + 1,
      date: formatDate(transaction.date),
      company: transaction.company?.name || '',
      performed_by: transaction.performed_by?.name || '',
      description: transaction.description || '',
      income: transaction.income || 0,
      expense: transaction.expense || 0,
      currency: transaction.currency_type || 'TRY',
      payment_method: transaction.payment_method || '',
      note: transaction.note || ''
    });

    row.height = 22;
    row.eachCell((cell, colNumber) => {
      cell.border = cellStyle.border;
      cell.alignment = cellStyle.alignment;

      if (index % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9FAFB' }
        };
      }

      if (colNumber === 6) {
        cell.numFmt = '#,##0.00 ₺';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (transaction.income > 0) {
          cell.font = { bold: true, color: { argb: 'FF10B981' } };
        }
      }

      if (colNumber === 7) {
        cell.numFmt = '#,##0.00 ₺';
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (transaction.expense > 0) {
          cell.font = { bold: true, color: { argb: 'FFEF4444' } };
        }
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `is_takip_${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

