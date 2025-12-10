import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { updateTransaction } from '../services/transactions';
import { getJobCompanies } from '../services/companies';
import { calculateGoldAmount, formatGoldAmount } from '../services/gold';
import { Transaction, Company } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface EditTransactionModalProps {
  transaction: Transaction;
  jobId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditTransactionModal({ transaction, jobId, onClose, onSuccess }: EditTransactionModalProps) {
  const getTypeFromNote = (note: string) => {
    if (note === 'Gelir') return 'İşverenden Tahsilat';
    if (note === 'İşveren Harcaması') return 'İşveren Harcaması';
    if (note === 'Ödeme Alındı' || note === 'Ödeme Yapıldı') return 'Çalışana Ödeme';
    if (note === 'Transfer Alındı' || note === 'Transfer Yapıldı') return 'İşverenler Arası Transfer';
    if (note === 'Alacak') return 'Çalışandan Alınan Avans';
    return 'Diğer Gider';
  };

  const [type, setType] = useState(transaction.type || getTypeFromNote(transaction.note));
  const [amount, setAmount] = useState((transaction.income || transaction.expense).toString());
  const [description, setDescription] = useState(transaction.description || '');
  const [date, setDate] = useState(transaction.date);
  const [companyId, setCompanyId] = useState(transaction.company_id || '');
  const [currencyType, setCurrencyType] = useState(transaction.currency_type || 'Altın');
  const [goldPrice, setGoldPrice] = useState((transaction.gold_price || 0).toString());
  const [paymentMethod, setPaymentMethod] = useState(transaction.payment_method || '');
  const [checkDate, setCheckDate] = useState(transaction.check_date || '');
  const [checkPaymentStatus, setCheckPaymentStatus] = useState(transaction.check_payment_status || 'Ödenmedi');
  const [usdRate, setUsdRate] = useState((transaction.usd_rate || 0).toString());
  const [eurRate, setEurRate] = useState((transaction.eur_rate || 0).toString());
  const [goldRate, setGoldRate] = useState((transaction.gold_rate || 0).toString());
  const [isJobPayment, setIsJobPayment] = useState(transaction.is_job_payment || false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isCheckTransaction = transaction.payment_method === 'Çek' &&
                             transaction.check_total_amount &&
                             transaction.check_total_amount > 0;
  const checkPaidAmount = transaction.check_paid_amount || 0;

  const showGoldFields = type === 'İşveren Harcaması' || type === 'İşverenden Tahsilat' || type === 'Çalışana Ödeme' || type === 'İşverenler Arası Transfer';

  useEffect(() => {
    loadCompanies();
  }, [jobId, type]);

  async function loadCompanies() {
    try {
      const allCompanies = await getJobCompanies(jobId);
      const filtered = allCompanies.filter((c) => {
        if (type === 'İşveren Harcaması' || type === 'İşverenden Tahsilat' || type === 'İşverenler Arası Transfer') {
          return c.type === 'İşveren';
        } else if (type === 'Çalışana Ödeme' || type === 'Çalışandan Alınan Avans') {
          return c.type === 'Çalışan';
        }
        return false;
      });
      setCompanies(filtered);
    } catch (error) {
      console.error('Error loading companies:', error);
    }
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Geçerli bir tutar girin');
      return;
    }

    if (!date) {
      setError('Tarih gerekli');
      return;
    }

    if (!companyId && (type === 'İşveren Harcaması' || type === 'İşverenden Tahsilat' ||
        type === 'Çalışana Ödeme' || type === 'Çalışandan Alınan Avans')) {
      setError('Firma seçimi gerekli');
      return;
    }

    setLoading(true);
    try {
      let calculatedGoldAmount = 0;
      if (showGoldFields) {
        if (type === 'İşverenden Tahsilat') {
          calculatedGoldAmount = -goldAmount;
        } else {
          calculatedGoldAmount = goldAmount;
        }
      }

      await updateTransaction(transaction.id, {
        type,
        amount: amountNum,
        description: description.trim(),
        date,
        companyId: companyId || undefined,
        goldPrice: showGoldFields ? goldPriceNum : 0,
        goldAmount: calculatedGoldAmount,
        currencyType: showGoldFields ? currencyType : null,
        paymentMethod: type === 'Çalışana Ödeme' ? (paymentMethod || null) : null,
        checkDate: type === 'Çalışana Ödeme' && paymentMethod === 'Çek' && checkDate ? checkDate : null,
        checkPaymentStatus: type === 'Çalışana Ödeme' && paymentMethod === 'Çek' ? checkPaymentStatus : null,
        usdRate: parseFloat(usdRate) || null,
        eurRate: parseFloat(eurRate) || null,
        goldRate: parseFloat(goldRate) || null,
        isJobPayment: type === 'İşverenden Tahsilat' ? isJobPayment : undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const transactionTypes = [
    'İşveren Harcaması',
    'İşverenden Tahsilat',
    'Çalışana Ödeme',
    'İşverenler Arası Transfer',
    'Çalışandan Alınan Avans',
    'Diğer Gider',
  ];

  const requiresCompany = ['İşveren Harcaması', 'İşverenden Tahsilat', 'Çalışana Ödeme', 'İşverenler Arası Transfer', 'Çalışandan Alınan Avans'].includes(type);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b bg-blue-600 text-white rounded-t-xl sticky top-0">
          <h2 className="text-xl font-bold">İşlemi Düzenle</h2>
          <button
            onClick={onClose}
            className="hover:bg-blue-700 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isCheckTransaction && checkPaidAmount > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm">
              <p className="font-medium mb-1">Çek Ödeme Bilgisi</p>
              <p>Bu çek için toplam {formatCurrency(checkPaidAmount)} ödeme yapılmıştır.</p>
              <p className="text-xs mt-1 text-blue-600">
                Çek tutarını {formatCurrency(checkPaidAmount)} tutarının altına düşüremezsiniz.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İşlem Tipi *
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setCompanyId('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {transactionTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {requiresCompany && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {type === 'İşveren Harcaması' || type === 'İşverenden Tahsilat' || type === 'İşverenler Arası Transfer' ? 'İşveren' : 'Çalışan'} *
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seçiniz...</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {type === 'İşverenden Tahsilat' && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                id="isJobPayment"
                checked={isJobPayment}
                onChange={(e) => setIsJobPayment(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <label htmlFor="isJobPayment" className="text-sm font-medium text-gray-700 cursor-pointer">
                Bu işin ödemesi olarak işaretle
                <span className="block text-xs text-gray-500 mt-1">
                  İşaretlenirse, bu gelir işin toplam gelirinde sayılacak
                </span>
              </label>
            </div>
          )}

          {(type === 'Çalışana Ödeme' || type === 'İşverenler Arası Transfer') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ödeme Yöntemi
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="">Ödeme yöntemi seçin</option>
                  <option value="Nakit">Nakit</option>
                  <option value="Çek">Çek</option>
                  <option value="Havale/EFT">Havale/EFT</option>
                  <option value="Kredi Kartı">Kredi Kartı</option>
                </select>
              </div>

              {paymentMethod === 'Çek' && (
                <>
                  {transaction.check_paid_amount > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm">
                      <strong>Dikkat:</strong> Bu çek için {formatCurrency(transaction.check_paid_amount)} ödeme yapılmış.
                      Çek tutarı ödenen tutardan az olamaz.
                      {transaction.check_total_amount > transaction.check_paid_amount && (
                        <> Kalan tutar: {formatCurrency(transaction.check_total_amount - transaction.check_paid_amount)}</>
                      )}
                    </div>
                  )}
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
                    />
                  </div>
                </>
              )}
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tutar *
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarih *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Açıklama
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="İşlem açıklaması (opsiyonel)"
            />
          </div>

          {((type === 'Çalışana Ödeme' || type === 'İşveren Harcaması' || type === 'İşverenler Arası Transfer') && paymentMethod === 'Çek') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Çek Ödeme Durumu
              </label>
              <select
                value={checkPaymentStatus}
                onChange={(e) => setCheckPaymentStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading || (isCheckTransaction && checkPaidAmount > 0)}
              >
                <option value="Ödenmedi">Ödenmedi</option>
                <option value="Ödendi">Ödendi</option>
              </select>
              {isCheckTransaction && checkPaidAmount > 0 && (
                <p className="text-xs text-gray-600 mt-2">
                  Ödeme durumu otomatik olarak yönetilmektedir.
                </p>
              )}
            </div>
          )}

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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
