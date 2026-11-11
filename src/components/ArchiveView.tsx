import React, { useState, useMemo, useRef } from 'react';
import {
  DokumenKerjasama,
  UserRole,
  PengaturanApp,
} from '../types';
import {
  calculateSisaHari,
  computeLiveStatus,
  formatTanggalIndonesia,
  parseDateString,
} from '../utils/documentUtils';
import {
  Search,
  Filter,
  Download,
  Upload,
  ExternalLink,
  Eye,
  FileCheck,
  Trash2,
  HardDrive,
  UploadCloud,
  FileText,
  AlertCircle,
  Clock,
  ArrowUpDown,
  FileSpreadsheet,
  Plus,
} from 'lucide-react';

interface ArchiveViewProps {
  documents: DokumenKerjasama[];
  settings: PengaturanApp;
  activeRole: UserRole;
  onSelectDocument: (doc: DokumenKerjasama) => void;
  onDeleteDocument: (id: string, judul: string) => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onImportJson: (jsonStr: string) => void;
  onNavigateTab: (tab: string) => void;
  onStartVerify: (doc: DokumenKerjasama) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  documents,
  settings,
  activeRole,
  onSelectDocument,
  onDeleteDocument,
  onExportCsv,
  onExportJson,
  onImportJson,
  onNavigateTab,
  onStartVerify,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenis, setFilterJenis] = useState<string>('Semua');
  const [filterKategori, setFilterKategori] = useState<string>('Semua');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [filterMasaBerlaku, setFilterMasaBerlaku] = useState<string>('Semua');
  const [filterSumber, setFilterSumber] = useState<string>('Semua');
  const [sortBy, setSortBy] = useState<'berakhir' | 'mulai' | 'mitra' | 'judul'>('berakhir');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter & Search Logic
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const q = searchQuery.toLowerCase().trim();
      const sisa = calculateSisaHari(doc.tanggalBerakhir);
      const liveStatus = computeLiveStatus(doc);

      // Search matching: keyword, mitra, nomor, tahun
      if (q) {
        const d = parseDateString(doc.tanggalMulai) || parseDateString(doc.tanggalTtd);
        const tahun = d ? String(d.getFullYear()) : '';
        const matchTitle = doc.judul?.toLowerCase().includes(q);
        const matchMitra = doc.mitra?.toLowerCase().includes(q);
        const matchNomor1 = doc.nomorPihak1?.toLowerCase().includes(q);
        const matchNomor2 = doc.nomorPihak2?.toLowerCase().includes(q);
        const matchNamaFile = doc.namaFile?.toLowerCase().includes(q);
        const matchTahun = tahun.includes(q);
        const matchScope = doc.ruangLingkup?.toLowerCase().includes(q);

        if (!matchTitle && !matchMitra && !matchNomor1 && !matchNomor2 && !matchNamaFile && !matchTahun && !matchScope) {
          return false;
        }
      }

      // Filter Jenis
      if (filterJenis !== 'Semua' && doc.jenis !== filterJenis) return false;

      // Filter Kategori
      if (filterKategori !== 'Semua' && doc.kategori !== filterKategori) return false;

      // Filter Status
      if (filterStatus !== 'Semua' && liveStatus !== filterStatus) return false;

      // Filter Sumber
      if (filterSumber !== 'Semua' && doc.sumber !== filterSumber) return false;

      // Filter Masa Berlaku
      if (filterMasaBerlaku === 'Kritis') {
        if (sisa === null || sisa < 0 || sisa > 30) return false;
      } else if (filterMasaBerlaku === 'Segera') {
        if (sisa === null || sisa <= 30 || sisa > 90) return false;
      } else if (filterMasaBerlaku === 'Berlaku') {
        if (sisa === null || sisa <= 90) return false;
      } else if (filterMasaBerlaku === 'Berakhir') {
        if (sisa === null || sisa >= 0) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'berakhir') {
        const da = parseDateString(a.tanggalBerakhir)?.getTime() || 0;
        const db = parseDateString(b.tanggalBerakhir)?.getTime() || 0;
        comparison = da - db;
      } else if (sortBy === 'mulai') {
        const da = parseDateString(a.tanggalMulai)?.getTime() || 0;
        const db = parseDateString(b.tanggalMulai)?.getTime() || 0;
        comparison = da - db;
      } else if (sortBy === 'mitra') {
        comparison = (a.mitra || '').localeCompare(b.mitra || '');
      } else if (sortBy === 'judul') {
        comparison = (a.judul || '').localeCompare(b.judul || '');
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [
    documents,
    searchQuery,
    filterJenis,
    filterKategori,
    filterStatus,
    filterMasaBerlaku,
    filterSumber,
    sortBy,
    sortOrder,
  ]);

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) onImportJson(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Hidden File Input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Top Controls: Search, Export & Import, Add PKS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan kata kunci, nama mitra, nomor surat, atau tahun..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                &times;
              </button>
            )}
          </div>

          {/* Action Buttons: Export CSV, JSON, Import, Buat PKS */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onExportCsv}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Ekspor seluruh arsip ke format CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ekspor CSV</span>
            </button>

            <button
              onClick={onExportJson}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
              title="Cadangkan seluruh arsip ke file JSON"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Ekspor JSON</span>
            </button>

            <button
              onClick={handleImportClick}
              disabled={activeRole !== 'Admin'}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
              title={activeRole === 'Admin' ? 'Impor dokumen dari JSON' : 'Hanya Admin yang dapat mengimpor data'}
            >
              <Upload className="w-3.5 h-3.5 text-amber-600" />
              <span>Impor JSON</span>
            </button>

            <button
              onClick={() => onNavigateTab('buat-pks')}
              disabled={activeRole !== 'Staf' && activeRole !== 'Admin'}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition cursor-pointer"
              title={
                activeRole === 'Staf' || activeRole === 'Admin'
                  ? 'Mulai wizard penyusunan PKS baru'
                  : 'Hanya Staf & Admin yang dapat membuat PKS baru'
              }
            >
              <Plus className="w-4 h-4" />
              <span>PKS Baru</span>
            </button>
          </div>
        </div>

        {/* Filter Pills / Selectors */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Jenis */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Jenis Dokumen</label>
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="Semua">Semua Jenis</option>
              <option value="MoU">MoU Saja</option>
              <option value="PKS">PKS Saja</option>
            </select>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Kategori Mitra</label>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="Semua">Semua Kategori</option>
              {settings.kategoriList.map((kat) => (
                <option key={kat} value={kat}>
                  {kat}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Status Dokumen</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="Semua">Semua Status</option>
              <option value="Draft">Draft</option>
              <option value="Review">Review</option>
              <option value="Persetujuan">Persetujuan</option>
              <option value="Ditandatangani">Ditandatangani</option>
              <option value="Berlaku">Berlaku</option>
              <option value="Berakhir">Berakhir</option>
            </select>
          </div>

          {/* Masa Berlaku */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Masa Berlaku</label>
            <select
              value={filterMasaBerlaku}
              onChange={(e) => setFilterMasaBerlaku(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="Semua">Semua Rentang</option>
              <option value="Kritis">Kritis (&le; 30 Hari)</option>
              <option value="Segera">Segera Berakhir (&le; 90 Hari)</option>
              <option value="Berlaku">Berlaku Aman (&gt; 90 Hari)</option>
              <option value="Berakhir">Sudah Berakhir</option>
            </select>
          </div>

          {/* Sumber */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Sumber Dokumen</label>
            <select
              value={filterSumber}
              onChange={(e) => setFilterSumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="Semua">Semua Sumber</option>
              <option value="Unggah">Unggah Manual</option>
              <option value="Google Drive">Google Drive</option>
            </select>
          </div>

          {/* Pengurutan */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Urutkan</label>
            <div className="flex items-center space-x-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="berakhir">Tgl Berakhir</option>
                <option value="mulai">Tgl Mulai</option>
                <option value="mitra">Mitra</option>
                <option value="judul">Judul</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-600 cursor-pointer"
                title={`Urutan: ${sortOrder === 'asc' ? 'Menaik (Asc)' : 'Menurun (Desc)'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count & Active Filters Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        <div>
          Menampilkan <strong>{filteredDocuments.length}</strong> dari {documents.length} berkas arsip
        </div>
        {(filterJenis !== 'Semua' ||
          filterKategori !== 'Semua' ||
          filterStatus !== 'Semua' ||
          filterMasaBerlaku !== 'Semua' ||
          filterSumber !== 'Semua' ||
          searchQuery) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterJenis('Semua');
              setFilterKategori('Semua');
              setFilterStatus('Semua');
              setFilterMasaBerlaku('Semua');
              setFilterSumber('Semua');
            }}
            className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
          >
            Reset Semua Filter
          </button>
        )}
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Nama File & Mitra</th>
                <th className="py-3 px-3">Jenis</th>
                <th className="py-3 px-3">Nomor Surat</th>
                <th className="py-3 px-3">Masa Berlaku</th>
                <th className="py-3 px-3">Sisa Hari</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Sumber</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-800">
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold">Tidak ada arsip yang sesuai kriteria pencarian atau filter.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Coba sesuaikan kata kunci atau bersihkan filter.</p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => {
                  const sisa = calculateSisaHari(doc.tanggalBerakhir);
                  const liveStatus = computeLiveStatus(doc);

                  // Sisa Hari badge styling
                  let sisaBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                  let sisaLabel = `${sisa} Hari`;
                  if (sisa === null) {
                    sisaBadge = 'bg-slate-100 text-slate-600 border-slate-200';
                    sisaLabel = 'TIDAK DITEMUKAN';
                  } else if (sisa < 0) {
                    sisaBadge = 'bg-slate-200 text-slate-700 border-slate-300';
                    sisaLabel = `Berakhir (${Math.abs(sisa)} hari lalu)`;
                  } else if (sisa <= 30) {
                    sisaBadge = 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold';
                    sisaLabel = `${sisa} Hari (Kritis)`;
                  } else if (sisa <= 90) {
                    sisaBadge = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
                    sisaLabel = `${sisa} Hari (H-90)`;
                  }

                  // Status badge
                  const statusColors: Record<string, string> = {
                    Draft: 'bg-slate-100 text-slate-800 border-slate-200',
                    Review: 'bg-purple-100 text-purple-800 border-purple-200',
                    Persetujuan: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                    Ditandatangani: 'bg-blue-100 text-blue-800 border-blue-200',
                    Berlaku: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    Berakhir: 'bg-rose-100 text-rose-800 border-rose-200',
                  };

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                      onClick={() => onSelectDocument(doc)}
                    >
                      {/* Nama File & Mitra */}
                      <td className="py-3 px-4 max-w-xs sm:max-w-sm">
                        <div className="flex items-start space-x-2.5">
                          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 mt-0.5 flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate" title={doc.namaFile}>
                              {doc.namaFile || `${doc.jenis}_${doc.mitra}.pdf`}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-700 truncate" title={doc.mitra}>
                              {doc.mitra}
                            </div>
                            <div className="text-[11px] text-slate-500 line-clamp-1" title={doc.judul}>
                              {doc.judul}
                            </div>
                            <span className="inline-block mt-0.5 text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              {doc.kategori}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Jenis */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            doc.jenis === 'MoU'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}
                        >
                          {doc.jenis}
                        </span>
                      </td>

                      {/* Nomor Surat */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-[11px] text-slate-800 font-medium">
                          {doc.nomorPihak1 || '-'}
                        </div>
                        {doc.nomorPihak2 && (
                          <div className="font-mono text-[10px] text-slate-400">
                            Mitra: {doc.nomorPihak2}
                          </div>
                        )}
                      </td>

                      {/* Masa Berlaku */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">
                          {formatTanggalIndonesia(doc.tanggalMulai)}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          s.d. {formatTanggalIndonesia(doc.tanggalBerakhir)}
                        </div>
                      </td>

                      {/* Sisa Hari */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] border ${sisaBadge}`}>
                          {sisaLabel}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            statusColors[liveStatus] || 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          {liveStatus}
                        </span>
                      </td>

                      {/* Sumber */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          {doc.sumber === 'Google Drive' ? (
                            <>
                              <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                              <span className="text-[11px] font-medium text-slate-700">Drive</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-[11px] font-medium text-slate-700">Unggah</span>
                            </>
                          )}
                        </div>
                        {doc.driveLink && (
                          <a
                            href={doc.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center space-x-0.5 mt-0.5"
                          >
                            <span>Buka Drive</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => onSelectDocument(doc)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
                            title="Lihat Detail Lengkap & Riwayat"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {(doc.status === 'Draft' || doc.status === 'Review') && (
                            <button
                              onClick={() => onStartVerify(doc)}
                              disabled={activeRole !== 'Staf' && activeRole !== 'Admin'}
                              className="p-1.5 rounded-lg text-amber-600 hover:text-amber-800 hover:bg-amber-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                              title="Verifikasi Hasil Ekstraksi Metadata"
                            >
                              <FileCheck className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => onDeleteDocument(doc.id, doc.judul)}
                            disabled={activeRole !== 'Admin'}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                            title={activeRole === 'Admin' ? 'Hapus Dokumen Arsip' : 'Hanya Admin yang dapat menghapus dokumen'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
