import { supabase } from '../lib/supabase';
import { OverallStats, JobStats } from '../types';

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function calculateOverallStats(): Promise<OverallStats> {
  const userId = await getUserId();

  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('id, status')
    .eq('user_id', userId);

  if (jobsError) throw new Error('Failed to fetch jobs');

  const totalJobs = jobs?.length || 0;
  const activeJobs = jobs?.filter(j => j.status === 'Aktif').length || 0;
  const completedJobs = jobs?.filter(j => j.status === 'Tamamlandı').length || 0;
  const pausedJobs = jobs?.filter(j => j.status === 'Duraklatıldı').length || 0;

  let totalIncome = 0;
  let totalExpense = 0;
  let totalToBePaid = 0;
  let totalPaid = 0;

  for (const job of jobs || []) {
    const jobStats = await calculateJobStats(job.id);
    totalIncome += jobStats.totalIncome;
    totalExpense += jobStats.totalExpense;
    totalToBePaid += jobStats.totalToBePaid;
    totalPaid += jobStats.totalPaid;
  }

  const netBalance = totalIncome - totalExpense;
  const totalRemaining = totalToBePaid - totalPaid;

  return {
    totalIncome,
    totalExpense,
    netBalance,
    totalJobs,
    activeJobs,
    completedJobs,
    pausedJobs,
    totalToBePaid,
    totalPaid,
    totalRemaining,
  };
}

export async function calculateJobStats(jobId: string): Promise<JobStats> {
  const userId = await getUserId();

  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('income, expense, note, company_id, is_job_payment, performed_by_id, check_total_amount, check_paid_amount')
    .eq('user_id', userId)
    .eq('job_id', jobId);

  if (transactionsError) throw new Error('Failed to fetch transactions');

  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, type')
    .eq('user_id', userId)
    .eq('job_id', jobId);

  if (companiesError) throw new Error('Failed to fetch companies');

  const employerIds = companies?.filter(c => c.type === 'İşveren').map(c => c.id) || [];

  const employeeIds = companies?.filter(c => c.type === 'Çalışan').map(c => c.id) || [];

  const totalIncome = transactions?.filter(t =>
    t.note === 'Gelir' && employerIds.includes(t.company_id) && t.is_job_payment === true
  ).reduce((sum, t) => sum + Number(t.income || 0), 0) || 0;

  const performedByEmployers = transactions?.filter(t =>
    employerIds.includes(t.performed_by_id || '')
  ) || [];

  const cashExpenses = performedByEmployers
    .filter(t => t.note === 'İşveren Harcaması' || t.note === 'Ödeme Yapıldı')
    .reduce((sum, t) => sum + Number(t.expense || 0), 0);

  const checkExpenses = performedByEmployers
    .filter(t => t.note === 'Çalışana Çek Verildi (Ödenmedi)')
    .reduce((sum, t) => sum + Number(t.check_total_amount || 0), 0);

  const ownCheckPayments = performedByEmployers
    .filter(t => t.note === 'Çek Ödemesi (Tam)' || t.note === 'Çek Ödemesi (Kısmi)')
    .reduce((sum, t) => sum + Number(t.expense || 0), 0);

  const totalExpense = cashExpenses + checkExpenses + ownCheckPayments;
  const netBalance = totalIncome - totalExpense;

  const employeeTransactions = transactions?.filter(t =>
    employeeIds.includes(t.company_id)
  ) || [];

  const totalToBePaid = employeeTransactions
    .filter(t => t.note === 'Alacak')
    .reduce((sum, t) => sum + Number(t.income || 0), 0);

  const totalPaidCash = employeeTransactions
    .filter(t => t.note === 'Ödeme Alındı')
    .reduce((sum, t) => sum + Number(t.income || 0), 0);

  const employeeCheckPayments = employeeTransactions
    .filter(t => t.note === 'Çalışana Çek Verildi (Ödenmedi)')
    .reduce((sum, t) => sum + Number(t.check_paid_amount || 0), 0);

  const totalPaidWithChecks = totalPaidCash + employeeCheckPayments;

  const totalRemaining = totalToBePaid - totalPaidWithChecks;

  return {
    totalIncome,
    totalExpense,
    netBalance,
    totalToBePaid,
    totalPaid: totalPaidWithChecks,
    totalRemaining,
  };
}
