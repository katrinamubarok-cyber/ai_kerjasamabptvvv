import React from 'react';
import {
  DokumenKerjasama,
  AktivitasLog,
  UserRole,
  PengaturanApp,
} from '../types';
import { calculateSisaHari, computeLiveStatus, formatTanggalIndonesia } from '../utils/documentUtils';
import {
  FileText,
  AlertOctagon,
  Clock,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  PlusCircle,
  UploadCloud,
  MessageSquareCode,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Calendar,
  Building2,
  FileCheck2,
} from 'lucide-react';

interface DashboardViewProps {
  documents: DokumenKerjasama[];
  logs: AktivitasLog[];
  settings: PengaturanApp;
  activeRole: UserRole;
  isDriveConnected: boolean;
  isDemoMode: boolean;
  lastSyncTime: string | null;
  onSyncNow: () => void;
  isSyncing: boolean;
  onNavigateTab: (tab: string) => void;
  onSelectDocument: (doc: DokumenKerjasama) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  documents,
  logs,
  settings,
  activeRole,
  isDriveConnected,
  isDemoMode,
  lastSyncTime,
  onSyncNow,
  isSyncing,
  onNavigateTab,
  onSelectDocument,
}) => {
  // Counts by Type
  const mouCount = documents.filter((d) => d.jenis === 'MoU').length;
  const pksCount = documents.filter((d) => d.jenis === 'PKS').length;

  // Counts by Status
  const statusCounts = documents.reduce(
    (acc, doc) => {
      const s = computeLiveStatus(doc);
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Expiring counts
  const expiringAnalysis = documents.map((doc) => {
    const sisa = calculateSisaHari(doc.tanggalBerakhir);
    return { doc, sisa };
  });

  const criticalDocs = expiringAnalysis.filter(
    (item) => item.sisa !== null && item.sisa >= 0 && item.sisa <= 30
  );
  const soonExpiringDocs = expiringAnalysis.filter(
    (item) => item.sisa !== null && item.sisa > 30 && item.sisa <= 90
  );

  return (
    <div className="space-y-6">
      {/* Welcome / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
              Sistem Manajemen Kerja Sama
            </span>
            <span className="text-slate-400 text-xs">• Ditjen SDPPI / BPT Komdigi</span>
          </div>
          <h1 className="text-2xl font-black mt-1 text-slate-100">
            Dasbor Pengelolaan Dokumen MoU & PKS
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Arsip terstruktur, ekstraksi metadata berbasis Gemini AI, penyusunan draft PKS berstandar naskah dinas, dan pemantauan masa berlaku kerja sama telekomunikasi.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => onNavigateTab('buat-pks')}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat PKS Baru</span>
          </button>
          <button
            onClick={() => onNavigateTab('unggah-sinkron')}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow transition cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-blue-400" />
            <span>Unggah Berkas</span>
          </button>
          <button
            onClick={() => onNavigateTab('tanya-dokumen')}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            <MessageSquareCode className="w-4 h-4" />
            <span>Tanya Arsip AI</span>
          </button>
        </div>
      </div>

      {/* Critical Alert Bar if any */}
      {criticalDocs.length > 0 && (
        <div className="p-4 bg-rose-50 border-l-4 border-rose-600 rounded-r-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 animate-pulse">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-rose-950 uppercase tracking-wide">
                Peringatan Kritis: {criticalDocs.length} Dokumen Kerja Sama Berakhir Dalam &le; 30 Hari!
              </div>
              <p className="text-xs text-rose-800">
                Segera lakukan evaluasi, persiapan addendum perpanjangan, atau pengarsipan tindak lanjut.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('pengingat')}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer flex-shrink-0 ml-4"
          >
            <span>Tinjau Sekarang</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Arsip Dokumen</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{documents.length}</div>
            <div className="flex items-center space-x-3 mt-2 text-xs font-medium text-slate-600">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-100">
                {mouCount} MoU
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold border border-purple-100">
                {pksCount} PKS
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Kritis Masa Berlaku */}
        <div
          onClick={() => onNavigateTab('pengingat')}
          className={`p-5 rounded-xl border shadow-xs flex items-center justify-between cursor-pointer transition ${
            criticalDocs.length > 0
              ? 'bg-rose-50/70 border-rose-300 hover:bg-rose-100/50'
              : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Kritis (&le; 30 Hari)</span>
            <div className="text-3xl font-extrabold text-rose-700 mt-1">{criticalDocs.length}</div>
            <p className="text-xs text-rose-600 mt-2 font-medium">Memerlukan atensi pimpinan</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        {/* Segera Berakhir */}
        <div
          onClick={() => onNavigateTab('pengingat')}
          className={`p-5 rounded-xl border shadow-xs flex items-center justify-between cursor-pointer transition ${
            soonExpiringDocs.length > 0
              ? 'bg-amber-50/60 border-amber-300 hover:bg-amber-100/50'
              : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Segera Berakhir (&le; 90 Hari)
            </span>
            <div className="text-3xl font-extrabold text-amber-700 mt-1">{soonExpiringDocs.length}</div>
            <p className="text-xs text-amber-600 mt-2 font-medium">Proses telaah perpanjangan</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Google Drive Sync Status */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sinkronisasi Drive</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isDriveConnected ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-amber-400'
              }`}
            />
          </div>
          <div className="my-2">
            <div className="text-xs font-bold text-slate-800 truncate">
              {isDriveConnected ? 'Tersambung Aktif' : 'Siap Dihubungkan'}
            </div>
            <div className="text-[11px] text-slate-500 truncate">
              {lastSyncTime ? `Terakhir: ${lastSyncTime}` : 'Belum pernah disinkron'}
            </div>
          </div>
          <button
            onClick={onSyncNow}
            disabled={isSyncing}
            className="flex items-center justify-center space-x-1.5 w-full py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
          </button>
        </div>
      </div>

      {/* Status Breakdown Pills Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Distribusi Dokumen Berdasarkan Alur Status
          </span>
          <span className="text-xs text-slate-500">Klik status untuk memfilter di Arsip</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: 'Draft', color: 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200' },
            { label: 'Review', color: 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100' },
            { label: 'Persetujuan', color: 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100' },
            { label: 'Ditandatangani', color: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100' },
            { label: 'Berlaku', color: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' },
            { label: 'Berakhir', color: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100' },
          ].map((st) => (
            <button
              key={st.label}
              onClick={() => onNavigateTab('arsip')}
              className={`p-2.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer ${st.color}`}
            >
              <div>
                <div className="text-[11px] font-medium text-slate-600">{st.label}</div>
                <div className="text-lg font-bold">{statusCounts[st.label] || 0}</div>
              </div>
              <FileCheck2 className="w-4 h-4 opacity-40" />
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Section: Expiring Documents Table & Recent Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Expiring Watchlist (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h2 className="font-bold text-sm text-slate-800">
                Daftar Pantau Masa Berlaku (&le; 90 Hari & Kritis)
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('pengingat')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
            >
              <span>Lihat Selengkapnya</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 divide-y divide-slate-100 flex-1">
            {[...criticalDocs, ...soonExpiringDocs].length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada dokumen yang mendekati masa berakhir dalam 90 hari ke depan.
              </div>
            ) : (
              [...criticalDocs, ...soonExpiringDocs].slice(0, 5).map(({ doc, sisa }) => {
                const isCrit = sisa !== null && sisa <= 30;
                return (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDocument(doc)}
                    className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-lg cursor-pointer transition"
                  >
                    <div className="space-y-1 pr-4 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            doc.jenis === 'MoU'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {doc.jenis}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate">{doc.mitra}</span>
                        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                          {doc.nomorPihak1}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-1">{doc.judul}</p>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Berakhir: {formatTanggalIndonesia(doc.tanggalBerakhir)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          isCrit
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {sisa !== null ? `${sisa} Hari Lagi` : 'Tgl Belum Diatur'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium mt-1">
                        {isCrit ? 'Status Kritis (H-30)' : 'Segera Berakhir (H-90)'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Recent Activity Feed (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h2 className="font-bold text-sm text-slate-800">Aktivitas Terkini</h2>
            </div>
            <button
              onClick={() => onNavigateTab('log')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Semua Log
            </button>
          </div>

          <div className="divide-y divide-slate-100 my-2 flex-1">
            {logs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">Belum ada aktivitas tercatat.</div>
            ) : (
              logs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-2.5 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{log.aksi}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(log.waktu).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{log.detail}</p>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                    <span className="font-medium text-slate-500">{log.pengguna}</span>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 font-semibold text-slate-600">
                      {log.peran}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
