import { supabase } from '../lib/supabase';
import { Company, CompanyWithStats, Transaction } from '../types';

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function getJobCompanies(jobId: string): Promise<CompanyWithStats[]> {
  const userId = await getUserId();

  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('*')
    .eq('job_id', jobId)
    .eq('user_id', userId);

  if (companiesError) throw companiesError;
  if (!companies) return [];

  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('*')
    .eq('job_id', jobId)
    .eq('user_id', userId);

  if (transactionsError) throw transactionsError;

  return companies.map((company: Company) => {
    const stats = calculateCompanyStats(company, transactions || [], companies);
    return {
      ...company,
      ...stats,
    };
  });
}

function calculateCompanyStats(
  company: Company,
  transactions: Transaction[],
  allCompanies: Company[]
): Partial<CompanyWithStats> {
  const companyTransactions = transactions.filter(
    (t) => t.company_id === company.id
  );

  if (company.type === 'Çalışan') {
    const totalReceivable = companyTransactions
      .filter((t) => t.note === 'Alacak')
      .reduce((sum, t) => sum + Number(t.income), 0);

    const cashPaymentsMade = companyTransactions
      .filter((t) => t.note === 'Ödeme Alındı')
      .reduce((sum, t) => sum + Number(t.income), 0);

    const checkPaymentsMade = companyTransactions
      .filter((t) => t.note === 'Çalışana Çek Verildi (Ödenmedi)')
      .reduce((sum, t) => sum + Number(t.check_paid_amount || 0), 0);

    const paymentsMade = cashPaymentsMade + checkPaymentsMade;

    const receivable = totalReceivable - paymentsMade;
    let status = 'Dengede';
    if (receivable > 0) status = 'Alacaklı';
    else if (receivable < 0) status = 'Fazla Ödendi';

    return {
      totalReceivable,
      paymentsMade,
      receivable,
      status,
    };
  } else {
    const employerIncome = companyTransactions
      .filter((t) => t.note === 'Gelir' || t.note === 'Transfer Alındı' || t.note?.includes('Çek Ödemesi Geliri'))
      .reduce((sum, t) => sum + Number(t.income), 0);

    const performedTransactions = transactions.filter(
      (t) => t.performed_by_id === company.id
    );

    const employerExpense = performedTransactions
      .filter((t) => t.note === 'İşveren Harcaması' || t.note === 'Transfer Yapıldı')
      .reduce((sum, t) => sum + Number(t.expense), 0);

    const paymentsToEmployees = performedTransactions
      .filter((t) => t.note === 'Ödeme Yapıldı')
      .reduce((sum, t) => sum + Number(t.expense), 0);

    const checkPaymentsToEmployees = performedTransactions
      .filter((t) => t.note === 'Çalışana Çek Verildi (Ödenmedi)')
      .reduce((sum, t) => sum + Number(t.check_total_amount || 0), 0);

    const totalCheckPayments = checkPaymentsToEmployees;
    const cashPayments = paymentsToEmployees;

    const allEmployeeChecks = transactions.filter(
      (t) => t.note === 'Çalışana Çek Verildi (Ödenmedi)'
    );

    const employerCount = allCompanies.filter(c => c.type === 'İşveren').length || 1;

    const totalCheckAmount = allEmployeeChecks.reduce((sum, t) => {
      return sum + Number(t.check_total_amount || 0);
    }, 0);

    const checkPaymentsMadeByEmployer = performedTransactions
      .filter((t) => t.note === 'Çek Ödemesi (Tam)' || t.note === 'Çek Ödemesi (Kısmi)' || t.note?.includes('Çek Ödemesi Gideri'))
      .reduce((sum, t) => sum + Number(t.expense), 0);

    const employerCheckShare = totalCheckAmount / employerCount;
    const unpaidCheckDebt = Math.max(0, employerCheckShare - checkPaymentsMadeByEmployer);

    const ownCheckPayments = performedTransactions
      .filter((t) => t.note === 'Çek Ödemesi (Tam)' || t.note === 'Çek Ödemesi (Kısmi)')
      .reduce((sum, t) => sum + Number(t.expense), 0);

    const checkPaymentExpenses = performedTransactions
      .filter((t) => t.note?.includes('Çek Ödemesi Gideri'))
      .reduce((sum, t) => sum + Number(t.expense), 0);

    const totalExpense = employerExpense + paymentsToEmployees + totalCheckPayments + ownCheckPayments + checkPaymentExpenses;
    const receivable = totalExpense - employerIncome;

    let status = 'Dengede';
    if (receivable > 0) status = 'Alacaklı';
    else if (receivable < 0) status = 'Borçlu';

    const goldBalance = transactions
      .filter((t) => t.payment_method !== 'Çek' && t.currency_type === 'Altın')
      .reduce((sum, t) => {
        if (t.performed_by_id === company.id) {
          if (t.note === 'Gelir') {
            return sum + Number(t.gold_amount || 0);
          }
          if (t.note === 'İşveren Harcaması' || t.note === 'Ödeme Yapıldı' || t.note === 'Transfer Yapıldı' ||
              t.note === 'Çek Ödemesi (Tam)' || t.note === 'Çek Ödemesi (Kısmi)' || t.note?.includes('Çek Ödemesi Gideri')) {
            return sum - Number(t.gold_amount || 0);
          }
        }
        if (t.company_id === company.id && (t.note === 'Transfer Alındı' || t.note?.includes('Çek Ödemesi Geliri'))) {
          return sum + Number(t.gold_amount || 0);
        }
        return sum;
      }, 0);

    const usdBalance = transactions
      .filter((t) => t.payment_method !== 'Çek' && t.currency_type === 'Dolar')
      .reduce((sum, t) => {
        if (t.performed_by_id === company.id) {
          if (t.note === 'Gelir') {
            return sum + Number(t.gold_amount || 0);
          }
          if (t.note === 'İşveren Harcaması' || t.note === 'Ödeme Yapıldı' || t.note === 'Transfer Yapıldı' ||
              t.note === 'Çek Ödemesi (Tam)' || t.note === 'Çek Ödemesi (Kısmi)' || t.note?.includes('Çek Ödemesi Gideri')) {
            return sum - Number(t.gold_amount || 0);
          }
        }
        if (t.company_id === company.id && (t.note === 'Transfer Alındı' || t.note?.includes('Çek Ödemesi Geliri'))) {
          return sum + Number(t.gold_amount || 0);
        }
        return sum;
      }, 0);

    const tlBalance = transactions
      .filter((t) => t.payment_method !== 'Çek' && t.currency_type === 'TL')
      .reduce((sum, t) => {
        if (t.performed_by_id === company.id) {
          if (t.note === 'Gelir') {
            return sum + Number(t.gold_amount || 0);
          }
          if (t.note === 'İşveren Harcaması' || t.note === 'Ödeme Yapıldı' || t.note === 'Transfer Yapıldı' ||
              t.note === 'Çek Ödemesi (Tam)' || t.note === 'Çek Ödemesi (Kısmi)' || t.note?.includes('Çek Ödemesi Gideri')) {
            return sum - Number(t.gold_amount || 0);
          }
        }
        if (t.company_id === company.id && (t.note === 'Transfer Alındı' || t.note?.includes('Çek Ödemesi Geliri'))) {
          return sum + Number(t.gold_amount || 0);
        }
        return sum;
      }, 0);

    return {
      employerIncome,
      employerExpense: totalExpense,
      totalExpense: totalExpense,
      receivable,
      status,
      goldBalance,
      usdBalance,
      tlBalance,
      checkPayments: totalCheckPayments,
      cashPayments,
      unpaidCheckDebt,
      employerCheckShare,
    };
  }
}

