import * as XLSX from 'xlsx';
import { Job, Company, Transaction } from '../types';

interface ImportResult {
  jobs: Partial<Job>[];
  companies: Partial<Company>[];
  transactions: Partial<Transaction>[];
  errors: string[];
}

function parseDate(dateStr: any): string {
  if (!dateStr) return '';

  if (typeof dateStr === 'number') {
    const date = XLSX.SSF.parse_date_code(dateStr);
    return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
  }

  if (typeof dateStr === 'string') {
    const parts = dateStr.split(/[\/\.\-]/);
    if (parts.length === 3) {
      const [d, m, y] = parts;
      if (y.length === 4) {
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
    return dateStr;
  }

  return '';
}

function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  }
  return 0;
}

export async function importFromExcel(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    jobs: [],
    companies: [],
    transactions: [],
    errors: [],
  };

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    const jobsSheet = workbook.Sheets['İşler'];
    if (jobsSheet) {
      const jobsData = XLSX.utils.sheet_to_json(jobsSheet);

      jobsData.forEach((row: any, index: number) => {
        try {
          if (!row['İş Adı'] && !row['İş ID']) {
            return;
          }

          const job: Partial<Job> = {
            name: row['İş Adı'] || '',
            description: row['Açıklama'] || '',
            status: row['Durum'] as any || 'Aktif',
            start_date: parseDate(row['Başlangıç Tarihi']),
            end_date: parseDate(row['Bitiş Tarihi']) || null,
            contract_amount: parseNumber(row['Sözleşme Tutarı']),
          };

          if (row['İş ID']) {
            job.id = row['İş ID'];
          }

          if (!job.name) {
            result.errors.push(`İşler satır ${index + 2}: İş adı zorunludur`);
            return;
          }

          if (!job.start_date) {
            result.errors.push(`İşler satır ${index + 2}: Başlangıç tarihi zorunludur`);
            return;
          }

          result.jobs.push(job);
        } catch (error) {
          result.errors.push(`İşler satır ${index + 2}: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
        }
      });
    }

    const companiesSheet = workbook.Sheets['Firmalar'];
    if (companiesSheet) {
      const companiesData = XLSX.utils.sheet_to_json(companiesSheet);

      companiesData.forEach((row: any, index: number) => {
        try {
          if (!row['Firma Adı'] && !row['Firma ID']) {
            return;
          }

          const company: Partial<Company> = {
            job_id: row['İş ID'] || '',
            name: row['Firma Adı'] || '',
            type: row['Tip'] as any || 'İşveren',
          };

          if (row['Firma ID']) {
            company.id = row['Firma ID'];
          }

          if (!company.name) {
            result.errors.push(`Firmalar satır ${index + 2}: Firma adı zorunludur`);
            return;
          }

          if (!company.job_id) {
            result.errors.push(`Firmalar satır ${index + 2}: İş ID zorunludur`);
            return;
          }

          result.companies.push(company);
        } catch (error) {
          result.errors.push(`Firmalar satır ${index + 2}: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
        }
      });
    }

    const transactionsSheet = workbook.Sheets['İşlemler'];
    if (transactionsSheet) {
      const transactionsData = XLSX.utils.sheet_to_json(transactionsSheet);

      transactionsData.forEach((row: any, index: number) => {
        try {
          if (!row['İşlem ID'] && !row['Firma ID'] && !row['İş ID']) {
            return;
          }

          const transaction: Partial<Transaction> = {
            job_id: row['İş ID'] || '',
            company_id: row['Firma ID'] || '',
            performed_by_id: row['İşlemi Yapan ID'] || null,
            date: parseDate(row['Tarih']),
            description: row['Açıklama'] || '',
            income: parseNumber(row['Gelir']),
            expense: parseNumber(row['Gider']),
            note: row['Not'] || '',
            currency_type: row['Para Birimi'] || 'TRY',
            payment_method: row['Ödeme Yöntemi'] || null,
            gold_price: parseNumber(row['Altın Fiyatı']),
            gold_amount: parseNumber(row['Altın Miktarı']),
            check_date: parseDate(row['Çek Tarihi']) || null,
            check_payment_status: row['Çek Durumu'] || null,
          };

          if (row['İşlem ID']) {
            transaction.id = row['İşlem ID'];
          }

          if (!transaction.job_id) {
            result.errors.push(`İşlemler satır ${index + 2}: İş ID zorunludur`);
            return;
          }

          if (!transaction.company_id) {
            result.errors.push(`İşlemler satır ${index + 2}: Firma ID zorunludur`);
            return;
          }

          if (!transaction.date) {
            result.errors.push(`İşlemler satır ${index + 2}: Tarih zorunludur`);
            return;
          }

          result.transactions.push(transaction);
        } catch (error) {
          result.errors.push(`İşlemler satır ${index + 2}: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
        }
      });
    }

  } catch (error) {
    result.errors.push(`Dosya okuma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
  }

  return result;
}
