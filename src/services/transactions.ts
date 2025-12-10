import { supabase } from '../lib/supabase';
import { Transaction } from '../types';

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function getJobTransactions(jobId: string): Promise<any[]> {
  const userId = await getUserId();

  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .order('date', { ascending: false });

  if (transactionsError) throw new Error('Failed to fetch transactions');

  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId)
    .eq('job_id', jobId);

  if (companiesError) throw new Error('Failed to fetch companies');

  return (transactions || []).map((t: any) => ({
    ...t,
    company: companies?.find((c: any) => c.id === t.company_id),
    performed_by: companies?.find((c: any) => c.id === t.performed_by_id),
    check_issuer: companies?.find((c: any) => c.id === t.check_issuer_company_id),
  }));
}

export async function getCompanyTransactions(companyId: string): Promise<any[]> {
  const userId = await getUserId();

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('type')
    .eq('id', companyId)
    .single();

  if (companyError) throw new Error('Failed to fetch company');

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (company?.type === 'Çalışan') {
    query = query.eq('company_id', companyId);
  } else {
    query = query.or(`company_id.eq.${companyId},performed_by_id.eq.${companyId}`);
  }

  const { data: transactions, error: transactionsError } = await query;

  if (transactionsError) throw new Error('Failed to fetch transactions');

  const jobIds = [...new Set(transactions?.map((t: any) => t.job_id).filter(Boolean) || [])];
  const allCompanies: any[] = [];

  for (const jobId of jobIds) {
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .eq('job_id', jobId);

    if (companiesError) throw new Error('Failed to fetch companies');
    if (companies) allCompanies.push(...companies);
  }

  return (transactions || []).map((t: any) => ({
    ...t,
    company: allCompanies.find((c: any) => c.id === t.company_id),
    performed_by: allCompanies.find((c: any) => c.id === t.performed_by_id),
    check_issuer: allCompanies.find((c: any) => c.id === t.check_issuer_company_id),
  }));
}

export async function createEmployeeReceivable(data: {
  jobId: string;
  companyId: string;
  amount: number;
  description: string;
  date: string;
  goldPrice: number;
  goldAmount: number;
}): Promise<Transaction> {
  const userId = await getUserId();

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      job_id: data.jobId,
      company_id: data.companyId,
      performed_by_id: data.companyId,
      user_id: userId,
      date: data.date,
      description: data.description,
      income: data.amount,
      expense: 0,
      note: 'Alacak',
      gold_price: data.goldPrice || 0,
      gold_amount: data.goldAmount || 0,
    })
    .select()
    .single();

  if (error) throw new Error('Failed to create transaction');
  return transaction;
}

export async function createEmployerIncome(data: {
  jobId: string;
  companyId: string;
  amount: number;
  description: string;
  date: string;
  goldPrice: number;
  goldAmount: number;
  currencyType?: string;
  usdRate?: number | null;
  eurRate?: number | null;
  goldRate?: number | null;
  isJobPayment?: boolean;
}): Promise<Transaction> {
  const userId = await getUserId();

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      job_id: data.jobId,
      company_id: data.companyId,
      performed_by_id: data.companyId,
      user_id: userId,
      date: data.date,
      description: data.description,
      income: data.amount,
      expense: 0,
      note: 'Gelir',
      gold_price: data.goldPrice || 0,
      gold_amount: data.goldAmount || 0,
      currency_type: data.currencyType || null,
      usd_rate: data.usdRate,
      eur_rate: data.eurRate,
      gold_rate: data.goldRate,
      is_job_payment: data.isJobPayment || false,
    })
    .select()
    .single();

  if (error) throw new Error('Failed to create transaction');
  return transaction;
}

