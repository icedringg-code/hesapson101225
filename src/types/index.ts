export interface Job {
  id: string;
  user_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string | null;
  status: 'Aktif' | 'Tamamlandı' | 'Duraklatıldı';
  contract_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  job_id: string;
  user_id: string;
  name: string;
  type: 'İşveren' | 'Çalışan';
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  job_id: string;
  company_id: string;
  performed_by_id: string | null;
  user_id: string;
  date: string;
  description: string;
  income: number;
  expense: number;
  note: string;
  gold_price: number;
  gold_amount: number;
  currency_type?: string | null;
  payment_method?: string | null;
  check_date?: string | null;
  check_payment_status?: string | null;
  check_issuer_company_id?: string | null;
  check_total_amount?: number;
  check_paid_amount?: number;
  parent_check_id?: string | null;
  usd_rate?: number | null;
  eur_rate?: number | null;
  gold_rate?: number | null;
  is_job_payment?: boolean;
  type?: string;
  company?: Company;
  performed_by?: Company;
  check_issuer?: Company;
  created_at: string;
  updated_at: string;
}

export interface JobStats {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  totalToBePaid: number;
  totalPaid: number;
  totalRemaining: number;
}

export interface CompanyWithStats extends Company {
  totalReceivable?: number;
  paymentsMade?: number;
  employerIncome?: number;
  employerExpense?: number;
  totalExpense?: number;
  receivable?: number;
  status?: string;
  goldBalance?: number;
  usdBalance?: number;
  tlBalance?: number;
  checkPayments?: number;
  cashPayments?: number;
  unpaidCheckDebt?: number;
  employerCheckShare?: number;
}

export interface OverallStats {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  pausedJobs: number;
  totalToBePaid: number;
  totalPaid: number;
  totalRemaining: number;
}
