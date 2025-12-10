import { Edit2, Trash2, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Job } from '../types';
import { formatDate, formatCurrency } from '../utils/formatters';
import { deleteJob } from '../services/jobs';
import EditJobModal from './EditJobModal';

interface JobCardProps {
  job: Job & any;
  onUpdate: () => void;
  onClick?: () => void;
}

export default function JobCard({ job, onUpdate, onClick }: JobCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(`"${job.name}" işini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteJob(job.id);
      onUpdate();
    } catch (error) {
      alert('İş silinemedi: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setDeleting(false);
    }
  };

  const statusColors = {
    Aktif: 'border-green-500 bg-green-50',
    Tamamlandı: 'border-blue-500 bg-blue-50',
    Duraklatıldı: 'border-yellow-500 bg-yellow-50',
  };

  const statusBadgeColors = {
    Aktif: 'bg-green-600',
    Tamamlandı: 'bg-blue-600',
    Duraklatıldı: 'bg-yellow-600',
  };

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border-l-4 ${
        statusColors[job.status]
      } overflow-hidden group`}
    >
      <span
        className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white ${
          statusBadgeColors[job.status]
        }`}
      >
        {job.status}
      </span>

      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowEditModal(true);
          }}
          className="p-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
          title="Düzenle"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
          title="Sil"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {showEditModal && (
        <EditJobModal
          job={job}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            onUpdate();
          }}
        />
      )}

      <div className="p-6 pt-12">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{job.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {job.description || 'Açıklama yok'}
        </p>

        {(job.totalToBePaid !== undefined || job.totalIncome !== undefined) && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600">Toplam Yapılacak</p>
              <p className="font-bold text-sm text-blue-600">
                {formatCurrency(job.totalToBePaid || 0)}
              </p>
            </div>
            <div className="text-center p-2 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-600">Toplam Yapılan</p>
              <p className="font-bold text-sm text-green-600">
                {formatCurrency(job.totalPaid || 0)}
              </p>
            </div>
            <div className={`text-center p-2 rounded-lg ${(job.totalRemaining || 0) > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <p className="text-xs text-gray-600">Kalan</p>
              <p className={`font-bold text-sm ${(job.totalRemaining || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(job.totalRemaining || 0)}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
          <span>Başlangıç: {formatDate(job.start_date)}</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
