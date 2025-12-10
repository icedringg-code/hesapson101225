import { supabase } from '../lib/supabase';
import { Job, Company, Transaction } from '../types';

export async function importJobs(jobs: Partial<Job>[]): Promise<{ success: number; failed: number; errors: string[] }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const job of jobs) {
    try {
      const jobData: any = {
        user_id: user.id,
        name: job.name,
        description: job.description || '',
        start_date: job.start_date,
        end_date: job.end_date || null,
        status: job.status || 'Aktif',
        contract_amount: job.contract_amount || 0,
      };

      const { error } = await supabase
        .from('jobs')
        .insert(jobData);

      if (error) {
        failed++;
        errors.push(`İş "${job.name}": ${error.message}`);
      } else {
        success++;
      }
    } catch (error) {
      failed++;
      errors.push(`İş "${job.name}": ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  return { success, failed, errors };
}

export async function importCompanies(companies: Partial<Company>[]): Promise<{ success: number; failed: number; errors: string[] }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const company of companies) {
    try {
      const companyData: any = {
        user_id: user.id,
        job_id: company.job_id,
        name: company.name,
        type: company.type || 'İşveren',
      };

      const { error } = await supabase
        .from('companies')
        .insert(companyData);

      if (error) {
        failed++;
        errors.push(`Firma "${company.name}": ${error.message}`);
      } else {
        success++;
      }
    } catch (error) {
      failed++;
      errors.push(`Firma "${company.name}": ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  return { success, failed, errors };
}

export async function importTransactions(transactions: Partial<Transaction>[]): Promise<{ success: number; failed: number; errors: string[] }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const transaction of transactions) {
    try {
      const transactionData: any = {
        user_id: user.id,
        job_id: transaction.job_id,
        company_id: transaction.company_id,
        performed_by_id: transaction.performed_by_id || null,
        date: transaction.date,
        description: transaction.description || '',
        income: transaction.income || 0,
        expense: transaction.expense || 0,
        note: transaction.note || '',
        currency_type: transaction.currency_type || 'TRY',
        payment_method: transaction.payment_method || null,
        gold_price: transaction.gold_price || 0,
        gold_amount: transaction.gold_amount || 0,
        check_date: transaction.check_date || null,
        check_payment_status: transaction.check_payment_status || null,
      };

      const { error } = await supabase
        .from('transactions')
        .insert(transactionData);

      if (error) {
        failed++;
        errors.push(`İşlem (${transaction.description}): ${error.message}`);
      } else {
        success++;
      }
    } catch (error) {
      failed++;
      errors.push(`İşlem (${transaction.description}): ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  return { success, failed, errors };
}

export async function getAllCompanies(): Promise<Company[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      company:company_id(id, name, type),
      performed_by:performed_by_id(id, name, type)
    `)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}