export async function createEmployerExpense(data: {
  jobId: string;
  companyId: string;
  amount: number;
  description: string;
  date: string;
  goldPrice: number;
  goldAmount: number;
  currencyType?: string;
  paymentMethod?: string | null;
  checkDate?: string | null;
  checkPaymentStatus?: string | null;
  checkIssuerCompanyId?: string | null;
  usdRate?: number | null;
  eurRate?: number | null;
  goldRate?: number | null;
}): Promise<Transaction> {
  const userId = await getUserId();

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert({
      job_id: data.jobId,
      company_id: data.companyId,
      performed_by_id: data.companyId,
      user_id: userId,
      date: data.date,
      description: data.description,
      income: 0,
      expense: data.paymentMethod === 'Çek' ? 0 : data.amount,
      note: data.paymentMethod === 'Çek' ? 'Çek Verildi (Ödenmedi)' : 'İşveren Harcaması',
      gold_price: data.goldPrice || 0,
      gold_amount: data.goldAmount || 0,
      currency_type: data.currencyType || null,
      payment_method: data.paymentMethod || null,
      check_date: data.checkDate || null,
      check_payment_status: data.checkPaymentStatus || null,
      check_issuer_company_id: data.checkIssuerCompanyId || null,
      check_total_amount: data.paymentMethod === 'Çek' ? data.amount : 0,
      check_paid_amount: data.paymentMethod === 'Çek' ? 0 : null,
      usd_rate: data.usdRate,
      eur_rate: data.eurRate,
      gold_rate: data.goldRate,
    })
    .select()
    .single();

  if (error) throw new Error('Failed to create transaction');
  return transaction;
}

export async function createPaymentToEmployee(data: {
  jobId: string;
  employerId: string;
  employeeId: string;
  amount: number;
  description: string;
  date: string;
  goldPrice?: number;
  goldAmount?: number;
  currencyType?: string;
  paymentMethod?: string | null;
  checkDate?: string | null;
  checkPaymentStatus?: string | null;
  usdRate?: number | null;
  eurRate?: number | null;
  goldRate?: number | null;
}): Promise<{ receiverTransaction: Transaction; payerTransaction: Transaction }> {
  const userId = await getUserId();

  const { data: receiverTransaction, error: receiverError } = await supabase
    .from('transactions')
    .insert({
      job_id: data.jobId,
      company_id: data.employeeId,
      performed_by_id: data.employerId,
      user_id: userId,
      date: data.date,
      description: data.description,
      income: data.amount,
      expense: 0,
      note: 'Ödeme Alındı',
      gold_price: 0,
      gold_amount: 0,
      currency_type: null,
      usd_rate: data.usdRate,
      eur_rate: data.eurRate,
      gold_rate: data.goldRate,
    })
    .select()
    .single();

  if (receiverError) throw new Error('Failed to create receiver transaction');

  const { data: payerTransaction, error: payerError } = await supabase
    .from('transactions')
    .insert({
      job_id: data.jobId,
      company_id: data.employeeId,
      performed_by_id: data.employerId,
      user_id: userId,
      date: data.date,
      description: data.description,
      income: 0,
      expense: data.paymentMethod === 'Çek' ? 0 : data.amount,
      note: data.paymentMethod === 'Çek' ? 'Çalışana Çek Verildi (Ödenmedi)' : 'Ödeme Yapıldı',
      gold_price: data.goldPrice || 0,
      gold_amount: data.goldAmount || 0,
      currency_type: data.currencyType || null,
      payment_method: data.paymentMethod || null,
      check_date: data.checkDate || null,
      check_payment_status: data.paymentMethod === 'Çek' ? 'Ödenmedi' : (data.checkPaymentStatus || null),
      check_paid_amount: data.paymentMethod === 'Çek' ? 0 : null,
      check_issuer_company_id: data.paymentMethod === 'Çek' ? data.employerId : null,
      check_total_amount: data.paymentMethod === 'Çek' ? data.amount : 0,
      usd_rate: data.usdRate,
      eur_rate: data.eurRate,
      gold_rate: data.goldRate,
    })
    .select()
    .single();

  if (payerError) throw new Error('Failed to create payer transaction');

  return { receiverTransaction, payerTransaction };
}