export async function createCompany(data: {
  jobId: string;
  name: string;
  type: 'İşveren' | 'Çalışan';
}): Promise<Company> {
  const userId = await getUserId();

  const { data: company, error } = await supabase
    .from('companies')
    .insert({
      user_id: userId,
      job_id: data.jobId,
      name: data.name,
      type: data.type,
    })
    .select()
    .single();

  if (error) throw new Error('Failed to create company');
  return company;
}

export async function getCompany(companyId: string): Promise<Company | null> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error('Failed to fetch company');
  return data;
}

export async function updateCompany(
  companyId: string,
  updates: { name: string }
): Promise<Company> {
  const userId = await getUserId();

  const company = await getCompany(companyId);
  if (!company) throw new Error('Company not found');

  const { data, error } = await supabase
    .from('companies')
    .update({
      name: updates.name,
    })
    .eq('id', companyId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error('Failed to update company');
  return data;
}

export async function deleteCompany(companyId: string): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', companyId)
    .eq('user_id', userId);

  if (error) throw new Error('Failed to delete company');
}

export async function addCompany(data: {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('companies')
    .insert({
      user_id: userId,
      name: data.name,
      type: 'İşveren',
      job_id: null,
    });

  if (error) {
    console.error('Company insert error:', error);
    throw new Error(error.message || 'Failed to add company');
  }
}
