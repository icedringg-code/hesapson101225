import { useEffect, useState } from 'react';
import { ArrowLeft, Edit2, Trash2, Plus } from 'lucide-react';
import { Company, Transaction } from '../types';
import { getCompany, updateCompany, deleteCompany } from '../services/companies';
import { getCompanyTransactions, deleteTransaction } from '../services/transactions';
import { formatCurrency, formatDate, formatNumber } from '../utils/formatters';
import { formatGoldAmount } from '../services/gold';
import AddTransactionModal from '../components/AddTransactionModal';
import EditTransactionModal from '../components/EditTransactionModal';

interface CompanyDetailPageProps {
  companyId: string;
  jobId: string;
  onBack: () => void;
}

export default function CompanyDetailPage({ companyId, jobId, onBack }: CompanyDetailPageProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false);
  const [showEditTransactionModal, setShowEditTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    goldBalance: 0,
    usdBalance: 0,
    tlBalance: 0,
  });

  useEffect(() => {
    loadCompanyData();
  }, [companyId]);

  async function loadCompanyData() {
    setLoading(true);
    try {
      const [companyData, transactionsData] = await Promise.all([
        getCompany(companyId),
        getCompanyTransactions(companyId),
      ]);

      setCompany(companyData);
      setTransactions(transactionsData);
      setEditName(companyData?.name || '');

      let totalIncome = 0;
      let totalExpense = 0;

      if (companyData?.type === 'Çalışan') {
        totalIncome = transactionsData
          .filter(t => t.company_id === companyId && t.note === 'Alacak')
          .reduce((sum, t) => sum + Number(t.income), 0);

        const cashPayments = transactionsData
          .filter(t => t.company_id === companyId && t.note === 'Ödeme Alındı')
          .reduce((sum, t) => sum + Number(t.income), 0);

        const checkPayments = transactionsData
          .filter(t => t.company_id === companyId && t.note === 'Çalışana Çek Verildi (Ödenmedi)')
          .reduce((sum, t) => sum + Number(t.check_paid_amount || 0), 0);

        const employeeIncome = transactionsData
          .filter(t => t.company_id === companyId && t.note === 'Çalışan Geliri')
          .reduce((sum, t) => sum + Number(t.expense), 0);

        totalExpense = cashPayments + checkPayments + employeeIncome;
      } else {
        totalIncome = transactionsData
          .filter(t => t.company_id === companyId && (t.note === 'Gelir' || t.note === 'Transfer Alındı' || t.note?.includes('Çek Ödemesi Geliri')))
          .reduce((sum, t) => sum + Number(t.income), 0);

        const cashExpenses = transactionsData
          .filter(t => t.performed_by_id === companyId && (t.note === 'İşveren Harcaması' || t.note === 'Ödeme Yapıldı' || t.note === 'Transfer Yapıldı'))
          .reduce((sum, t) => sum + Number(t.expense), 0);

        const checkExpenses = transactionsData
          .filter(t => t.performed_by_id === companyId && t.note === 'Çalışana Çek Verildi (Ödenmedi)')
          .reduce((sum, t) => sum + Number(t.check_total_amount || 0), 0);

        const ownCheckPayments = transactionsData
          .filter(t => t.performed_by_id === companyId && (
            t.note === 'Çek Ödemesi (Tam)' || t.note === 'Çek Ödemesi (Kısmi)'
          ))
          .reduce((sum, t) => sum + Number(t.expense), 0);

        const checkPaymentExpenses = transactionsData
          .filter(t => t.performed_by_id === companyId && t.note?.includes('Çek Ödemesi Gideri'))
          .reduce((sum, t) => sum + Number(t.expense), 0);

        totalExpense = cashExpenses + checkExpenses + ownCheckPayments + checkPaymentExpenses;
      }

      const goldBalance = transactionsData
        .filter(t => t.payment_method !== 'Çek' && t.currency_type === 'Altın')
        .reduce((sum, t) => {
          if (t.performed_by_id === companyId) {
            if (t.note === 'Gelir') {
              return sum + Number(t.gold_amount || 0);
            }
            if (t.note === 'İşveren Harcaması' || t.note === 'Ödeme Yapıldı' || t.note === 'Transfer Yapıldı' ||
                t.note === 'Çek Ödemesi (Tam)' || t.note === 'Çek Ödemesi (Kısmi)' || t.note?.includes('Çek Ödemesi Gideri')) {
              return sum - Number(t.gold_amount || 0);
            }
          }
          if (t.company_id === companyId && (t.note === 'Transfer Alındı' || t.note?.includes('Çek Ödemesi Geliri'))) {
            return sum + Number(t.gold_amount || 0);
          }
          return sum;
        }, 0);

      const usdBalance = transactionsData
        .filter(t => t.payment_method !== 'Çek' && t.currency_type === 'Dolar')
        .reduce((sum, t) => {
          if (t.performed_by_id === companyId) {
            if (t.note === 'Gelir') {
              return sum + Number(t.gold_amount || 0);
            }
            if (t.note === 'İşveren Harcaması' || t.note === 'Ödeme Yapıldı' || t.note === 'Transfer Yapıldı' ||
                t.note === 'Çek Ödemesi (Tam)' || t.note === 'Çek Ödemesi (Kısmi)' || t.note?.includes('Çek Ödemesi Gideri')) {
              return sum - Number(t.gold_amount || 0);
            }
          }
          if (t.company_id === companyId && (t.note === 'Transfer Alındı' || t.note?.includes('Çek Ödemesi Geliri'))) {
            return sum + Number(t.gold_amount || 0);
          }
          return sum;
        }, 0);

      const tlBalance = transactionsData
        .filter(t => t.payment_method !== 'Çek' && t.currency_type === 'TL')
        .reduce((sum, t) => {
          if (t.performed_by_id === companyId) {
            if (t.note === 'Gelir') {
              return sum + Number(t.gold_amount || 0);
            }
            if (t.note === 'İşveren Harcaması' || t.note === 'Ödeme Yapıldı' || t.note === 'Transfer Yapıldı' ||
                t.note === 'Çek Ödemesi (Tam)' || t.note === 'Çek Ödemesi (Kısmi)' || t.note?.includes('Çek Ödemesi Gideri')) {
              return sum - Number(t.gold_amount || 0);
            }
          }
          if (t.company_id === companyId && (t.note === 'Transfer Alındı' || t.note?.includes('Çek Ödemesi Geliri'))) {
            return sum + Number(t.gold_amount || 0);
          }
          return sum;
        }, 0);

      setStats({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        goldBalance,
        usdBalance,
        tlBalance,
      });
    } catch (error) {
      console.error('Error loading company:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveEdit() {
    if (!company || !editName.trim()) return;

    try {
      await updateCompany(companyId, { name: editName.trim() });
      setIsEditing(false);
      loadCompanyData();
    } catch (error) {
      console.error('Error updating company:', error);
      alert('Firma güncellenirken bir hata oluştu');
    }
  }

  async function handleDelete() {
    if (!confirm('Bu firmayı silmek istediğinizden emin misiniz? Tüm işlemler de silinecektir.')) return;

    try {
      await deleteCompany(companyId);
      onBack();
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Firma silinirken bir hata oluştu');
    }
  }

  async function handleDeleteTransaction(transactionId: string) {
    if (!confirm('Bu işlemi silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteTransaction(transactionId);
      loadCompanyData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('İşlem silinirken bir hata oluştu');
    }
  }

  function openEditTransactionModal(transaction: Transaction) {
    setEditingTransaction(transaction);
    setShowEditTransactionModal(true);
  }

  function closeEditTransactionModal() {
    setEditingTransaction(null);
    setShowEditTransactionModal(false);
  }

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

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Firma bulunamadı</p>
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

  const typeColors = {
    'İşveren': 'bg-blue-600',
    'Çalışan': 'bg-green-600',
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
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-xl font-bold bg-gray-700 px-3 py-1 rounded"
                  autoFocus
                />
              ) : (
                <h1 className="text-xl font-bold">{company.name}</h1>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeColors[company.type]}`}>
                {company.type}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    Kaydet
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400"
                    title="Sil"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">
                {company.type === 'Çalışan' ? 'Toplam Alacağı' : 'Toplam Gelir'}
              </p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalIncome)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">
                {company.type === 'Çalışan' ? 'Toplam Aldığı' : 'Toplam Gider'}
              </p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalExpense)}</p>
            </div>
            {company.type === 'İşveren' && stats.goldBalance !== 0 && (
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Altın Bakiyesi</p>
                <p className="text-2xl font-bold text-yellow-600">{formatNumber(stats.goldBalance)} gr</p>
              </div>
            )}
            {company.type === 'İşveren' && stats.usdBalance !== 0 && (
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">Dolar Bakiyesi</p>
                <p className="text-2xl font-bold text-emerald-600">{formatNumber(stats.usdBalance)} USD</p>
              </div>
            )}
            {company.type === 'İşveren' && stats.tlBalance !== 0 && (
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-1">TL Bakiyesi</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.tlBalance)}</p>
              </div>
            )}
            <div className={`${stats.balance >= 0 ? 'bg-orange-50' : 'bg-red-50'} rounded-lg p-4 text-center`}>
              <p className="text-sm text-gray-600 mb-1">Bakiye</p>
              <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                {formatCurrency(stats.balance)}
              </p>
            </div>
          </div>
        </div>

        {company.type === 'İşveren' && transactions.some(t => t.payment_method === 'Çek' && t.check_total_amount > 0) && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Çek Ödemeleri</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Çek Tarihi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">İşlem Tarihi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">İşlem Türü</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Çalışan/İşveren</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Çek Veren</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Açıklama</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Para Birimi</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Tutar</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Ödenen</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Kalan</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions
                    .filter(t => t.payment_method === 'Çek' && t.check_total_amount > 0 && t.check_date)
                    .sort((a, b) => new Date(a.check_date!).getTime() - new Date(b.check_date!).getTime())
                    .map((transaction) => {
                      const checkTotalAmount = transaction.check_total_amount || 0;
                      const checkPaidAmount = transaction.check_paid_amount || 0;
                      const remainingAmount = checkTotalAmount - checkPaidAmount;
                      return (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            {formatDate(transaction.check_date!)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {transaction.note}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {transaction.company?.name || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {transaction.check_issuer?.name ? (
                              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                {transaction.check_issuer.name}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800">
                            {transaction.description}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {transaction.gold_amount && transaction.gold_amount !== 0 ? (
                              <div>
                                <span className={transaction.currency_type === 'Dolar' ? 'text-emerald-600 font-medium' : transaction.currency_type === 'TL' ? 'text-purple-600 font-medium' : 'text-yellow-600 font-medium'}>
                                  {formatNumber(Math.abs(transaction.gold_amount))} {transaction.currency_type === 'Altın' ? 'gr' : transaction.currency_type === 'Dolar' ? 'USD' : 'TL'}
                                </span>
                                {(transaction.usd_rate || transaction.eur_rate || transaction.gold_rate) && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {transaction.gold_rate && <div>Altın: {formatCurrency(transaction.gold_rate)}</div>}
                                    {transaction.usd_rate && <div>USD: {formatNumber(transaction.usd_rate)}</div>}
                                    {transaction.eur_rate && <div>EUR: {formatNumber(transaction.eur_rate)}</div>}
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
                              transaction.check_payment_status === 'Ödendi'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {transaction.check_payment_status || 'Ödenmedi'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={7} className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">
                      Toplam Çek Tutarı:
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                      {formatCurrency(
                        transactions
                          .filter(t => t.payment_method === 'Çek' && t.check_total_amount > 0)
                          .reduce((sum, t) => sum + (t.check_total_amount || 0), 0)
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                      {formatCurrency(
                        transactions
                          .filter(t => t.payment_method === 'Çek' && t.check_total_amount > 0)
                          .reduce((sum, t) => sum + (t.check_paid_amount || 0), 0)
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-red-600">
                      {formatCurrency(
                        transactions
                          .filter(t => t.payment_method === 'Çek' && t.check_total_amount > 0)
                          .reduce((sum, t) => {
                            const total = t.check_total_amount || 0;
                            const paid = t.check_paid_amount || 0;
                            return sum + (total - paid);
                          }, 0)
                      )}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">İşlemler</h2>
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
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Para Birimi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Ödeme</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
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
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {transaction.note}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                        {transaction.income > 0 ? formatCurrency(transaction.income) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                        {transaction.expense > 0 ? formatCurrency(transaction.expense) : '-'}
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
                      <td className="px-4 py-3 text-sm">
                        {transaction.payment_method && (
                          <div>
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                              {transaction.payment_method}
                            </span>
                            {transaction.payment_method === 'Çek' && transaction.check_date && (
                              <div className="text-xs text-gray-600 mt-1">
                                Çek: {formatDate(transaction.check_date)}
                              </div>
                            )}
                          </div>
                        )}
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
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Henüz işlem eklenmemiş. Yukarıdaki butona tıklayarak işlem ekleyin.
            </div>
          )}
        </div>
      </main>

      {showAddTransactionModal && (
        <AddTransactionModal
          jobId={jobId}
          onClose={() => setShowAddTransactionModal(false)}
          onSuccess={() => {
            setShowAddTransactionModal(false);
            loadCompanyData();
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
            loadCompanyData();
          }}
        />
      )}
    </div>
  );
}