export async function createTransferBetweenEmployers(data: {
  jobId: string;
  senderEmployerId: string;
  receiverEmployerId: string;
  amount: number;
  description: string;
  date: string;
  goldPrice?: number;
  goldAmount?: number;
  currencyType?: string;
  paymentMethod?: string | null;
  checkDate?: string | null;
  checkPaymentStatus?: string | null;
  usdRate?: number | null;
  eurRate?: number | null;
  goldRate?: number | null;
}): Promise<{ receiverTransaction: Transaction; senderTransaction: Transaction }> {
  const userId = await getUserId();

  // Alıcı için kayıt (Transfer Alındı)
  const { data: receiverTransaction, error: receiverError } = await supabase
    .from('transactions')
    .insert({
      job_id: data.jobId,
      company_id: data.receiverEmployerId,
      performed_by_id: data.senderEmployerId,
      user_id: userId,
      date: data.date,
      description: data.description,
      income: data.amount,
      expense: 0,
      note: 'Transfer Alındı',
      gold_price: data.goldPrice || 0,
      gold_amount: data.goldAmount || 0,
      currency_type: data.currencyType || null,
      payment_method: data.paymentMethod || null,
      check_date: data.checkDate || null,
      check_payment_status: data.checkPaymentStatus || null,
      usd_rate: data.usdRate,
      eur_rate: data.eurRate,
      gold_rate: data.goldRate,
    })
    .select()
    .single();

  if (receiverError) throw new Error('Failed to create receiver transaction');

  // Gönderen için kayıt (Transfer Yapıldı)
  const { data: senderTransaction, error: senderError } = await supabase
    .from('transactions')
    .insert({
      job_id: data.jobId,
      company_id: data.senderEmployerId,
      performed_by_id: data.senderEmployerId,
      user_id: userId,
      date: data.date,
      description: data.description,
      income: 0,
      expense: data.paymentMethod === 'Çek' ? 0 : data.amount,
      note: data.paymentMethod === 'Çek' ? 'Çek ile Transfer (Ödenmedi)' : 'Transfer Yapıldı',
      gold_price: data.goldPrice || 0,
      gold_amount: data.goldAmount || 0,
      currency_type: data.currencyType || null,
      payment_method: data.paymentMethod || null,
      check_date: data.checkDate || null,
      check_payment_status: data.paymentMethod === 'Çek' ? 'Ödenmedi' : (data.checkPaymentStatus || null),
      check_issuer_company_id: data.paymentMethod === 'Çek' ? data.senderEmployerId : null,
      check_total_amount: data.paymentMethod === 'Çek' ? data.amount : 0,
      check_paid_amount: data.paymentMethod === 'Çek' ? 0 : null,
      usd_rate: data.usdRate,
      eur_rate: data.eurRate,
      gold_rate: data.goldRate,
    })
    .select()
    .single();

  if (senderError) throw new Error('Failed to create sender transaction');

  return { receiverTransaction, senderTransaction };
}

