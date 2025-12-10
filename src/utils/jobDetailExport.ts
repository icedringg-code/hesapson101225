import ExcelJS from 'exceljs';
import { Job, JobStats, CompanyWithStats, Transaction } from '../types';
import { formatCurrency, formatDate } from './formatters';

export async function exportJobDetailToExcel(
  job: Job,
  stats: JobStats | null,
  employers: CompanyWithStats[],
  employees: CompanyWithStats[],
  transactions: Transaction[]
) {
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
    border: {
      top: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } },
      left: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } },
      bottom: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } },
      right: { style: 'thin' as const, color: { argb: 'FFE5E7EB' } }
    }
  };

  const infoSheet = workbook.addWorksheet('İş Bilgileri', {
    views: [{ showGridLines: false }]
  });

  infoSheet.columns = [
    { width: 25 },
    { width: 50 }
  ];

  const titleRow = infoSheet.addRow(['İŞ BİLGİLERİ']);
  titleRow.height = 35;
  titleRow.getCell(1).merge(titleRow.getCell(2));
  titleRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E40AF' }
  };
  titleRow.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
  titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

  infoSheet.addRow([]);

  const jobInfo = [
    { label: 'İş Adı', value: job.name, color: 'FF3B82F6' },
    { label: 'Açıklama', value: job.description || '', color: 'FF6B7280' },
    { label: 'Durum', value: job.status, color: 'FF10B981' },
    { label: 'Başlangıç Tarihi', value: formatDate(job.start_date), color: 'FF8B5CF6' },
    { label: 'Bitiş Tarihi', value: job.end_date ? formatDate(job.end_date) : '', color: 'FF8B5CF6' }
  ];

  jobInfo.forEach(item => {
    const row = infoSheet.addRow([item.label, item.value]);
    row.height = 25;
    row.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: item.color }
    };
    row.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(2).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF9FAFB' }
    };
    row.getCell(2).font = { size: 11 };
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
    row.getCell(1).border = cellStyle.border;
    row.getCell(2).border = cellStyle.border;
  });

  if (stats) {
    infoSheet.addRow([]);
    const financeTitle = infoSheet.addRow(['FİNANSAL ÖZET']);
    financeTitle.height = 35;
    financeTitle.getCell(1).merge(financeTitle.getCell(2));
    financeTitle.getCell(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' }
    };
    financeTitle.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
    financeTitle.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

    infoSheet.addRow([]);

    const financeInfo = [
      { label: 'Toplam Gelir', value: formatCurrency(stats.totalIncome), color: 'FF10B981' },
      { label: 'Toplam Gider', value: formatCurrency(stats.totalExpense), color: 'FFEF4444' },
      { label: 'Net Durum', value: formatCurrency(stats.netBalance), color: stats.netBalance >= 0 ? 'FF10B981' : 'FFEF4444' },
      { label: 'Yapılacak Ödeme', value: formatCurrency(stats.totalToBePaid), color: 'FF3B82F6' },
      { label: 'Kalan Borç', value: formatCurrency(stats.totalRemaining), color: 'FFFBBF24' }
    ];

    financeInfo.forEach(item => {
      const row = infoSheet.addRow([item.label, item.value]);
      row.height = 25;
      row.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: item.color }
      };
      row.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
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
  }

  if (employers.length > 0) {
    const employersSheet = workbook.addWorksheet('İşverenler');

    employersSheet.columns = [
      { header: 'İşveren Adı', key: 'name', width: 35 },
      { header: 'Durum', key: 'status', width: 15 },
      { header: 'Gelir', key: 'income', width: 18 },
      { header: 'Gider', key: 'expense', width: 18 }
    ];

    const empHeaderRow = employersSheet.getRow(1);
    empHeaderRow.height = 30;
    empHeaderRow.eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.alignment = headerStyle.alignment;
      cell.border = headerStyle.border;
    });

    employers.forEach((employer, index) => {
      const row = employersSheet.addRow({
        name: employer.name,
        status: employer.status,
        income: employer.employerIncome || 0,
        expense: employer.employerExpense || 0
      });

      row.height = 22;
      row.eachCell((cell, colNumber) => {
        cell.border = cellStyle.border;
        cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : colNumber === 2 ? 'center' : 'right' };

        if (index % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }
          };
        }

        if (colNumber === 3 || colNumber === 4) {
          cell.numFmt = '#,##0.00 ₺';
        }

        if (colNumber === 3 && employer.employerIncome && employer.employerIncome > 0) {
          cell.font = { bold: true, color: { argb: 'FF10B981' } };
        }

        if (colNumber === 4 && employer.employerExpense && employer.employerExpense > 0) {
          cell.font = { bold: true, color: { argb: 'FFEF4444' } };
        }
      });
    });
  }

  if (employees.length > 0) {
    const employeesSheet = workbook.addWorksheet('Çalışanlar');

    employeesSheet.columns = [
      { header: 'Çalışan Adı', key: 'name', width: 35 },
      { header: 'Toplam Alacak', key: 'receivable', width: 18 },
      { header: 'Yapılan Ödeme', key: 'paid', width: 18 },
      { header: 'Kalan Alacak', key: 'remaining', width: 18 }
    ];

    const empHeaderRow = employeesSheet.getRow(1);
    empHeaderRow.height = 30;
    empHeaderRow.eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.alignment = headerStyle.alignment;
      cell.border = headerStyle.border;
    });

    employees.forEach((employee, index) => {
      const row = employeesSheet.addRow({
        name: employee.name,
        receivable: employee.totalReceivable || 0,
        paid: employee.paymentsMade || 0,
        remaining: employee.receivable || 0
      });

      row.height = 22;
      row.eachCell((cell, colNumber) => {
        cell.border = cellStyle.border;
        cell.alignment = { vertical: 'middle', horizontal: colNumber === 1 ? 'left' : 'right' };

        if (index % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }
          };
        }

        if (colNumber > 1) {
          cell.numFmt = '#,##0.00 ₺';
        }

        if (colNumber === 2) {
          cell.font = { bold: true, color: { argb: 'FF3B82F6' } };
        }

        if (colNumber === 3) {
          cell.font = { bold: true, color: { argb: 'FF10B981' } };
        }

        if (colNumber === 4) {
          cell.font = { bold: true, color: { argb: 'FFFBBF24' } };
        }
      });
    });
  }

  if (transactions.length > 0) {
    const transactionsSheet = workbook.addWorksheet('İşlemler');

    transactionsSheet.columns = [
      { header: 'Tarih', key: 'date', width: 14 },
      { header: 'İşlem Yapan', key: 'performed_by', width: 25 },
      { header: 'Tipi', key: 'performed_type', width: 12 },
      { header: 'İşlem Yapılan', key: 'company', width: 25 },
      { header: 'Tipi', key: 'company_type', width: 12 },
      { header: 'Açıklama', key: 'description', width: 35 },
      { header: 'Tip', key: 'note', width: 15 },
      { header: 'Gelir', key: 'income', width: 16 },
      { header: 'Gider', key: 'expense', width: 16 }
    ];

    const transHeaderRow = transactionsSheet.getRow(1);
    transHeaderRow.height = 30;
    transHeaderRow.eachCell((cell) => {
      cell.fill = headerStyle.fill;
      cell.font = headerStyle.font;
      cell.alignment = headerStyle.alignment;
      cell.border = headerStyle.border;
    });

    transactions.forEach((transaction, index) => {
      const row = transactionsSheet.addRow({
        date: formatDate(transaction.date),
        performed_by: transaction.performed_by?.name || '-',
        performed_type: transaction.performed_by?.type || '-',
        company: transaction.company?.name || '-',
        company_type: transaction.company?.type || '-',
        description: transaction.description,
        note: transaction.note,
        income: transaction.income > 0 ? transaction.income : null,
        expense: transaction.expense > 0 ? transaction.expense : null
      });

      row.height = 22;
      row.eachCell((cell, colNumber) => {
        cell.border = cellStyle.border;
        cell.alignment = { vertical: 'middle', horizontal: 'left' };

        if (index % 2 === 0) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }
          };
        }

        if (colNumber === 8) {
          cell.numFmt = '#,##0.00 ₺';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          if (transaction.income > 0) {
            cell.font = { bold: true, color: { argb: 'FF10B981' } };
          }
        }

        if (colNumber === 9) {
          cell.numFmt = '#,##0.00 ₺';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          if (transaction.expense > 0) {
            cell.font = { bold: true, color: { argb: 'FFEF4444' } };
          }
        }
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${job.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
