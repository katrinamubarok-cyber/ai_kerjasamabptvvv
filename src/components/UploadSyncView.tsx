import React, { useState, useRef } from 'react';
import {
  AntreanItem,
  UserRole,
  PengaturanApp,
} from '../types';
import {
  UploadCloud,
  HardDrive,
  RefreshCw,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Play,
  RotateCcw,
  Check,
  FolderOpen,
  ArrowRight,
  Shield,
  FileCheck,
} from 'lucide-react';

interface UploadSyncViewProps {
  queue: AntreanItem[];
  settings: PengaturanApp;
  activeRole: UserRole;
  isDriveConnected: boolean;
  isDemoMode: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  onSyncNow: () => void;
  onOpenDriveModal: () => void;
  onAddManualFiles: (files: File[]) => void;
  onProcessQueueItem: (item: AntreanItem) => void;
  onRetryQueueItem: (item: AntreanItem) => void;
  onDeleteQueueItem: (id: string) => void;
  onNavigateToVerify: (item: AntreanItem) => void;
}

export const UploadSyncView: React.FC<UploadSyncViewProps> = ({
  queue,
  settings,
  activeRole,
  isDriveConnected,
  isDemoMode,
  isSyncing,
  lastSyncTime,
  onSyncNow,
  onOpenDriveModal,
  onAddManualFiles,
  onProcessQueueItem,
  onRetryQueueItem,
  onDeleteQueueItem,
  onNavigateToVerify,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

  const validateAndAddFiles = (files: FileList | File[]) => {
    setValidationError('');
    const validFiles: File[] = [];
    const fileArray = Array.from(files);

    for (const f of fileArray) {
      // Validate size <= 25MB
      if (f.size > MAX_FILE_SIZE_BYTES) {
        setValidationError(
          `Berkas "${f.name}" melebihi batas ukuran maksimal 25 MB (${(f.size / (1024 * 1024)).toFixed(1)} MB). Harap unggah berkas yang lebih kecil.`
        );
        return;
      }

      // Validate format: PDF or DOCX
      const name = f.name.toLowerCase();
      const isPdf = name.endsWith('.pdf') || f.type === 'application/pdf';
      const isDocx =
        name.endsWith('.docx') ||
        f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      if (!isPdf && !isDocx) {
        setValidationError(
          `Format berkas "${f.name}" tidak didukung. Sistem hanya menerima berkas PDF atau DOCX (maks. 25 MB).`
        );
        return;
      }

      validFiles.push(f);
    }

    if (validFiles.length > 0) {
      onAddManualFiles(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (activeRole !== 'Staf' && activeRole !== 'Admin') {
      setValidationError('Peran Anda saat ini tidak memiliki izin untuk mengunggah berkas (Hanya Staf & Admin).');
      return;
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Google Drive Connection Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div
            className={`p-3 rounded-xl flex items-center justify-center ${
              isDriveConnected
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-amber-50 text-amber-600 border border-amber-200'
            }`}
          >
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-sm text-slate-900">Integrasi Google Drive & Folder Arsip</h2>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isDriveConnected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {isDriveConnected ? 'Terhubung' : 'Siap Dihubungkan'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Folder Sumber: <strong>{settings.folderSumberNama || 'Arsip MoU-PKS'}</strong> (ID:{' '}
              {settings.folderSumberId ? settings.folderSumberId : 'Default / Belum diatur'})
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Sinkronisasi otomatis berjalan tiap {settings.syncIntervalMenit} menit. Terakhir disinkron:{' '}
              <strong>{lastSyncTime || 'Belum ada'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSyncNow}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
          </button>

          <button
            onClick={onOpenDriveModal}
            className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            {isDriveConnected ? 'Kelola Koneksi' : 'Hubungkan Drive'}
          </button>
        </div>
      </div>

      {/* Manual Upload Section (Drag & Drop) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Unggah Manual Berkas Kerjasama</h3>
            <p className="text-xs text-slate-500">
              Format yang didukung: PDF, DOCX (Maksimal 25 MB per berkas).
            </p>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center space-x-1">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>Ekstraksi AI otomatis via Gemini 3.8 Flash</span>
          </div>
        </div>

        {validationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (activeRole === 'Staf' || activeRole === 'Admin') {
              fileInputRef.current?.click();
            } else {
              setValidationError('Hanya peran Staf & Admin yang berhak mengunggah berkas.');
            }
          }}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-50/70'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple
            className="hidden"
          />

          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          <h4 className="font-bold text-slate-800 text-sm">
            Tarik & Jatuhkan Berkas PDF / DOCX di sini, atau Klik untuk Memilih
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Setiap dokumen akan otomatis diantrekan dan diekstrak metadatanya oleh Gemini AI untuk verifikasi Anda.
          </p>

          <div className="mt-4 inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Pilih Berkas dari Komputer</span>
          </div>
        </div>
      </div>

      {/* Processing Queue Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Antrean Pemrosesan Dokumen</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              {queue.length} Berkas
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Status: Menunggu &bull; Memproses &bull; Perlu Verifikasi &bull; Selesai &bull; Gagal
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Antrean kosong. Silakan unggah dokumen PDF/DOCX atau jalankan sinkronisasi Google Drive untuk memproses berkas baru.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Nama Berkas</th>
                  <th className="py-2.5 px-3">Ukuran</th>
                  <th className="py-2.5 px-3">Sumber</th>
                  <th className="py-2.5 px-3">Status Pemrosesan</th>
                  <th className="py-2.5 px-3">Waktu Masuk</th>
                  <th className="py-2.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {queue.map((item) => {
                  const statusColors: Record<string, string> = {
                    Menunggu: 'bg-slate-100 text-slate-700 border-slate-300',
                    Memproses: 'bg-blue-100 text-blue-800 border-blue-300 font-bold',
                    'Perlu verifikasi': 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
                    Selesai: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                    Gagal: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
                  };

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      {/* Nama Berkas */}
                      <td className="py-3 px-4 max-w-xs truncate">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 truncate block" title={item.namaFile}>
                              {item.namaFile}
                            </span>
                            {item.pesanError && (
                              <p className="text-[10px] text-rose-600 truncate" title={item.pesanError}>
                                {item.pesanError}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Ukuran */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {formatFileSize(item.ukuran)}
                      </td>

                      {/* Sumber */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-slate-600">
                          {item.sumber === 'Google Drive' ? (
                            <>
                              <HardDrive className="w-3 h-3 text-blue-500" />
                              <span>Drive</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-3 h-3 text-slate-400" />
                              <span>Manual</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] border ${
                              statusColors[item.status] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.status}
                          </span>
                          {item.status === 'Memproses' && (
                            <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                          )}
                        </div>
                      </td>

                      {/* Waktu */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-400 text-[11px]">
                        {new Date(item.ditambahkanPada).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {item.status === 'Perlu verifikasi' && (
                            <button
                              onClick={() => onNavigateToVerify(item)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-bold shadow-xs transition flex items-center space-x-1 cursor-pointer"
                            >
                              <FileCheck className="w-3 h-3" />
                              <span>Verifikasi Sekarang</span>
                            </button>
                          )}

                          {item.status === 'Menunggu' && (
                            <button
                              onClick={() => onProcessQueueItem(item)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold shadow-xs transition flex items-center space-x-1 cursor-pointer"
                            >
                              <Play className="w-3 h-3" />
                              <span>Proses AI</span>
                            </button>
                          )}

                          {item.status === 'Gagal' && (
                            <button
                              onClick={() => onRetryQueueItem(item)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition flex items-center space-x-1 cursor-pointer"
                              title="Coba proses ulang dokumen ini"
                            >
                              <RotateCcw className="w-3 h-3 text-blue-600" />
                              <span>Coba Lagi</span>
                            </button>
                          )}

                          <button
                            onClick={() => onDeleteQueueItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Hapus dari antrean"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