export async function updateTransaction(
  transactionId: string,
  updates: {
    type: string;
    amount: number;
    description: string;
    date: string;
    companyId?: string;
    goldPrice?: number;
    goldAmount?: number;
    currencyType?: string | null;
    paymentMethod?: string | null;
    checkDate?: string | null;
    checkPaymentStatus?: string | null;
    usdRate?: number | null;
    eurRate?: number | null;
    goldRate?: number | null;
    isJobPayment?: boolean;
  }
): Promise<Transaction> {
  const userId = await getUserId();

  // Get existing transaction to preserve performed_by_id for payment transactions
  const { data: existingTransaction } = await supabase
    .from('transactions')
    .select('performed_by_id, note, payment_method, check_total_amount, check_paid_amount')
    .eq('id', transactionId)
    .eq('user_id', userId)
    .single();

  if (!existingTransaction) {
    throw new Error('Transaction not found');
  }

  // Check if this is a check transaction and validate paid amounts
  if (existingTransaction.payment_method === 'Çek' && existingTransaction.check_total_amount > 0) {
    const currentPaidAmount = existingTransaction.check_paid_amount || 0;
    if (currentPaidAmount > updates.amount) {
      throw new Error(`Çek tutarı ödenen tutardan (${currentPaidAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL) az olamaz`);
    }
  }

  let income = 0;
  let expense = 0;
  let note = '';
  let companyId = updates.companyId || null;
  let performedById = updates.companyId || null;

  switch (updates.type) {
    case 'İşverenden Tahsilat':
      income = updates.amount;
      note = 'Gelir';
      break;
    case 'İşveren Harcaması':
      expense = updates.amount;
      note = 'İşveren Harcaması';
      break;
    case 'Çalışana Ödeme':
      // Preserve the original note to distinguish between "Ödeme Alındı" and "Ödeme Yapıldı"
      if (existingTransaction?.note === 'Ödeme Yapıldı') {
        expense = updates.amount;
        note = 'Ödeme Yapıldı';
      } else {
        income = updates.amount;
        note = 'Ödeme Alındı';
      }
      // Preserve the original performed_by_id (employer) for payment transactions
      performedById = existingTransaction?.performed_by_id || performedById;
      break;
    case 'İşverenler Arası Transfer':
      // Preserve the original note to distinguish between "Transfer Alındı" and "Transfer Yapıldı"
      if (existingTransaction?.note === 'Transfer Yapıldı') {
        expense = updates.amount;
        note = 'Transfer Yapıldı';
      } else {
        income = updates.amount;
        note = 'Transfer Alındı';
      }
      // Preserve the original performed_by_id (sender employer) for transfer transactions
      performedById = existingTransaction?.performed_by_id || performedById;
      break;
    case 'Çalışandan Alınan Avans':
      income = updates.amount;
      note = 'Alacak';
      performedById = companyId;
      break;
    case 'Diğer Gider':
      expense = updates.amount;
      note = 'Diğer Gider';
      companyId = null;
      performedById = null;
      break;
  }

  const updateData: any = {
    company_id: companyId,
    performed_by_id: performedById,
    date: updates.date,
    description: updates.description,
    income,
    expense,
    note,
    gold_price: updates.goldPrice || 0,
    gold_amount: updates.goldAmount || 0,
    currency_type: updates.currencyType !== undefined ? updates.currencyType : null,
    payment_method: updates.paymentMethod !== undefined ? updates.paymentMethod : null,
    check_date: updates.checkDate !== undefined ? updates.checkDate : null,
    check_payment_status: updates.checkPaymentStatus !== undefined ? updates.checkPaymentStatus : null,
    usd_rate: updates.usdRate !== undefined ? updates.usdRate : null,
    eur_rate: updates.eurRate !== undefined ? updates.eurRate : null,
    gold_rate: updates.goldRate !== undefined ? updates.goldRate : null,
  };

  // Update check_total_amount if payment method is Çek
  if (updates.paymentMethod === 'Çek') {
    updateData.check_total_amount = updates.amount;
  }

  if (updates.isJobPayment !== undefined) {
    updateData.is_job_payment = updates.isJobPayment;
  }

  const { data: transaction, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', transactionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error('Failed to update transaction');

  // If this is a check transaction and rates/currency changed, update related payment transactions
  if (existingTransaction.payment_method === 'Çek' && existingTransaction.check_total_amount > 0) {
    const relatedUpdateData: any = {};
    let hasChanges = false;

    if (updates.currencyType !== undefined && updates.currencyType !== existingTransaction.note) {
      relatedUpdateData.currency_type = updates.currencyType;
      hasChanges = true;
    }

    if (updates.usdRate !== undefined) {
      relatedUpdateData.usd_rate = updates.usdRate;
      hasChanges = true;
    }

    if (updates.eurRate !== undefined) {
      relatedUpdateData.eur_rate = updates.eurRate;
      hasChanges = true;
    }

    if (updates.goldRate !== undefined) {
      relatedUpdateData.gold_rate = updates.goldRate;
      hasChanges = true;
    }

    if (updates.goldPrice !== undefined) {
      relatedUpdateData.gold_price = updates.goldPrice;
      hasChanges = true;
    }

    // Update all related payment transactions
    if (hasChanges) {
      await supabase
        .from('transactions')
        .update(relatedUpdateData)
        .eq('parent_check_id', transactionId)
        .eq('user_id', userId);
    }
  }

  return transaction;
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  const userId = await getUserId();

  const { data: transaction } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('user_id', userId)
    .single();

  if (transaction?.parent_check_id) {
    const { data: parentCheck } = await supabase
      .from('transactions')
      .select('check_paid_amount, check_total_amount, job_id')
      .eq('id', transaction.parent_check_id)
      .eq('user_id', userId)
      .single();

    if (parentCheck) {
      const currentPaidAmount = parentCheck.check_paid_amount || 0;
      const transactionExpense = transaction.expense || 0;
      const newPaidAmount = Math.max(0, currentPaidAmount - transactionExpense);

      const { data: employers } = await supabase
        .from('companies')
        .select('id')
        .eq('job_id', parentCheck.job_id)
        .eq('type', 'İşveren')
        .eq('user_id', userId);

      const employerCount = employers?.length || 1;
      const perEmployerShare = (parentCheck.check_total_amount || 0) / employerCount;

      const { data: remainingPayments } = await supabase
        .from('transactions')
        .select('performed_by_id, expense')
        .eq('parent_check_id', transaction.parent_check_id)
        .eq('user_id', userId)
        .neq('id', transactionId)
        .or('note.eq.Çek Ödemesi (Tam),note.eq.Çek Ödemesi (Kısmi),note.ilike.%Çek Ödemesi Gideri%');

      const paymentsByEmployer = new Map<string, number>();
      remainingPayments?.forEach(p => {
        const current = paymentsByEmployer.get(p.performed_by_id) || 0;
        paymentsByEmployer.set(p.performed_by_id, current + (p.expense || 0));
      });

      let allEmployersPaid = true;
      for (const emp of (employers || [])) {
        const paidByThisEmployer = paymentsByEmployer.get(emp.id) || 0;
        if (paidByThisEmployer < perEmployerShare - 0.01) {
          allEmployersPaid = false;
          break;
        }
      }

      await supabase
        .from('transactions')
        .update({
          check_paid_amount: newPaidAmount,
          check_payment_status: allEmployersPaid ? 'Ödendi' : (newPaidAmount > 0 ? 'Kısmen Ödendi' : 'Ödenmedi')
        })
        .eq('id', transaction.parent_check_id)
        .eq('user_id', userId);
    }
  }

  const { error: relatedError } = await supabase
    .from('transactions')
    .delete()
    .eq('parent_check_id', transactionId)
    .eq('user_id', userId);

  if (relatedError) {
    console.error('Error deleting related transactions:', relatedError);
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_id', userId);

  if (error) throw new Error('Failed to delete transaction');
}

export async function addTransaction(data: {
  amount: number;
  type: 'income' | 'expense';
  description?: string;
  company_name?: string;
  payment_method?: string;
  currency_type?: string;
  gold_amount?: number;
  gold_price_per_gram?: number;
}): Promise<void> {
  const userId = await getUserId();
  const income = data.type === 'income' ? data.amount : 0;
  const expense = data.type === 'expense' ? data.amount : 0;
  const note = data.type === 'income' ? 'Gelir' : 'İşveren Harcaması';

  const { error } = await supabase
    .from('transactions')
    .insert({
      job_id: null,
      company_id: null,
      user_id: userId,
      date: new Date().toISOString().split('T')[0],
      description: data.description || '',
      income,
      expense,
      note,
      payment_method: data.payment_method || 'Nakit',
      currency_type: data.currency_type || 'TRY',
      gold_amount: data.gold_amount || 0,
      gold_price: data.gold_price_per_gram || 0,
    });

  if (error) {
    console.error('Transaction insert error:', error);
    throw new Error(error.message || 'Failed to add transaction');
  }
}

export async function getAvailableChecksForJob(jobId: string): Promise<any[]> {
  const userId = await getUserId();

  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .eq('payment_method', 'Çek')
    .gt('check_total_amount', 0)
    .order('check_date', { ascending: true });

  console.log('Raw check transactions:', transactions);

  if (transactionsError) {
    console.error('Failed to fetch checks:', transactionsError);
    throw new Error('Failed to fetch checks');
  }

  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId)
    .eq('job_id', jobId);

  if (companiesError) throw new Error('Failed to fetch companies');

  const allChecks = (transactions || []).map((t: any) => ({
    ...t,
    company: companies?.find((c: any) => c.id === t.company_id),
    performed_by: companies?.find((c: any) => c.id === t.performed_by_id),
    check_issuer: companies?.find((c: any) => c.id === t.check_issuer_company_id),
  }));

  console.log('All checks before filtering:', allChecks.length);
  allChecks.forEach((check: any, index: number) => {
    console.log(`Check ${index + 1}:`, {
      id: check.id,
      company: check.company?.name,
      check_issuer: check.check_issuer?.name,
      check_issuer_company_id: check.check_issuer_company_id,
      note: check.note,
      check_total_amount: check.check_total_amount,
      check_payment_status: check.check_payment_status,
      check_paid_amount: check.check_paid_amount,
    });
  });

  const filteredChecks = allChecks.filter((check: any) => {
    const reasons = [];

    if (check.check_payment_status === 'Ödendi') {
      reasons.push('already paid');
      console.log(`Check ${check.id} filtered out: ${reasons.join(', ')}`);
      return false;
    }
    if (!check.check_issuer_company_id) {
      reasons.push('no check_issuer_company_id');
      console.log(`Check ${check.id} filtered out: ${reasons.join(', ')}`);
      return false;
    }
    if (!check.note || !(check.note.includes('Çalışana') || check.note.includes('Çek Verildi'))) {
      reasons.push(`note doesn't include "Çalışana" or "Çek Verildi" (note: "${check.note}")`);
      console.log(`Check ${check.id} filtered out: ${reasons.join(', ')}`);
      return false;
    }
    const checkTotalAmount = check.check_total_amount || 0;
    const paidAmount = check.check_paid_amount || 0;
    const remainingAmount = checkTotalAmount - paidAmount;
    if (remainingAmount <= 0) {
      reasons.push('no remaining amount');
      console.log(`Check ${check.id} filtered out: ${reasons.join(', ')}`);
      return false;
    }

    console.log(`Check ${check.id} passed all filters - Remaining: ${remainingAmount} TL`);
    return true;
  });

  console.log('Filtered checks for job payment:', filteredChecks.length);
  if (filteredChecks.length > 0) {
    console.log('Available checks:', filteredChecks.map(c => ({
      id: c.id,
      issuer: c.check_issuer?.name,
      receiver: c.company?.name,
      total: c.check_total_amount,
      paid: c.check_paid_amount,
      remaining: (c.check_total_amount || 0) - (c.check_paid_amount || 0)
    })));
  }
  return filteredChecks;
}

export async function getAvailableChecksForEmployer(jobId: string, employerId: string): Promise<any[]> {
  const userId = await getUserId();

  const { data: transactions, error: transactionsError } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('job_id', jobId)
    .eq('payment_method', 'Çek')
    .eq('check_issuer_company_id', employerId)
    .gt('check_total_amount', 0)
    .order('check_date', { ascending: true });

  console.log('Raw employer checks:', transactions);

  if (transactionsError) {
    console.error('Failed to fetch employer checks:', transactionsError);
    throw new Error('Failed to fetch employer checks');
  }

  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId)
    .eq('job_id', jobId);

  if (companiesError) throw new Error('Failed to fetch companies');

  const allChecks = (transactions || []).map((t: any) => ({
    ...t,
    company: companies?.find((c: any) => c.id === t.company_id),
    performed_by: companies?.find((c: any) => c.id === t.performed_by_id),
    check_issuer: companies?.find((c: any) => c.id === t.check_issuer_company_id),
  }));

  const filteredChecks = allChecks.filter((check: any) => {
    if (check.check_payment_status === 'Ödendi') {
      return false;
    }
    const checkTotalAmount = check.check_total_amount || 0;
    const paidAmount = check.check_paid_amount || 0;
    const remainingAmount = checkTotalAmount - paidAmount;
    return remainingAmount > 0;
  });

  console.log('Employer filtered checks:', filteredChecks);
  return filteredChecks;
}

