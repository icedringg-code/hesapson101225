import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, Users, Receipt, Plus, Trash2, Edit2, FileDown } from 'lucide-react';
import { Job, JobStats, CompanyWithStats, Transaction } from '../types';
import { getJob } from '../services/jobs';
import { calculateJobStats } from '../services/statistics';
import { getJobCompanies, deleteCompany } from '../services/companies';
import { getJobTransactions, deleteTransaction } from '../services/transactions';
import { formatCurrency, formatDate, formatNumber } from '../utils/formatters';
import { formatGoldAmount } from '../services/gold';
import { exportJobDetailToExcel } from '../utils/jobDetailExport';
import { supabase } from '../lib/supabase';
import AddCompanyModal from '../components/AddCompanyModal';
import AddTransactionModal from '../components/AddTransactionModal';
import EditJobModal from '../components/EditJobModal';
import EditCompanyModal from '../components/EditCompanyModal';
import EditTransactionModal from '../components/EditTransactionModal';

interface JobDetailPageProps {
  jobId: string;
  onBack: () => void;
  onCompanyClick: (companyId: string) => void;
}

type TabType = 'employers' | 'employees' | 'transactions';

export default function JobDetailPage({ jobId, onBack, onCompanyClick }: JobDetailPageProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('employers');
  const [employers, setEmployers] = useState<CompanyWithStats[]>([]);
  const [employees, setEmployees] = useState<CompanyWithStats[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [addCompanyType, setAddCompanyType] = useState<'İşveren' | 'Çalışan'>('İşveren');
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [showEditJobModal, setShowEditJobModal] = useState(false);
  const [showEditCompanyModal, setShowEditCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyWithStats | null>(null);
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    loadJobData();
  }, [jobId]);

  async function loadJobData() {
    setLoading(true);
    try {
      const [jobData, statsData, companiesData, transactionsData] = await Promise.all([
        getJob(jobId),
        calculateJobStats(jobId),
        getJobCompanies(jobId),
        getJobTransactions(jobId),
      ]);
      setJob(jobData);
      setStats(statsData);
      setEmployers(companiesData.filter(c => c.type === 'İşveren'));
      setEmployees(companiesData.filter(c => c.type === 'Çalışan'));
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading job:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCompany(companyId: string) {
    if (!confirm('Bu firmayı silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteCompany(companyId);
      loadJobData();
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Firma silinirken bir hata oluştu');
    }
  }

  async function handleDeleteTransaction(transactionId: string) {
    if (!confirm('Bu işlemi silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteTransaction(transactionId);
      loadJobData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('İşlem silinirken bir hata oluştu');
    }
  }

  function openAddCompanyModal(type: 'İşveren' | 'Çalışan') {
    setAddCompanyType(type);
    setShowAddCompanyModal(true);
  }

  function openEditCompanyModal(company: CompanyWithStats) {
    setEditingCompany(company);
    setShowEditCompanyModal(true);
  }

  function closeEditCompanyModal() {
    setEditingCompany(null);
    setShowEditCompanyModal(false);
  }

  function openEditTransactionModal(transaction: Transaction) {
    setEditingTransaction(transaction);
    setShowEditTransactionModal(true);
  }

  function closeEditTransactionModal() {
    setEditingTransaction(null);
    setShowEditTransactionModal(false);
  }

  async function toggleCheckStatus(transactionId: string, currentStatus: string | null | undefined) {
    try {
      const newStatus = currentStatus === 'Ödendi' ? 'Ödenmedi' : 'Ödendi';

      const { error } = await supabase
        .from('transactions')
        .update({ check_payment_status: newStatus })
        .eq('id', transactionId);

      if (error) throw error;

      loadJobData();
    } catch (error) {
      console.error('Error updating check status:', error);
      alert('Çek durumu güncellenirken bir hata oluştu');
    }
  }

  const checkPayments = transactions.filter(
    t => t.payment_method === 'Çek' && t.check_total_amount > 0 && t.check_date
  ).sort((a, b) => new Date(a.check_date!).getTime() - new Date(b.check_date!).getTime());

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">İş bulunamadı</p>
          <button
            onClick={onBack}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const statusColors = {
    Aktif: 'bg-green-600',
    Tamamlandı: 'bg-blue-600',
    Duraklatıldı: 'bg-yellow-600',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="hover:bg-gray-700 p-2 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold">{job.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[job.status]}`}>
                {job.status}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => exportJobDetailToExcel(job, stats, employers, employees, transactions)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                title="Excel'e Aktar"
              >
                <FileDown className="w-5 h-5" />
                <span className="hidden sm:inline">Excel'e Aktar</span>
              </button>
              <button
                onClick={() => setShowEditJobModal(true)}
                className="flex items-center gap-2 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                title="Düzenle"
              >
                <Edit2 className="w-5 h-5" />
                <span className="hidden sm:inline">Düzenle</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{job.name}</h2>
            <p className="text-gray-600">{job.description || 'Açıklama yok'}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
              <span>Başlangıç: {formatDate(job.start_date)}</span>
              {job.end_date && <span>Bitiş: {formatDate(job.end_date)}</span>}
            </div>
          </div>

          {stats && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Toplam Gelir</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalIncome)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Toplam Gider</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(stats.totalExpense)}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Net Durum</p>
                  <p className={`text-xl font-bold ${stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.netBalance)}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Çalışan Ödemeleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Toplam Alacaklar</p>
                    <p className="text-xl font-bold text-purple-600">{formatCurrency(stats.totalToBePaid)}</p>
                    <p className="text-xs text-gray-500 mt-1">Çalışanlara yapılacak toplam</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Yapılan Ödemeler</p>
                    <p className="text-xl font-bold text-teal-600">{formatCurrency(stats.totalPaid)}</p>
                    <p className="text-xs text-gray-500 mt-1">Şu ana kadar ödenen</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                    <p className="text-sm text-gray-600 mb-1">Kalan Ödemeler</p>
                    <p className={`text-xl font-bold ${stats.totalRemaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {formatCurrency(stats.totalRemaining)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.totalRemaining > 0 ? 'Ödenecek bakiye' : 'Tüm ödemeler tamamlandı'}
                    </p>
                  </div>
                </div>
              </div>

              {job.contract_amount > 0 && (
                <div className="border-t pt-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Kar/Zarar Durumu</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800">İşin Alındığı Tutar</span>
                      <span className="text-sm text-gray-600">{formatCurrency(job.contract_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800">Toplam Gider</span>
                      <span className="text-sm text-gray-600">{formatCurrency(stats.totalExpense)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold text-gray-800">Kâr</span>
                      <span className={`text-sm font-bold ${job.contract_amount - stats.totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(job.contract_amount - stats.totalExpense)}
                      </span>
                    </div>
                    <div className="relative w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                      <div
                        className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                          stats.totalExpense <= job.contract_amount * 0.7 ? 'bg-green-500' :
                          stats.totalExpense <= job.contract_amount * 0.9 ? 'bg-yellow-500' :
                          stats.totalExpense <= job.contract_amount ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((stats.totalExpense / job.contract_amount) * 100, 100)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-800">
                        Gider Oranı: {((stats.totalExpense / job.contract_amount) * 100).toFixed(1)}% |
                        Kâr Oranı: {(((job.contract_amount - stats.totalExpense) / job.contract_amount) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {employers.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">İşveren Başına Gider Durumu</h3>
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Toplam Gider:</span> {formatCurrency(stats.totalExpense)} |
                      <span className="font-semibold ml-2">İşveren Sayısı:</span> {employers.length}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      <span className="font-semibold">Her İşverene Düşen Pay:</span> {formatCurrency(stats.totalExpense / employers.length)}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                      <div className="bg-white rounded p-2">
                        <p className="text-xs text-gray-600">
                          <span className="font-semibold">Toplam Nakit/Havale Payı:</span> {formatCurrency(employers.reduce((sum, emp) => sum + (emp.cashPayments || 0), 0))}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          <span className="font-semibold">Her İşverene Düşen:</span> {formatCurrency((stats.totalExpense - employers.reduce((sum, emp) => sum + (emp.checkPayments || 0), 0)) / employers.length)}
                        </p>
                      </div>
                      <div className="bg-white rounded p-2">
                        <p className="text-xs text-gray-600">
                          <span className="font-semibold">Toplam Çek Payı:</span> {formatCurrency(employers.reduce((sum, emp) => sum + (emp.checkPayments || 0), 0))}
                        </p>
                        <p className="text-xs text-purple-600 mt-1">
                          <span className="font-semibold">Her İşverene Düşen:</span> {formatCurrency(employers.reduce((sum, emp) => sum + (emp.checkPayments || 0), 0) / employers.length)}
                        </p>
                      </div>
                      <div className="bg-white rounded p-2">
                        <p className="text-xs text-gray-600">
                          <span className="font-semibold">Toplam Ödenmemiş Çek:</span> {formatCurrency(employers.reduce((sum, emp) => sum + (emp.unpaidCheckDebt || 0), 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {employers.map((employer) => {
                      const employerIncome = employer.employerIncome || 0;
                      const employerExpense = employer.totalExpense || 0;
                      const checkPayments = employer.checkPayments || 0;
                      const cashPayments = employer.cashPayments || 0;

                      // Toplam nakit ve çek giderlerini hesapla
                      const totalCashExpense = employers.reduce((sum, emp) => sum + (emp.cashPayments || 0), 0);
                      const totalCheckExpense = employers.reduce((sum, emp) => sum + (emp.checkPayments || 0), 0);

                      // İşveren harcaması hesapla (employerExpense - (checkPayments + cashPayments))
                      const employerOwnExpense = employerExpense - checkPayments - cashPayments;

                      // Toplam işveren harcamalarını hesapla
                      const totalEmployerOwnExpense = employers.reduce((sum, emp) => {
                        const empCheckPayments = emp.checkPayments || 0;
                        const empCashPayments = emp.cashPayments || 0;
                        const empTotalExpense = emp.totalExpense || 0;
                        return sum + (empTotalExpense - empCheckPayments - empCashPayments);
                      }, 0);

                      // Düşen paylar (üstteki doğru hesaplama ile aynı)
                      const cashPerEmployerShare = (stats.totalExpense - totalCheckExpense) / employers.length;
                      const checkPerEmployerShare = totalCheckExpense / employers.length;

                      // Nakit ve çek ödemeler (Gider - Tahsilat farkı)
                      const cashPaid = Math.max(0, (cashPayments + employerOwnExpense) - employerIncome);
                      const checkPaid = checkPayments;

                      // Nakit ve çek bakiyeleri
                      const cashReceivable = (cashPayments + employerOwnExpense) - employerIncome;
                      const checkReceivable = checkPayments;
                      const totalReceivable = cashReceivable + checkReceivable;

                      // Toplam alacakları hesapla (pozitif receivable'lar)
                      const totalReceivables = employers.reduce((sum, emp) => {
                        const empCashPayments = emp.cashPayments || 0;
                        const empCheckPayments = emp.checkPayments || 0;
                        const empIncome = emp.employerIncome || 0;
                        const empTotalExpense = emp.totalExpense || 0;
                        const empReceivable = empTotalExpense - empIncome;
                        return sum + (empReceivable > 0 ? empReceivable : 0);
                      }, 0);

                      // Bu işverenin alacağının toplam alacaklar içindeki payı
                      const receivableShare = totalReceivable > 0 && totalReceivables > 0
                        ? (totalReceivable / totalReceivables) * 100
                        : 0;

                      // İşverene düşen payın ne kadarını ödediği
                      const cashPaidPercentage = cashPerEmployerShare > 0 ? (cashPaid / cashPerEmployerShare) * 100 : 0;
                      const totalCheckShare = employer.employerCheckShare || 0;
                      const checkPaidPercentage = totalCheckShare > 0 ? ((totalCheckShare - (employer.unpaidCheckDebt || 0)) / totalCheckShare) * 100 : 0;

                      return (
                        <div key={employer.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-gray-800">{employer.name}</span>
                            <div className="flex flex-col items-end">
                              <span className="text-sm text-gray-600">
                                Tahsilat: {formatCurrency(employerIncome)} / Gider: {formatCurrency(employerExpense)}
                              </span>
                              <span className={`text-sm font-bold ${totalReceivable > 0 ? 'text-green-600' : totalReceivable < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                Toplam Bakiye: {formatCurrency(Math.abs(totalReceivable))} {totalReceivable > 0 ? '(Alacaklı)' : totalReceivable < 0 ? '(Borçlu)' : '(Dengede)'}
                              </span>
                              {totalReceivable > 0 && totalReceivables > 0 && (
                                <span className="text-xs text-blue-600">
                                  Toplam Alacak İçindeki Payı: %{receivableShare.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mb-3 bg-white rounded p-3 border border-gray-200">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Nakit/Havale Durum</div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Düşen Pay:</span>
                              <span className="font-semibold">{formatCurrency(cashPerEmployerShare)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Ödenen (Gider - Tahsilat):</span>
                              <span className="font-semibold text-blue-600">{formatCurrency(cashPaid)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Ödenmesi Gereken:</span>
                              <span className="font-semibold text-orange-600">
                                {formatCurrency(Math.max(0, cashPerEmployerShare - cashPaid))}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600 mb-2">
                              <span>Bakiye:</span>
                              <span className={`font-semibold ${cashReceivable > 0 ? 'text-green-600' : cashReceivable < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                {formatCurrency(Math.abs(cashReceivable))} {cashReceivable > 0 ? '(Alacak)' : cashReceivable < 0 ? '(Fazla Ödeme)' : ''}
                              </span>
                            </div>
                            <div className="relative w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                              <div
                                className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                                  cashPaidPercentage >= 100 ? 'bg-green-500' : cashPaidPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(cashPaidPercentage, 100)}%` }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-800">
                                Nakit: %{cashPaidPercentage.toFixed(1)}
                              </div>
                            </div>
                          </div>

                          <div className="mb-2 bg-white rounded p-3 border border-gray-200">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Çek Durum</div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Toplam Çek Payı:</span>
                              <span className="font-semibold">{formatCurrency(employer.employerCheckShare || 0)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Ödenen (Çek):</span>
                              <span className="font-semibold text-purple-600">{formatCurrency(checkPaid)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Ödenmemiş Çek Borcu:</span>
                              <span className="font-semibold text-orange-600">
                                {formatCurrency(employer.unpaidCheckDebt || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600 mb-2">
                              <span>Bakiye:</span>
                              <span className={`font-semibold ${checkReceivable > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                                {formatCurrency(checkReceivable)} {checkReceivable > 0 ? '(Alacak)' : ''}
                              </span>
                            </div>
                            <div className="relative w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                              <div
                                className="absolute top-0 left-0 h-full transition-all duration-500 bg-purple-500"
                                style={{ width: `${Math.min(checkPaidPercentage, 100)}%` }}
                              />
                              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-800">
                                Çek: %{checkPaidPercentage.toFixed(1)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('employers')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                  activeTab === 'employers'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <Building2 className="w-5 h-5" />
                İşverenler
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                  activeTab === 'employees'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <Users className="w-5 h-5" />
                Çalışanlar
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                  activeTab === 'transactions'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                <Receipt className="w-5 h-5" />
                İşlemler
              </button>
            </nav>
          </div>

          {checkPayments.length > 0 && (
            <div className="border-t p-6 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Çek Ödemeleri</h3>
              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Çek Tarihi</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">İşveren</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Çek Verilen Çalışan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Açıklama</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Para Birimi</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Tutar</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Ödenen</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Kalan</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {checkPayments.map((payment) => {
                      const checkTotalAmount = payment.check_total_amount || 0;
                      const checkPaidAmount = payment.check_paid_amount || 0;
                      const remainingAmount = checkTotalAmount - checkPaidAmount;
                      return (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            {formatDate(payment.check_date!)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {payment.performed_by?.name || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {payment.company?.name || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800">
                            {payment.description}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {payment.gold_amount && payment.gold_amount !== 0 ? (
                              <div>
                                <span className={payment.currency_type === 'Dolar' ? 'text-emerald-600 font-medium' : payment.currency_type === 'TL' ? 'text-purple-600 font-medium' : 'text-yellow-600 font-medium'}>
                                  {formatNumber(Math.abs(payment.gold_amount))} {payment.currency_type === 'Altın' ? 'gr' : payment.currency_type === 'Dolar' ? 'USD' : 'TL'}
                                </span>
                                {(payment.usd_rate || payment.eur_rate || payment.gold_rate) && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {payment.gold_rate && <div>Altın: {formatCurrency(payment.gold_rate)}</div>}
                                    {payment.usd_rate && <div>USD: {formatNumber(payment.usd_rate)}</div>}
                                    {payment.eur_rate && <div>EUR: {formatNumber(payment.eur_rate)}</div>}
                                  </div>
                                )}
                              </div>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                            {formatCurrency(checkTotalAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                            {formatCurrency(checkPaidAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-red-600">
                            {formatCurrency(remainingAmount)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                              payment.check_payment_status === 'Ödendi'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {payment.check_payment_status || 'Ödenmedi'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">
                        Toplam Çek Tutarı:
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                        {formatCurrency(checkPayments.reduce((sum, p) => sum + (p.check_total_amount || 0), 0))}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                        {formatCurrency(checkPayments.reduce((sum, p) => sum + (p.check_paid_amount || 0), 0))}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-red-600">
                        {formatCurrency(checkPayments.reduce((sum, p) => {
                          const total = p.check_total_amount || 0;
                          const paid = p.check_paid_amount || 0;
                          return sum + (total - paid);
                        }, 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          <div className="p-6">
            {activeTab === 'employers' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">İşverenler</h3>
                  <button
                    onClick={() => openAddCompanyModal('İşveren')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    İşveren Ekle
                  </button>
                </div>
                {employers.length > 0 ? (
                  <div className="space-y-4">
                    {employers.map((employer) => (
                      <div
                        key={employer.id}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => onCompanyClick(employer.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 text-lg">{employer.name}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-3">
                              <div>
                                <p className="text-xs text-gray-500">Gelir</p>
                                <p className="text-sm font-medium text-green-600">
                                  {formatCurrency(employer.employerIncome || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Gider</p>
                                <p className="text-sm font-medium text-red-600">
                                  {formatCurrency(employer.employerExpense || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Ödenmemiş Çek</p>
                                <p className="text-sm font-medium text-orange-600">
                                  {formatCurrency(employer.unpaidCheckDebt || 0)}
                                </p>
                              </div>
                              {(employer.goldBalance !== 0 || employer.usdBalance !== 0 || employer.tlBalance !== 0) && (
                                <div>
                                  <p className="text-xs text-gray-500">Para Birimi</p>
                                  <div className="flex flex-col gap-1">
                                    {employer.goldBalance !== 0 && (
                                      <p className="text-sm font-medium text-yellow-600">
                                        {formatNumber(employer.goldBalance || 0)} gr
                                      </p>
                                    )}
                                    {employer.usdBalance !== 0 && (
                                      <p className="text-sm font-medium text-emerald-600">
                                        {formatNumber(employer.usdBalance || 0)} USD
                                      </p>
                                    )}
                                    {employer.tlBalance !== 0 && (
                                      <p className="text-sm font-medium text-purple-600">
                                        {formatCurrency(employer.tlBalance || 0)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-gray-500">Durum</p>
                                <p className="text-sm font-medium text-blue-600">
                                  {employer.status}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditCompanyModal(employer);
                              }}
                              className="text-blue-500 hover:text-blue-700 p-2 transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCompany(employer.id);
                              }}
                              className="text-red-500 hover:text-red-700 p-2 transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Henüz işveren eklenmemiş. Yukarıdaki butona tıklayarak işveren ekleyin.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'employees' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Çalışanlar</h3>
                  <button
                    onClick={() => openAddCompanyModal('Çalışan')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Çalışan Ekle
                  </button>
                </div>
                {employees.length > 0 ? (
                  <div className="space-y-4">
                    {employees.map((employee) => (
                      <div
                        key={employee.id}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => onCompanyClick(employee.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 text-lg">{employee.name}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mt-3">
                              <div>
                                <p className="text-xs text-gray-500">Toplam Alacak</p>
                                <p className="text-sm font-medium text-orange-600">
                                  {formatCurrency(employee.totalReceivable || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Yapılan Ödeme</p>
                                <p className="text-sm font-medium text-green-600">
                                  {formatCurrency(employee.paymentsMade || 0)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Kalan Alacak</p>
                                <p className="text-sm font-medium text-red-600">
                                  {formatCurrency(employee.receivable || 0)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditCompanyModal(employee);
                              }}
                              className="text-blue-500 hover:text-blue-700 p-2 transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCompany(employee.id);
                              }}
                              className="text-red-500 hover:text-red-700 p-2 transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Henüz çalışan eklenmemiş. Yukarıdaki butona tıklayarak çalışan ekleyin.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'transactions' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">İşlemler</h3>
                  <button
                    onClick={() => setShowAddTransactionModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    İşlem Ekle
                  </button>
                </div>
                {transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Tarih</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">İşlem Yapan</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">İşlem Yapılan</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Açıklama</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Tip</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Gelir</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Gider</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Yapılacak Ödeme</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Para Birimi</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {transactions.map((transaction) => {
                          // Calculate unpaid amount for employees with "Alacak" note
                          const isEmployeeReceivable = transaction.company?.type === 'Çalışan' && transaction.note === 'Alacak';
                          const paidAmount = isEmployeeReceivable
                            ? transactions
                                .filter(t =>
                                  t.company_id === transaction.company_id &&
                                  t.note === 'Ödeme Yapıldı' &&
                                  new Date(t.date) >= new Date(transaction.date)
                                )
                                .reduce((sum, t) => sum + t.expense, 0)
                            : 0;
                          const unpaidAmount = isEmployeeReceivable ? Math.max(0, transaction.expense - paidAmount) : 0;

                          return (
                            <tr key={transaction.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {formatDate(transaction.date)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {transaction.performed_by?.name || '-'}
                                {transaction.performed_by?.type && (
                                  <span className="block text-xs font-medium text-green-600">{transaction.performed_by.type}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-700">
                                {transaction.company?.name || '-'}
                                {transaction.company?.type && (
                                  <span className="block text-xs font-medium text-blue-600">{transaction.company.type}</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-800">
                                {transaction.description}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1">
                                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                    {transaction.note}
                                  </span>
                                  {transaction.note === 'Gelir' && transaction.is_job_payment && (
                                    <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                      İşin Ödemesi
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                                {transaction.income > 0 ? formatCurrency(transaction.income) : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                                {transaction.expense > 0 ? formatCurrency(transaction.expense) : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium">
                                {isEmployeeReceivable ? (
                                  <span className={unpaidAmount > 0 ? 'text-orange-600 font-bold' : 'text-gray-400'}>
                                    {unpaidAmount > 0 ? formatCurrency(unpaidAmount) : 'Ödendi'}
                                  </span>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium">
                                {transaction.gold_amount && transaction.gold_amount !== 0 ? (
                                  <div>
                                    <span className={transaction.currency_type === 'Dolar' ? 'text-emerald-600' : transaction.currency_type === 'TL' ? 'text-purple-600' : 'text-yellow-600'}>
                                      {formatNumber(Math.abs(transaction.gold_amount))} {transaction.currency_type === 'Altın' ? 'gr' : transaction.currency_type === 'Dolar' ? 'USD' : 'TL'}
                                    </span>
                                    {(transaction.usd_rate || transaction.eur_rate || transaction.gold_rate) && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        <div className="font-semibold">İşlem Kurları:</div>
                                        {transaction.usd_rate && <div>USD: {formatNumber(transaction.usd_rate)}</div>}
                                        {transaction.eur_rate && <div>EUR: {formatNumber(transaction.eur_rate)}</div>}
                                        {transaction.gold_rate && <div>Altın: {formatCurrency(transaction.gold_rate)}</div>}
                                      </div>
                                    )}
                                  </div>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => openEditTransactionModal(transaction)}
                                    className="text-blue-500 hover:text-blue-700 p-1 transition-colors"
                                    title="Düzenle"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTransaction(transaction.id)}
                                    className="text-red-500 hover:text-red-700 p-1 transition-colors"
                                    title="Sil"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Henüz işlem eklenmemiş. Yukarıdaki butona tıklayarak işlem ekleyin.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {showAddCompanyModal && (
        <AddCompanyModal
          jobId={jobId}
          type={addCompanyType}
          onClose={() => setShowAddCompanyModal(false)}
          onSuccess={() => {
            setShowAddCompanyModal(false);
            loadJobData();
          }}
        />
      )}

      {showAddTransactionModal && (
        <AddTransactionModal
          jobId={jobId}
          onClose={() => setShowAddTransactionModal(false)}
          onSuccess={() => {
            setShowAddTransactionModal(false);
            loadJobData();
          }}
        />
      )}

      {showEditJobModal && job && (
        <EditJobModal
          job={job}
          onClose={() => setShowEditJobModal(false)}
          onSuccess={() => {
            setShowEditJobModal(false);
            loadJobData();
          }}
        />
      )}

      {showEditCompanyModal && editingCompany && (
        <EditCompanyModal
          company={editingCompany}
          onClose={closeEditCompanyModal}
          onSuccess={() => {
            closeEditCompanyModal();
            loadJobData();
          }}
        />
      )}

      {showEditTransactionModal && editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          jobId={jobId}
          onClose={closeEditTransactionModal}
          onSuccess={() => {
            closeEditTransactionModal();
            loadJobData();
          }}
        />
      )}
    </div>
  );
}
