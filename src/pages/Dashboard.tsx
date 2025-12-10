import { useEffect, useState, useRef } from 'react';
import { Plus, Briefcase, LogOut, TrendingUp, TrendingDown, DollarSign, FileDown, FileUp, RefreshCw } from 'lucide-react';
import { signOut } from '../lib/auth';
import { getJobs } from '../services/jobs';
import { calculateOverallStats } from '../services/statistics';
import { Job, OverallStats } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { exportToExcel } from '../utils/excelExport';
import { importFromExcel } from '../utils/excelImport';
import { importJobs, importCompanies, importTransactions, getAllCompanies, getAllTransactions } from '../services/dataImport';
import JobCard from '../components/JobCard';
import AddJobModal from '../components/AddJobModal';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  onJobClick: (jobId: string) => void;
}

export default function Dashboard({ onJobClick }: DashboardProps) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<OverallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Aktif' | 'Tamamlandı' | 'Duraklatıldı'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [jobsData, statsData] = await Promise.all([
        getJobs(),
        calculateOverallStats(),
      ]);
      setJobs(jobsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleClearCache() {
    if (!confirm('Tüm cache ve geçici veriler temizlenecek. Devam etmek istiyor musunuz?')) {
      return;
    }

    try {
      localStorage.clear();
      sessionStorage.clear();

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
      }

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      alert('Cache temizlendi! Sayfa yeniden yükleniyor...');
      window.location.reload();
    } catch (error) {
      console.error('Cache temizleme hatası:', error);
      alert('Cache temizlenirken bir hata oluştu.');
    }
  }

  const filteredJobs = filter === 'all' ? jobs : jobs.filter((j) => j.status === filter);

  const filterCounts = {
    all: jobs.length,
    Aktif: jobs.filter((j) => j.status === 'Aktif').length,
    Tamamlandı: jobs.filter((j) => j.status === 'Tamamlandı').length,
    Duraklatıldı: jobs.filter((j) => j.status === 'Duraklatıldı').length,
  };

  async function handleExport() {
    try {
      const [companies, transactions] = await Promise.all([
        getAllCompanies(),
        getAllTransactions(),
      ]);

      exportToExcel({
        jobs,
        companies,
        transactions,
      });
    } catch (error) {
      console.error('Export error:', error);
      alert('Dışa aktarma sırasında bir hata oluştu');
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportStatus('Excel dosyası okunuyor...');

    try {
      const result = await importFromExcel(file);

      if (result.errors.length > 0) {
        console.error('Import errors:', result.errors);
      }

      let totalSuccess = 0;
      let totalFailed = 0;
      const allErrors: string[] = [...result.errors];

      if (result.jobs.length > 0) {
        setImportStatus(`${result.jobs.length} iş içe aktarılıyor...`);
        const jobResult = await importJobs(result.jobs);
        totalSuccess += jobResult.success;
        totalFailed += jobResult.failed;
        allErrors.push(...jobResult.errors);
      }

      if (result.companies.length > 0) {
        setImportStatus(`${result.companies.length} firma içe aktarılıyor...`);
        const companyResult = await importCompanies(result.companies);
        totalSuccess += companyResult.success;
        totalFailed += companyResult.failed;
        allErrors.push(...companyResult.errors);
      }

      if (result.transactions.length > 0) {
        setImportStatus(`${result.transactions.length} işlem içe aktarılıyor...`);
        const transactionResult = await importTransactions(result.transactions);
        totalSuccess += transactionResult.success;
        totalFailed += transactionResult.failed;
        allErrors.push(...transactionResult.errors);
      }

      setImportStatus('');

      if (allErrors.length > 0) {
        alert(
          `İçe Aktarma Tamamlandı!\n\n` +
          `Başarılı: ${totalSuccess}\n` +
          `Başarısız: ${totalFailed}\n\n` +
          `Hatalar:\n${allErrors.slice(0, 5).join('\n')}` +
          (allErrors.length > 5 ? `\n... ve ${allErrors.length - 5} hata daha` : '')
        );
      } else {
        alert(`İçe aktarma başarılı!\n\nToplam: ${totalSuccess} kayıt eklendi.`);
      }

      await loadData();
    } catch (error) {
      console.error('Import error:', error);
      alert('İçe aktarma sırasında bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setImporting(false);
      setImportStatus('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Briefcase className="w-6 h-6" />
              <h1 className="text-xl font-bold">İş Takip Sistemi</h1>
            </div>

            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Excel'den İçe Aktar"
              >
                <FileUp className="w-5 h-5" />
                <span className="hidden sm:inline">İçe Aktar</span>
              </button>

              <button
                onClick={handleExport}
                disabled={jobs.length === 0}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Excel'e Aktar"
              >
                <FileDown className="w-5 h-5" />
                <span className="hidden sm:inline">Dışa Aktar</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Yeni İş</span>
              </button>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300 hidden md:inline">{user?.email}</span>
                <button
                  onClick={handleClearCache}
                  className="flex items-center gap-2 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                  title="Cache Temizle"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                  title="Çıkış"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Toplam Gelir</p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalIncome)}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Toplam Gider</p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalExpense)}</p>
                </div>
                <TrendingDown className="w-12 h-12 text-red-200" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Net Durum</p>
                  <p className="text-3xl font-bold mt-2">{formatCurrency(stats.netBalance)}</p>
                </div>
                <DollarSign className="w-12 h-12 text-blue-200" />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {(
            [
              { key: 'all', label: 'Toplam İş', color: 'bg-blue-600' },
              { key: 'Aktif', label: 'Aktif', color: 'bg-green-600' },
              { key: 'Tamamlandı', label: 'Tamamlanan', color: 'bg-purple-600' },
              { key: 'Duraklatıldı', label: 'Duraklatılan', color: 'bg-yellow-600' },
            ] as const
          ).map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`${color} ${
                filter === key ? 'ring-4 ring-offset-2 ring-blue-300' : ''
              } text-white rounded-xl shadow-lg p-4 hover:opacity-90 transition-all`}
            >
              <p className="text-sm font-medium opacity-90">{label}</p>
              <p className="text-3xl font-bold mt-2">{filterCounts[key]}</p>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {filter === 'all' ? 'Tüm İşler' : `${filter} İşler`} ({filteredJobs.length})
            </h2>
          </div>

          {filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onUpdate={loadData}
                  onClick={() => onJobClick(job.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {filter === 'all' ? 'Henüz iş yok.' : 'Bu kategoride iş bulunamadı.'}
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5 inline mr-2" />
                  İlk İşinizi Oluşturun
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {showAddModal && (
        <AddJobModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadData();
          }}
        />
      )}

      {importStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-lg font-medium text-gray-800">{importStatus}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