export async function createEmployerCheckPayment(data: {
  jobId: string;
  employerId: string;
  checkTransactionId: string;
  amount: number;
  description: string;
  date: string;
  goldPrice?: number;
  goldAmount?: number;
  currencyType?: string;
  usdRate?: number | null;
  eurRate?: number | null;
  goldRate?: number | null;
}): Promise<Transaction> {
  const userId = await getUserId();

  const { data: checkTransaction, error: checkError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', data.checkTransactionId)
    .eq('user_id', userId)
    .single();

  if (checkError || !checkTransaction) throw new Error('Check transaction not found');

  const checkTotalAmount = checkTransaction.check_total_amount || 0;
  const paymentAmount = data.amount;

  if (paymentAmount <= 0) throw new Error('Payment amount must be greater than 0');
  if (checkTotalAmount <= 0) throw new Error('Invalid check amount');

  const currentPaidAmount = checkTransaction.check_paid_amount || 0;
  const remainingAmount = checkTotalAmount - currentPaidAmount;

  if (paymentAmount > remainingAmount) {
    throw new Error(`Payment amount cannot exceed remaining amount (${remainingAmount} TL)`);
  }

  const newPaidAmount = currentPaidAmount + paymentAmount;

  const { data: employers } = await supabase
    .from('companies')
    .select('id')
    .eq('job_id', data.jobId)
    .eq('type', 'İşveren')
    .eq('user_id', userId);

  const employerCount = employers?.length || 1;
  const perEmployerShare = checkTotalAmount / employerCount;

  const { data: allPayments } = await supabase
    .from('transactions')
    .select('performed_by_id, expense')
    .eq('parent_check_id', data.checkTransactionId)
    .eq('user_id', userId)
    .or('note.eq.Çek Ödemesi (Tam),note.eq.Çek Ödemesi (Kısmi),note.ilike.%Çek Ödemesi Gideri%');

  const paymentsByEmployer = new Map<string, number>();
  allPayments?.forEach(p => {
    const current = paymentsByEmployer.get(p.performed_by_id) || 0;
    paymentsByEmployer.set(p.performed_by_id, current + (p.expense || 0));
  });

  const currentEmployerPaid = (paymentsByEmployer.get(data.employerId) || 0) + paymentAmount;
  paymentsByEmployer.set(data.employerId, currentEmployerPaid);

  let allEmployersPaid = true;
  for (const emp of (employers || [])) {
    const paidByThisEmployer = paymentsByEmployer.get(emp.id) || 0;
    if (paidByThisEmployer < perEmployerShare - 0.01) {
      allEmployersPaid = false;
      break;
    }
  }

  const isFullyPaid = allEmployersPaid;

  const { data: paymentTransaction, error: paymentError } = await supabase
    .from('transactions')
    .insert({
      job_id: data.jobId,
      company_id: data.employerId,
      performed_by_id: data.employerId,
      user_id: userId,
      date: data.date,
      description: data.description,
      income: 0,
      expense: paymentAmount,
      note: isFullyPaid ? 'Çek Ödemesi (Tam)' : 'Çek Ödemesi (Kısmi)',
      gold_price: data.goldPrice || 0,
      gold_amount: data.goldAmount || 0,
      payment_method: 'Nakit',
      currency_type: data.currencyType || 'TL',
      usd_rate: data.usdRate,
      eur_rate: data.eurRate,
      gold_rate: data.goldRate,
      parent_check_id: data.checkTransactionId,
    })
    .select()
    .single();

  if (paymentError) throw new Error('Failed to create payment transaction');

  const updateData: any = {
    check_paid_amount: newPaidAmount
  };

  if (isFullyPaid) {
    updateData.check_payment_status = 'Ödendi';
  }

  const { error: updateError } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', data.checkTransactionId)
    .eq('user_id', userId);

  if (updateError) throw new Error('Failed to update check status');

  return paymentTransaction;
}

export async function createCheckPaymentTransfer(data: {
  jobId: string;
  payerEmployerId: string;
  checkIssuerEmployerId: string;
  checkTransactionId: string;
  amount: number;
  description: string;
  date: string;
  goldPrice?: number;
  goldAmount?: number;
  currencyType?: string;
  usdRate?: number | null;
  eurRate?: number | null;
  goldRate?: number | null;
}): Promise<{ receiverTransaction: Transaction; payerTransaction: Transaction }> {
  const userId = await getUserId();

  const { data: checkTransaction, error: checkError } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', data.checkTransactionId)
    .eq('user_id', userId)
    .single();

  if (checkError || !checkTransaction) throw new Error('Check transaction not found');

  const checkTotalAmount = checkTransaction.check_total_amount || 0;
  const paymentAmount = data.amount;

  if (paymentAmount <= 0) throw new Error('Payment amount must be greater than 0');
  if (checkTotalAmount <= 0) throw new Error('Invalid check amount');

  const currentPaidAmount = checkTransaction.check_paid_amount || 0;
  const remainingAmount = checkTotalAmount - currentPaidAmount;

  if (paymentAmount > remainingAmount) {
    throw new Error(`Payment amount cannot exceed remaining amount (${remainingAmount} TL)`);
  }

  const newPaidAmount = currentPaidAmount + paymentAmount;

  const { data: employers } = await supabase
    .from('companies')
    .select('id')
    .eq('job_id', data.jobId)
    .eq('type', 'İşveren')
    .eq('user_id', userId);

  const employerCount = employers?.length || 1;
  const perEmployerShare = checkTotalAmount / employerCount;

  const { data: allPayments } = await supabase
    .from('transactions')
    .select('performed_by_id, expense')
    .eq('parent_check_id', data.checkTransactionId)
    .eq('user_id', userId)
    .or('note.eq.Çek Ödemesi (Tam),note.eq.Çek Ödemesi (Kısmi),note.ilike.%Çek Ödemesi Gideri%');

  const paymentsByEmployer = new Map<string, number>();
  allPayments?.forEach(p => {
    const current = paymentsByEmployer.get(p.performed_by_id) || 0;
    paymentsByEmployer.set(p.performed_by_id, current + (p.expense || 0));
  });

  const currentEmployerPaid = (paymentsByEmployer.get(data.payerEmployerId) || 0) + paymentAmount;
  paymentsByEmployer.set(data.payerEmployerId, currentEmployerPaid);

  let allEmployersPaid = true;
  for (const emp of (employers || [])) {
    const paidByThisEmployer = paymentsByEmployer.get(emp.id) || 0;
    if (paidByThisEmployer < perEmployerShare - 0.01) {
      allEmployersPaid = false;
      break;
    }
  }

  const isFullyPaid = allEmployersPaid;

  const { data: receiverTransaction, error: receiverError } = await supabase
    .from('transactions')
    .insert({
      job_id: data.jobId,
      company_id: data.checkIssuerEmployerId,
      performed_by_id: data.payerEmployerId,
      user_id: userId,
      date: data.date,
      description: data.description,
      income: paymentAmount,
      expense: 0,
      note: isFullyPaid ? 'Çek Ödemesi Geliri (Tam)' : 'Çek Ödemesi Geliri (Kısmi)',
      gold_price: data.goldPrice || 0,
      gold_amount: data.goldAmount || 0,
      payment_method: 'Havale/EFT',
      currency_type: data.currencyType || 'TL',
      usd_rate: data.usdRate,
      eur_rate: data.eurRate,
      gold_rate: data.goldRate,
      parent_check_id: data.checkTransactionId,
    })
    .select()
    .single();

  if (receiverError) throw new Error('Failed to create receiver transaction');

  const { data: payerTransaction, error: payerError } = await supabase
    .from('transactions')
    .insert({
      job_id: data.jobId,
      company_id: data.payerEmployerId,
      performed_by_id: data.payerEmployerId,
      user_id: userId,
      date: data.date,
      description: data.description,
      income: 0,
      expense: paymentAmount,
      note: isFullyPaid ? 'Çek Ödemesi Gideri (Tam)' : 'Çek Ödemesi Gideri (Kısmi)',
      gold_price: data.goldPrice || 0,
      gold_amount: data.goldAmount || 0,
      payment_method: 'Havale/EFT',
      currency_type: data.currencyType || 'TL',
      usd_rate: data.usdRate,
      eur_rate: data.eurRate,
      gold_rate: data.goldRate,
      parent_check_id: data.checkTransactionId,
    })
    .select()
    .single();

  if (payerError) throw new Error('Failed to create payer transaction');

  const updateData: any = {
    check_paid_amount: newPaidAmount
  };

  if (isFullyPaid) {
    updateData.check_payment_status = 'Ödendi';
  }

  const { error: updateError } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', data.checkTransactionId)
    .eq('user_id', userId);

  if (updateError) throw new Error('Failed to update check status');

  return { receiverTransaction, payerTransaction };
}
