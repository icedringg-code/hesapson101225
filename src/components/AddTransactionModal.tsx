import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getJobCompanies } from '../services/companies';
import {
  createEmployeeReceivable,
  createEmployeeIncome,
  createEmployerIncome,
  createEmployerExpense,
  createPaymentToEmployee,
  createTransferBetweenEmployers,
  getAvailableChecksForJob,
  getAvailableChecksForEmployer,
  createCheckPaymentTransfer,
  createEmployerCheckPayment,
} from '../services/transactions';
import { calculateGoldAmount, formatGoldAmount } from '../services/gold';
import { formatNumber } from '../utils/formatters';
import { CompanyWithStats } from '../types';

interface AddTransactionModalProps {
  jobId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type TransactionType = 'employee_receivable' | 'employee_income' | 'employer_income' | 'employer_expense' | 'payment_to_employee' | 'transfer_between_employers' | 'paid_with_received_check';

export default function AddTransactionModal({ jobId, onClose, onSuccess }: AddTransactionModalProps) {
  const [transactionType, setTransactionType] = useState<TransactionType>('employee_receivable');
  const [companies, setCompanies] = useState<CompanyWithStats[]>([]);
  const [employers, setEmployers] = useState<CompanyWithStats[]>([]);
  const [employees, setEmployees] = useState<CompanyWithStats[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedEmployerId, setSelectedEmployerId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [senderEmployerId, setSenderEmployerId] = useState('');
  const [receiverEmployerId, setReceiverEmployerId] = useState('');
  const [checkIssuerCompanyId, setCheckIssuerCompanyId] = useState('');
  const [payerEmployerId, setPayerEmployerId] = useState('');
  const [checkIssuerEmployerId, setCheckIssuerEmployerId] = useState('');
  const [selectedCheckTransactionId, setSelectedCheckTransactionId] = useState('');
  const [availableChecks, setAvailableChecks] = useState<any[]>([]);
  const [allChecks, setAllChecks] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currencyType, setCurrencyType] = useState('Altın');
  const [goldPrice, setGoldPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [checkDate, setCheckDate] = useState('');
  const [usdRate, setUsdRate] = useState('');
  const [eurRate, setEurRate] = useState('');
  const [goldRate, setGoldRate] = useState('');
  const [isJobPayment, setIsJobPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const showGoldFields = transactionType === 'employer_expense' || transactionType === 'employer_income' || transactionType === 'payment_to_employee' || transactionType === 'transfer_between_employers';

  useEffect(() => {
    loadCompanies();
  }, [jobId, transactionType]);

  async function loadCompanies() {
    try {
      const companiesData = await getJobCompanies(jobId);
      setCompanies(companiesData);
      setEmployers(companiesData.filter(c => c.type === 'İşveren'));
      setEmployees(companiesData.filter(c => c.type === 'Çalışan'));

      if (transactionType === 'paid_with_received_check') {
        console.log('Loading checks for job:', jobId);
        const checks = await getAvailableChecksForJob(jobId);
        console.log('Loaded checks:', checks);
        console.log('Number of checks:', checks.length);
        checks.forEach((check: any) => {
          console.log('Check:', {
            id: check.id,
            company: check.company?.name,
            performed_by: check.performed_by?.name,
            performed_by_id: check.performed_by_id,
            check_total_amount: check.check_total_amount,
            check_paid_amount: check.check_paid_amount,
            check_payment_status: check.check_payment_status,
            note: check.note
          });
        });
        setAllChecks(checks);
        setAvailableChecks(checks);
      }
    } catch (err) {
      console.error('Error loading companies:', err);
    }
  }

  useEffect(() => {
    if (transactionType === 'paid_with_received_check' && checkIssuerEmployerId) {
      console.log('Filtering checks for checkIssuerEmployerId:', checkIssuerEmployerId);
      const filteredChecks = allChecks.filter(
        check => check.check_issuer_company_id === checkIssuerEmployerId
      );
      console.log('Filtered checks:', filteredChecks.length);
      setAvailableChecks(filteredChecks);
    } else if (transactionType === 'paid_with_received_check') {
      console.log('No filter, showing all checks:', allChecks.length);
      setAvailableChecks(allChecks);
    }
  }, [checkIssuerEmployerId, allChecks, transactionType]);


  const goldPriceNum = parseFloat(goldPrice) || 0;
  const goldAmount = currencyType === 'TL'
    ? goldPriceNum
    : amount && goldPriceNum
    ? calculateGoldAmount(parseFloat(amount), goldPriceNum)
    : 0;

  const currencyLabel = currencyType === 'Altın'
    ? 'HAS Altın Gram Fiyatı (₺)'
    : currencyType === 'Dolar'
    ? 'Dolar Kuru (₺)'
    : 'Tutar (TL)';
  const currencyPlaceholder = currencyType === 'Altın'
    ? 'Altın fiyatını girin (örn: 3250.50)'
    : currencyType === 'Dolar'
    ? 'Dolar kurunu girin (örn: 34.50)'
    : 'TL tutarını girin';
  const currencyAmountLabel = currencyType === 'Altın'
    ? 'Altın Karşılığı'
    : currencyType === 'Dolar'
    ? 'Dolar Karşılığı'
    : 'TL Tutarı';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Geçerli bir tutar girin');
      return;
    }

    if (!description.trim()) {
      setError('Açıklama gereklidir');
      return;
    }

    setLoading(true);

    try {
      switch (transactionType) {
        case 'employee_receivable':
          if (!selectedCompanyId) {
            setError('Çalışan seçin');
            return;
          }
          await createEmployeeReceivable({
            jobId,
            companyId: selectedCompanyId,
            amount: amountNum,
            description: description.trim(),
            date,
            goldPrice: 0,
            goldAmount: 0,
          });
          break;

        case 'employee_income':
          if (!selectedCompanyId) {
            setError('Çalışan seçin');
            return;
          }
          await createEmployeeIncome({
            jobId,
            companyId: selectedCompanyId,
            amount: amountNum,
            description: description.trim(),
            date,
          });
          break;

        case 'employer_income':
          if (!selectedCompanyId) {
            setError('İşveren seçin');
            return;
          }
          await createEmployerIncome({
            jobId,
            companyId: selectedCompanyId,
            amount: amountNum,
            description: description.trim(),
            date,
            goldPrice: goldPriceNum,
            goldAmount: goldAmount,
            currencyType,
            usdRate: parseFloat(usdRate) || null,
            eurRate: parseFloat(eurRate) || null,
            goldRate: parseFloat(goldRate) || null,
            isJobPayment,
          });
          break;

        case 'employer_expense':
          if (!selectedCompanyId) {
            setError('İşveren seçin');
            return;
          }
          if (paymentMethod === 'Çek' && !checkIssuerCompanyId) {
            setError('Çek veren işveren seçin');
            return;
          }
          if (paymentMethod === 'Çek Ödemesi') {
            if (!selectedCheckTransactionId) {
              setError('Ödenecek çeki seçin');
              return;
            }
            const paymentAmount = parseFloat(amount);
            if (!paymentAmount || paymentAmount <= 0) {
              setError('Geçerli bir ödeme tutarı girin');
              return;
            }
            const calculatedGoldAmount = goldPriceNum > 0 && currencyType !== 'TL'
              ? calculateGoldAmount(paymentAmount, goldPriceNum)
              : currencyType === 'TL' && goldPriceNum > 0
              ? goldPriceNum
              : 0;
            await createEmployerCheckPayment({
              jobId,
              employerId: selectedCompanyId,
              checkTransactionId: selectedCheckTransactionId,
              amount: paymentAmount,
              description: description.trim(),
              date,
              goldPrice: goldPriceNum,
              goldAmount: calculatedGoldAmount,
              currencyType,
              usdRate: parseFloat(usdRate) || null,
              eurRate: parseFloat(eurRate) || null,
              goldRate: parseFloat(goldRate) || null,
            });
          } else {
            await createEmployerExpense({
              jobId,
              companyId: selectedCompanyId,
              amount: amountNum,
              description: description.trim(),
              date,
              goldPrice: goldPriceNum,
              goldAmount,
              currencyType,
              paymentMethod: paymentMethod || null,
              checkDate: paymentMethod === 'Çek' && checkDate ? checkDate : null,
              checkPaymentStatus: paymentMethod === 'Çek' ? 'Ödenmedi' : null,
              checkIssuerCompanyId: paymentMethod === 'Çek' ? checkIssuerCompanyId : null,
              usdRate: parseFloat(usdRate) || null,
              eurRate: parseFloat(eurRate) || null,
              goldRate: parseFloat(goldRate) || null,
            });
          }
          break;

        case 'payment_to_employee':
          if (!selectedEmployerId || !selectedEmployeeId) {
            setError('İşveren ve çalışan seçin');
            return;
          }
          await createPaymentToEmployee({
            jobId,
            employerId: selectedEmployerId,
            employeeId: selectedEmployeeId,
            amount: amountNum,
            description: description.trim(),
            date,
            goldPrice: goldPriceNum,
            goldAmount,
            currencyType,
            paymentMethod: paymentMethod || null,
            checkDate: paymentMethod === 'Çek' && checkDate ? checkDate : null,
            checkPaymentStatus: paymentMethod === 'Çek' ? 'Ödenmedi' : null,
            usdRate: parseFloat(usdRate) || null,
            eurRate: parseFloat(eurRate) || null,
            goldRate: parseFloat(goldRate) || null,
          });
          break;

        case 'transfer_between_employers':
          if (!senderEmployerId || !receiverEmployerId) {
            setError('Gönderen ve alıcı işveren seçin');
            return;
          }
          if (senderEmployerId === receiverEmployerId) {
            setError('Gönderen ve alıcı aynı olamaz');
            return;
          }
          await createTransferBetweenEmployers({
            jobId,
            senderEmployerId,
            receiverEmployerId,
            amount: amountNum,
            description: description.trim(),
            date,
            goldPrice: goldPriceNum,
            goldAmount,
            currencyType,
            paymentMethod: paymentMethod || null,
            checkDate: paymentMethod === 'Çek' && checkDate ? checkDate : null,
            checkPaymentStatus: paymentMethod === 'Çek' ? 'Ödenmedi' : null,
            usdRate: parseFloat(usdRate) || null,
            eurRate: parseFloat(eurRate) || null,
            goldRate: parseFloat(goldRate) || null,
          });
          break;

        case 'paid_with_received_check':
          if (!payerEmployerId || !checkIssuerEmployerId) {
            setError('Çeki veren ve ödeme yapan işveren seçin');
            return;
          }
          if (!selectedCheckTransactionId) {
            setError('Ödenecek çeki seçin');
            return;
          }
          if (payerEmployerId === checkIssuerEmployerId) {
            setError('Çeki veren ve ödeyen aynı olamaz');
            return;
          }
          const paymentAmount = parseFloat(amount);
          if (!paymentAmount || paymentAmount <= 0) {
            setError('Geçerli bir ödeme tutarı girin');
            return;
          }
          const selectedCheck = availableChecks.find(c => c.id === selectedCheckTransactionId);
          const paidAmount = selectedCheck?.check_paid_amount || 0;
          const remainingAmount = (selectedCheck?.check_total_amount || 0) - paidAmount;
          if (paymentAmount > remainingAmount) {
            setError(`Ödeme tutarı kalan tutardan (${remainingAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL) fazla olamaz`);
            return;
          }
          const calculatedGoldAmount = goldPriceNum > 0 && currencyType !== 'TL'
            ? calculateGoldAmount(paymentAmount, goldPriceNum)
            : currencyType === 'TL' && goldPriceNum > 0
            ? goldPriceNum
            : 0;
          await createCheckPaymentTransfer({
            jobId,
            payerEmployerId,
            checkIssuerEmployerId,
            checkTransactionId: selectedCheckTransactionId,
            amount: paymentAmount,
            description: description.trim(),
            date,
            goldPrice: goldPriceNum,
            goldAmount: calculatedGoldAmount,
            currencyType,
            usdRate: parseFloat(usdRate) || null,
            eurRate: parseFloat(eurRate) || null,
            goldRate: parseFloat(goldRate) || null,
          });
          break;
      }

      onSuccess();
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError('İşlem eklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  const transactionTypes = [
    { value: 'employee_receivable' as const, label: 'Çalışan Alacağı' },
    { value: 'employee_income' as const, label: 'Çalışan Geliri' },
    { value: 'employer_income' as const, label: 'İşveren Geliri' },
    { value: 'employer_expense' as const, label: 'İşveren Harcaması' },
    { value: 'payment_to_employee' as const, label: 'Çalışana Ödeme' },
    { value: 'transfer_between_employers' as const, label: 'İşverenler Arası Transfer' },
    { value: 'paid_with_received_check' as const, label: 'Çek Ödemesi (İşverenler Arası)' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">İşlem Ekle</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İşlem Tipi
            </label>
            <select
              value={transactionType}
              onChange={(e) => {
                setTransactionType(e.target.value as TransactionType);
                setSelectedCompanyId('');
                setSelectedEmployerId('');
                setSelectedEmployeeId('');
                setSenderEmployerId('');
                setReceiverEmployerId('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              {transactionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {(transactionType === 'employee_receivable' || transactionType === 'employee_income') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Çalışan
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              >
                <option value="">Çalışan seçin</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(transactionType === 'employer_income' || transactionType === 'employer_expense') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  İşveren
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                >
                  <option value="">İşveren seçin</option>
                  {employers.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              {transactionType === 'employer_expense' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ödeme Yöntemi
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={async (e) => {
                        setPaymentMethod(e.target.value);
                        if (e.target.value !== 'Çek') {
                          setCheckIssuerCompanyId('');
                          setCheckDate('');
                        }
                        if (e.target.value === 'Çek Ödemesi' && selectedCompanyId) {
                          console.log('Loading checks for employer:', selectedCompanyId);
                          const checks = await getAvailableChecksForEmployer(jobId, selectedCompanyId);
                          console.log('Employer checks:', checks);
                          setAvailableChecks(checks);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                    >
                      <option value="">Ödeme yöntemi seçin (opsiyonel)</option>
                      <option value="Nakit">Nakit</option>
                      <option value="Çek">Çek</option>
                      <option value="Çek Ödemesi">Çek Ödemesi</option>
                      <option value="Havale/EFT">Havale/EFT</option>
                      <option value="Kredi Kartı">Kredi Kartı</option>
                    </select>
                  </div>

                  {paymentMethod === 'Çek' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Çek Veren İşveren
                        </label>
                        <select
                          value={checkIssuerCompanyId}
                          onChange={(e) => setCheckIssuerCompanyId(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={loading}
                          required
                        >
                          <option value="">Çek veren işveren seçin</option>
                          {employers.filter(emp => emp.id !== selectedCompanyId).map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                          Hangi işverenden çek alındı?
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Çek Tarihi
                        </label>
                        <input
                          type="date"
                          value={checkDate}
                          onChange={(e) => setCheckDate(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={loading}
                          required
                        />
                      </div>
                    </>
                  )}

                  {paymentMethod === 'Çek Ödemesi' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ödenecek Çek
                        </label>
                        <select
                          value={selectedCheckTransactionId}
                          onChange={(e) => {
                            setSelectedCheckTransactionId(e.target.value);
                            const selected = availableChecks.find(c => c.id === e.target.value);
                            if (selected) {
                              const paidAmount = selected.check_paid_amount || 0;
                              const remainingAmount = selected.expense - paidAmount;
                              setAmount(remainingAmount.toString());
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={loading}
                          required
                        >
                          <option value="">Çek seçin</option>
                          {availableChecks.map((check) => {
                            const checkTotalAmount = check.check_total_amount || 0;
                            const paidAmount = check.check_paid_amount || 0;
                            const remainingAmount = checkTotalAmount - paidAmount;
                            return (
                              <option key={check.id} value={check.id}>
                                Çalışan: {check.company?.name} - Toplam: {checkTotalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL - Kalan: {remainingAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL - Tarih: {new Date(check.check_date).toLocaleDateString('tr-TR')}
                              </option>
                            );
                          })}
                        </select>
                        {availableChecks.length === 0 && (
                          <p className="mt-1 text-xs text-red-500">
                            Ödenmemiş çek bulunamadı
                          </p>
                        )}
                      </div>

                      {selectedCheckTransactionId && (() => {
                        const selectedCheck = availableChecks.find(c => c.id === selectedCheckTransactionId);
                        const checkTotalAmount = selectedCheck?.check_total_amount || 0;
                        const paidAmount = selectedCheck?.check_paid_amount || 0;
                        const remainingAmount = checkTotalAmount - paidAmount;
                        return (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ödeme Tutarı (TL)
                              </label>
                              <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ödeme tutarı"
                                step="0.01"
                                min="0"
                                max={remainingAmount}
                                disabled={loading}
                                required
                              />
                              <div className="mt-1 text-xs text-gray-500 space-y-1">
                                <p>Toplam Çek Tutarı: {checkTotalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</p>
                                {paidAmount > 0 && (
                                  <p>Ödenmiş: {paidAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</p>
                                )}
                                <p className="font-medium text-blue-600">Kalan: {remainingAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</p>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Para Birimi
                              </label>
                              <select
                                value={currencyType}
                                onChange={(e) => {
                                  setCurrencyType(e.target.value);
                                  setGoldPrice('');
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={loading}
                              >
                                <option value="Altın">Altın (gr)</option>
                                <option value="Dolar">Dolar (USD)</option>
                                <option value="TL">TL</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {currencyType === 'Altın' ? 'Altın Kuru (TL/gr)' : currencyType === 'Dolar' ? 'Dolar Kuru (TL/USD)' : 'TL Tutarı'}
                              </label>
                              <input
                                type="number"
                                value={goldPrice}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setGoldPrice(value);
                                  if (value && parseFloat(value) > 0) {
                                    if (currencyType === 'Altın') {
                                      setGoldRate(value);
                                    } else if (currencyType === 'Dolar') {
                                      setUsdRate(value);
                                    }
                                  }
                                }}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={currencyType === 'Altın' ? 'Örn: 3250.50' : currencyType === 'Dolar' ? 'Örn: 34.50' : 'TL tutarı'}
                                step="0.01"
                                min="0"
                                disabled={loading}
                              />
                              {goldPrice && parseFloat(goldPrice) > 0 && amount && parseFloat(amount) > 0 && currencyType !== 'TL' && (
                                <p className="mt-2 text-sm text-gray-600">
                                  {currencyType === 'Altın' && (
                                    <>
                                      <span className="font-medium">Miktar:</span> {formatNumber(parseFloat(amount) / parseFloat(goldPrice))} gr altın
                                      <br />
                                      <span className="text-xs text-gray-500">
                                        {formatNumber(parseFloat(amount) / parseFloat(goldPrice))} gr × {parseFloat(goldPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL/gr = {parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                      </span>
                                    </>
                                  )}
                                  {currencyType === 'Dolar' && (
                                    <>
                                      <span className="font-medium">Miktar:</span> {formatNumber(parseFloat(amount) / parseFloat(goldPrice))} USD
                                      <br />
                                      <span className="text-xs text-gray-500">
                                        {formatNumber(parseFloat(amount) / parseFloat(goldPrice))} USD × {parseFloat(goldPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL/USD = {parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                      </span>
                                    </>
                                  )}
                                </p>
                              )}
                              {currencyType === 'TL' && goldPrice && parseFloat(goldPrice) > 0 && (
                                <p className="mt-2 text-sm text-gray-600">
                                  <span className="font-medium">Tutar:</span> {parseFloat(goldPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                </p>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </>
                  )}
                </>
              )}
            </>
          )}

          {transactionType === 'employer_income' && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="isJobPayment"
                checked={isJobPayment}
                onChange={(e) => setIsJobPayment(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <label htmlFor="isJobPayment" className="text-sm font-medium text-gray-700 cursor-pointer">
                İşin Ödemesi Olarak İşaretle
                <span className="block text-xs text-gray-500 mt-1">
                  İşaretlenirse, bu gelir işin toplam gelirinde sayılacak
                </span>
              </label>
            </div>
          )}

          {transactionType === 'payment_to_employee' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ödeme Yapan İşveren
                </label>
                <select
                  value={selectedEmployerId}
                  onChange={(e) => setSelectedEmployerId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                >
                  <option value="">İşveren seçin</option>
                  {employers.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ödeme Alan Çalışan
                </label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                >
                  <option value="">Çalışan seçin</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ödeme Yöntemi
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                >
                  <option value="">Ödeme yöntemi seçin</option>
                  <option value="Nakit">Nakit</option>
                  <option value="Çek">Çek</option>
                  <option value="Havale/EFT">Havale/EFT</option>
                  <option value="Kredi Kartı">Kredi Kartı</option>
                </select>
              </div>

              {paymentMethod === 'Çek' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Çek Tarihi
                  </label>
                  <input
                    type="date"
                    value={checkDate}
                    onChange={(e) => setCheckDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                    required
                  />
                </div>
              )}
            </>
          )}

          {transactionType === 'transfer_between_employers' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gönderen İşveren
                </label>
                <select
                  value={senderEmployerId}
                  onChange={(e) => setSenderEmployerId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                >
                  <option value="">Gönderen işveren seçin</option>
                  {employers.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alıcı İşveren
                </label>
                <select
                  value={receiverEmployerId}
                  onChange={(e) => setReceiverEmployerId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                >
                  <option value="">Alıcı işveren seçin</option>
                  {employers.filter(emp => emp.id !== senderEmployerId).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ödeme Yöntemi
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                >
                  <option value="">Ödeme yöntemi seçin</option>
                  <option value="Nakit">Nakit</option>
                  <option value="Çek">Çek</option>
                  <option value="Havale/EFT">Havale/EFT</option>
                  <option value="Kredi Kartı">Kredi Kartı</option>
                </select>
              </div>

              {paymentMethod === 'Çek' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Çek Tarihi
                  </label>
                  <input
                    type="date"
                    value={checkDate}
                    onChange={(e) => setCheckDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                    required
                  />
                </div>
              )}
            </>
          )}

          {transactionType === 'paid_with_received_check' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Çeki Veren İşveren (Çalışana Çek Vermiş)
                </label>
                <select
                  value={checkIssuerEmployerId}
                  onChange={(e) => {
                    setCheckIssuerEmployerId(e.target.value);
                    setSelectedCheckTransactionId('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                >
                  <option value="">Çeki veren işveren seçin</option>
                  {employers.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Bu işveren çalışana çek vermiş ve başka işveren bu çeki ödeyecek
                </p>
              </div>

              {checkIssuerEmployerId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ödenecek Çek
                    </label>
                    <select
                      value={selectedCheckTransactionId}
                      onChange={(e) => {
                        setSelectedCheckTransactionId(e.target.value);
                        const selected = availableChecks.find(c => c.id === e.target.value);
                        if (selected) {
                          const checkTotalAmount = selected.check_total_amount || 0;
                          const paidAmount = selected.check_paid_amount || 0;
                          const remainingAmount = checkTotalAmount - paidAmount;
                          setAmount(remainingAmount.toString());
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                      required
                    >
                      <option value="">Çek seçin</option>
                      {availableChecks
                        .filter(check => check.check_issuer_company_id === checkIssuerEmployerId)
                        .map((check) => {
                          const checkTotalAmount = check.check_total_amount || 0;
                          const paidAmount = check.check_paid_amount || 0;
                          const remainingAmount = checkTotalAmount - paidAmount;
                          return (
                            <option key={check.id} value={check.id}>
                              Çalışan: {check.company?.name} - Toplam: {checkTotalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL - Kalan: {remainingAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL - Tarih: {new Date(check.check_date).toLocaleDateString('tr-TR')}
                            </option>
                          );
                        })}
                    </select>
                    {availableChecks.filter(check => check.check_issuer_company_id === checkIssuerEmployerId).length === 0 && (
                      <p className="mt-1 text-xs text-red-500">
                        Bu işverenin ödenmemiş çeki yok
                      </p>
                    )}
                  </div>

                  {selectedCheckTransactionId && (() => {
                    const selectedCheck = availableChecks.find(c => c.id === selectedCheckTransactionId);
                    const checkTotalAmount = selectedCheck?.check_total_amount || 0;
                    const paidAmount = selectedCheck?.check_paid_amount || 0;
                    const remainingAmount = checkTotalAmount - paidAmount;
                    return (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ödeme Tutarı (TL)
                          </label>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Ödeme tutarı"
                            step="0.01"
                            min="0"
                            max={remainingAmount}
                            disabled={loading}
                            required
                          />
                          <div className="mt-1 text-xs text-gray-500 space-y-1">
                            <p>Toplam Çek Tutarı: {checkTotalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</p>
                            {paidAmount > 0 && (
                              <p>Ödenmiş: {paidAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</p>
                            )}
                            <p className="font-medium text-blue-600">Kalan: {remainingAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Para Birimi
                          </label>
                          <select
                            value={currencyType}
                            onChange={(e) => {
                              setCurrencyType(e.target.value);
                              setGoldPrice('');
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loading}
                          >
                            <option value="Altın">Altın (gr)</option>
                            <option value="Dolar">Dolar (USD)</option>
                            <option value="TL">TL</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {currencyType === 'Altın' ? 'Altın Kuru (TL/gr)' : currencyType === 'Dolar' ? 'Dolar Kuru (TL/USD)' : 'TL Tutarı'}
                          </label>
                          <input
                            type="number"
                            value={goldPrice}
                            onChange={(e) => {
                              const value = e.target.value;
                              setGoldPrice(value);
                              if (value && parseFloat(value) > 0) {
                                if (currencyType === 'Altın') {
                                  setGoldRate(value);
                                } else if (currencyType === 'Dolar') {
                                  setUsdRate(value);
                                }
                              }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={currencyType === 'Altın' ? 'Örn: 3250.50' : currencyType === 'Dolar' ? 'Örn: 34.50' : 'TL tutarı'}
                            step="0.01"
                            min="0"
                            disabled={loading}
                          />
                          {goldPrice && parseFloat(goldPrice) > 0 && amount && parseFloat(amount) > 0 && currencyType !== 'TL' && (
                            <p className="mt-2 text-sm text-gray-600">
                              {currencyType === 'Altın' && (
                                <>
                                  <span className="font-medium">Miktar:</span> {formatNumber(parseFloat(amount) / parseFloat(goldPrice))} gr altın
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {formatNumber(parseFloat(amount) / parseFloat(goldPrice))} gr × {parseFloat(goldPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL/gr = {parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                  </span>
                                </>
                              )}
                              {currencyType === 'Dolar' && (
                                <>
                                  <span className="font-medium">Miktar:</span> {formatNumber(parseFloat(amount) / parseFloat(goldPrice))} USD
                                  <br />
                                  <span className="text-xs text-gray-500">
                                    {formatNumber(parseFloat(amount) / parseFloat(goldPrice))} USD × {parseFloat(goldPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL/USD = {parseFloat(amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                  </span>
                                </>
                              )}
                            </p>
                          )}
                          {currencyType === 'TL' && goldPrice && parseFloat(goldPrice) > 0 && (
                            <p className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Tutar:</span> {parseFloat(goldPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                            </p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ödemeyi Yapan İşveren
                </label>
                <select
                  value={payerEmployerId}
                  onChange={(e) => setPayerEmployerId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                >
                  <option value="">Ödeme yapan işveren seçin</option>
                  {employers.filter(emp => emp.id !== checkIssuerEmployerId).map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Bu işveren, yukarıda seçilen çeki ödeyecek
                </p>
              </div>
            </>
          )}

          {showGoldFields && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Para Birimi
                </label>
                <select
                  value={currencyType}
                  onChange={(e) => {
                    setCurrencyType(e.target.value);
                    setGoldPrice('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                >
                  <option value="Altın">Altın</option>
                  <option value="Dolar">Dolar</option>
                  <option value="TL">TL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currencyLabel}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={goldPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    setGoldPrice(value);

                    if (value && parseFloat(value) > 0) {
                      if (currencyType === 'Altın') {
                        setGoldRate(value);
                      } else if (currencyType === 'Dolar') {
                        setUsdRate(value);
                      }
                    }
                  }}
                  placeholder={currencyPlaceholder}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                  required
                />
                {currencyType === 'TL' ? (
                  goldPrice && parseFloat(goldPrice) > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">{currencyAmountLabel}:</span> {parseFloat(goldPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                    </p>
                  )
                ) : (
                  goldAmount > 0 && (
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">{currencyAmountLabel}:</span> {formatNumber(goldAmount)} {currencyType === 'Altın' ? 'gr' : currencyType === 'Dolar' ? 'USD' : 'TL'}
                    </p>
                  )
                )}
              </div>
            </div>
          )}

          {transactionType !== 'paid_with_received_check' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tutar (₺)
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>
          )}

          {transactionType === 'paid_with_received_check' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tutar (₺)
              </label>
              <input
                type="number"
                step="0.01"
                value={amount}
                readOnly
                placeholder="Çek seçildiğinde otomatik doldurulacak"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">
                Tutar seçilen çekin tutarı ile aynı olacaktır
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarih
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-700 mb-2">İşlem Sırasındaki Kurlar (İsteğe Bağlı)</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  USD/TRY
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={usdRate}
                  onChange={(e) => setUsdRate(e.target.value)}
                  placeholder="34.50"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  EUR/TRY
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={eurRate}
                  onChange={(e) => setEurRate(e.target.value)}
                  placeholder="37.25"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Gram Altın
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={goldRate}
                  onChange={(e) => setGoldRate(e.target.value)}
                  placeholder="3250.50"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Bu işlem tarihindeki kurları manuel olarak girerek kayıt altına alabilirsiniz. İşlem detaylarında görüntülenecektir.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="İşlem açıklaması"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={loading}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Ekleniyor...' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
