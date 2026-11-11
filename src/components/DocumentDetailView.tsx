import React, { useState } from 'react';
import {
  DokumenKerjasama,
  UserRole,
  StatusDokumen,
  AktivitasLog,
  CatatanReviewer,
} from '../types';
import {
  calculateSisaHari,
  computeLiveStatus,
  formatTanggalIndonesia,
} from '../utils/documentUtils';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Building,
  HardDrive,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Clock,
  MessageSquare,
  History,
  ShieldCheck,
  AlertTriangle,
  Send,
  Plus,
  RefreshCw,
  FileCheck2,
  User,
  Quote,
} from 'lucide-react';

interface DocumentDetailViewProps {
  document: DokumenKerjasama;
  logs: AktivitasLog[];
  activeRole: UserRole;
  onBack: () => void;
  onUpdateStatus: (
    newStatus: StatusDokumen,
    catatan: string,
    changedBy: string
  ) => void;
  onAddReviewerNote: (note: Omit<CatatanReviewer, 'id' | 'tanggal'>) => void;
  onRegenerateSummary: (doc: DokumenKerjasama) => void;
  isSummarizing: boolean;
  onStartVerify: (doc: DokumenKerjasama) => void;
}

export const DocumentDetailView: React.FC<DocumentDetailViewProps> = ({
  document,
  logs,
  activeRole,
  onBack,
  onUpdateStatus,
  onAddReviewerNote,
  onRegenerateSummary,
  isSummarizing,
  onStartVerify,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'alur' | 'versi' | 'catatan' | 'audit'>('info');

  // Status Change Dialog State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<StatusDokumen>('Review');
  const [statusNote, setStatusNote] = useState('');

  // Add Reviewer Note State
  const [newNoteText, setNewNoteText] = useState('');
  const [newNotePasal, setNewNotePasal] = useState('');

  const liveStatus = computeLiveStatus(document);
  const sisaHari = calculateSisaHari(document.tanggalBerakhir);

  const documentLogs = logs.filter(
    (l) => l.dokumenId === document.id || l.detail.includes(document.nomorPihak1)
  );

  const allStatuses: StatusDokumen[] = [
    'Draft',
    'Review',
    'Persetujuan',
    'Ditandatangani',
    'Berlaku',
    'Berakhir',
  ];

  // Role permissions check for workflow actions
  const canSubmitForReview =
    (activeRole === 'Staf' || activeRole === 'Admin') &&
    (liveStatus === 'Draft' || liveStatus === 'Review');

  const canReviewAndRecommend =
    (activeRole === 'Reviewer' || activeRole === 'Admin') &&
    (liveStatus === 'Review' || liveStatus === 'Draft');

  const canApprove =
    (activeRole === 'Pimpinan' || activeRole === 'Admin') &&
    (liveStatus === 'Persetujuan' || liveStatus === 'Review');

  const canMarkSigned =
    (activeRole === 'Pimpinan' || activeRole === 'Admin') &&
    liveStatus === 'Ditandatangani';

  const handleOpenStatusModal = (status: StatusDokumen) => {
    setTargetStatus(status);
    setStatusNote('');
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = () => {
    if (!statusNote.trim()) {
      alert('Catatan perubahan status wajib diisi untuk transparansi audit.');
      return;
    }
    onUpdateStatus(targetStatus, statusNote, activeRole);
    setShowStatusModal(false);
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    onAddReviewerNote({
      penulis: activeRole,
      peran: activeRole,
      isi: newNoteText.trim(),
      pasalRujukan: newNotePasal.trim() || undefined,
    });

    setNewNoteText('');
    setNewNotePasal('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Kembali ke Arsip"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    document.jenis === 'MoU'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-purple-50 text-purple-800 border-purple-200'
                  }`}
                >
                  {document.jenis}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  {document.kategori}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    liveStatus === 'Berlaku'
                      ? 'bg-emerald-100 text-emerald-800'
                      : liveStatus === 'Review'
                      ? 'bg-purple-100 text-purple-800'
                      : liveStatus === 'Persetujuan'
                      ? 'bg-indigo-100 text-indigo-800'
                      : liveStatus === 'Ditandatangani'
                      ? 'bg-blue-100 text-blue-800'
                      : liveStatus === 'Berakhir'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  Status: {liveStatus}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                {document.judul}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Mitra: <strong className="text-slate-800">{document.mitra}</strong> &bull; Nomor:{' '}
                <span className="font-mono">{document.nomorPihak1}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions (Drive Link, Re-verify) */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {document.driveLink && (
              <a
                href={document.driveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold border border-blue-200 transition"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Buka di Google Drive</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            )}

            {(activeRole === 'Staf' || activeRole === 'Admin') && (
              <button
                onClick={() => onStartVerify(document)}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                title="Koreksi atau verifikasi ulang metadata"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Koreksi Metadata</span>
              </button>
            )}
          </div>
        </div>

        {/* Workflow Action Buttons Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500 mr-1">Alur Aksi ({activeRole}):</span>

          {/* Staf Actions */}
          <button
            onClick={() => handleOpenStatusModal('Review')}
            disabled={!canSubmitForReview}
            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold transition cursor-pointer"
            title="Ajukan draft dokumen kepada Reviewer Hukum"
          >
            Ajukan ke Reviewer
          </button>

          {/* Reviewer Actions */}
          <button
            onClick={() => handleOpenStatusModal('Persetujuan')}
            disabled={!canReviewAndRecommend}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold transition cursor-pointer"
            title="Selesaikan telaah dan ajukan persetujuan ke Pimpinan"
          >
            Rekomendasikan ke Pimpinan
          </button>

          {/* Pimpinan Actions */}
          <button
            onClick={() => handleOpenStatusModal('Ditandatangani')}
            disabled={!canApprove}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold transition cursor-pointer"
            title="Setujui dokumen untuk penandatanganan resmi"
          >
            Setujui Dokumen (Pimpinan)
          </button>

          <button
            onClick={() => handleOpenStatusModal('Berlaku')}
            disabled={!canMarkSigned}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold transition cursor-pointer"
            title="Tandai dokumen telah ditandatangani dan resmi berlaku"
          >
            Tandai Ditandatangani & Berlaku
          </button>

          {/* Admin Override */}
          {activeRole === 'Admin' && (
            <button
              onClick={() => handleOpenStatusModal('Draft')}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer"
            >
              Kembalikan ke Draft
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 space-x-4 text-xs font-semibold">
        {[
          { id: 'info', label: 'Ringkasan & Metadata' },
          { id: 'alur', label: 'Linimasa Status' },
          { id: 'versi', label: `Riwayat Versi (${document.versi?.length || 1})` },
          { id: 'catatan', label: `Catatan Reviewer (${document.catatanReviewer?.length || 0})` },
          { id: 'audit', label: `Log Aktivitas (${documentLogs.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-2.5 transition cursor-pointer ${
              activeTab === t.id
                ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Ringkasan AI & Metadata Lengkap */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          {/* AI Executive Summary Card */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/70 rounded-xl border border-indigo-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
              <div className="flex items-center space-x-2">
                <div className="p-1 rounded-md bg-indigo-600 text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-950">
                  Ringkasan Eksekutif AI (Maks 150 Kata)
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-semibold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                  Hasil AI, perlu verifikasi
                </span>
                <button
                  onClick={() => onRegenerateSummary(document)}
                  disabled={isSummarizing}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                  title="Perbarui ringkasan dokumen dengan Gemini"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : ''}`} />
                  <span>{isSummarizing ? 'Menyusun...' : 'Regenerasi'}</span>
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-700 leading-relaxed font-normal">
              {document.ringkasanAi ||
                'Klik "Regenerasi" untuk membuat ringkasan eksekutif padat maksimal 150 kata dengan rujukan pasal hukum.'}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
              Metadata Resmi Kerjasama BPT Komdigi
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Nomor Surat BPT</span>
                <span className="font-mono font-bold text-slate-800 mt-0.5 block">
                  {document.nomorPihak1 || '-'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Nomor Surat Mitra</span>
                <span className="font-mono font-medium text-slate-800 mt-0.5 block">
                  {document.nomorPihak2 || '-'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Kategori Mitra</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{document.kategori}</span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Tanggal Penandatanganan</span>
                <span className="font-medium text-slate-800 mt-0.5 block">
                  {formatTanggalIndonesia(document.tanggalTtd)}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Masa Berlaku Perjanjian</span>
                <span className="font-medium text-slate-800 mt-0.5 block">
                  {formatTanggalIndonesia(document.tanggalMulai)} s.d.{' '}
                  {formatTanggalIndonesia(document.tanggalBerakhir)}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Jangka Waktu & Sisa Hari</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {document.jangkaWaktu || '-'} (
                  {sisaHari !== null
                    ? sisaHari < 0
                      ? `Telah berakhir ${Math.abs(sisaHari)} hari lalu`
                      : `${sisaHari} hari lagi`
                    : 'Tidak ditentukan'}
                  )
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium block">PIC BPT Komdigi</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {document.penanggungJawab || '-'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Dokumen Induk (MoU)</span>
                <span className="font-medium text-slate-800 mt-0.5 block">
                  {document.dokumenInduk || 'Tidak ada / Kerjasama Independen'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-medium block">Nama Berkas Seragam</span>
                <span className="font-mono text-slate-800 text-[11px] mt-0.5 block truncate">
                  {document.namaFile}
                </span>
              </div>
            </div>

            {/* Ruang Lingkup & Hak Kewajiban */}
            <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-800 block mb-1">Ruang Lingkup Kerja Sama:</span>
                <p className="bg-slate-50 p-3 rounded-lg text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {document.ruangLingkup || 'Tidak ada rincian ruang lingkup.'}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">Hak dan Kewajiban Para Pihak:</span>
                <p className="bg-slate-50 p-3 rounded-lg text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {document.hakKewajiban || 'Tidak ada rincian hak dan kewajiban.'}
                </p>
              </div>
            </div>
          </div>

          {/* Evidence Citations Accordion */}
          {document.buktiKutipan && Object.keys(document.buktiKutipan).length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
              <div className="flex items-center space-x-2">
                <Quote className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  Rujukan Bukti Pasal dari Dokumen Sumber
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {Object.entries(document.buktiKutipan).map(([k, v]) => (
                  <div key={k} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-blue-700 block">
                      {k.replace(/_/g, ' ')}
                    </span>
                    <p className="text-[11px] text-slate-700 italic mt-0.5">"{v}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Linimasa Status & Stepper */}
      {activeTab === 'alur' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <h3 className="font-bold text-sm text-slate-900">
            Linimasa Alur Pengesahan Kerja Sama
          </h3>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative">
            {allStatuses.map((st, idx) => {
              const isPast =
                allStatuses.indexOf(liveStatus) >= idx ||
                (liveStatus === 'Berlaku' && idx < 5);
              const isCurrent = liveStatus === st;

              return (
                <div key={st} className="flex-1 flex sm:flex-col items-center gap-3 sm:gap-2 text-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow'
                        : isPast
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {isPast && !isCurrent ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>
                  <div>
                    <span
                      className={`text-xs block ${
                        isCurrent ? 'font-bold text-blue-700' : 'font-medium text-slate-600'
                      }`}
                    >
                      {st}
                    </span>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      {idx === 0
                        ? 'Penyusunan'
                        : idx === 1
                        ? 'Telaah Hukum'
                        : idx === 2
                        ? 'Persetujuan'
                        : idx === 3
                        ? 'Penandatanganan'
                        : idx === 4
                        ? 'Operasional'
                        : 'Purna Tugas'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
            <span className="font-bold text-slate-800">Catatan Perubahan Status Terakhir:</span>
            <p className="text-slate-600">
              Setiap kali status diubah (oleh Staf, Reviewer, atau Pimpinan), catatan tertulis, nama pengguna, dan waktu
              disimpan secara permanen pada log audit naskah kerja sama BPT Komdigi.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: Riwayat Versi */}
      {activeTab === 'versi' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Riwayat Versi Dokumen</h3>
              <p className="text-xs text-slate-500">
                Setiap revisi atau perubahan file dari Google Drive dicatat sebagai versi bertingkat.
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {(!document.versi || document.versi.length === 0) ? (
              <p className="py-4 text-center text-slate-400">Belum ada riwayat versi.</p>
            ) : (
              document.versi.map((v) => (
                <div key={v.versiNomor} className="py-3 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-xs">
                        Versi {v.versiNomor}
                      </span>
                      <span className="text-slate-700 font-semibold">{v.catatan}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                      <User className="w-3 h-3" />
                      <span>{v.diubahOleh}</span>
                      <span>&bull;</span>
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(v.tanggal).toLocaleDateString('id-ID', { dateStyle: 'long' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Catatan Reviewer */}
      {activeTab === 'catatan' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Catatan & Telaah Reviewer</h3>
              <p className="text-xs text-slate-500">
                Catatan klausul hukum, masukan redaksional, dan catatan tindak lanjut per pasal.
              </p>
            </div>
          </div>

          {/* Form Tambah Catatan */}
          <form onSubmit={handleAddNoteSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <span className="font-bold text-xs text-slate-800 block">
              Beri Catatan Review Baru ({activeRole}):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <input
                type="text"
                value={newNotePasal}
                onChange={(e) => setNewNotePasal(e.target.value)}
                placeholder="Rujukan Pasal (misal: Pasal 5 Ayat 2)"
                className="bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Tuliskan catatan atau masukan telaah..."
                className="sm:col-span-3 bg-white border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newNoteText.trim()}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded text-xs font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simpan Catatan</span>
              </button>
            </div>
          </form>

          {/* List Catatan Reviewer */}
          <div className="space-y-3 text-xs">
            {(!document.catatanReviewer || document.catatanReviewer.length === 0) ? (
              <p className="text-center py-6 text-slate-400">Belum ada catatan reviewer pada dokumen ini.</p>
            ) : (
              document.catatanReviewer.map((c) => (
                <div key={c.id} className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-800">{c.penulis}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                        {c.peran}
                      </span>
                      {c.pasalRujukan && (
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-mono font-bold">
                          {c.pasalRujukan}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {new Date(c.tanggal).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <p className="text-slate-700 text-xs pl-0.5">{c.isi}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Log Audit Dokumen */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">
            Riwayat Log Audit Dokumen
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {documentLogs.length === 0 ? (
              <p className="py-6 text-center text-slate-400">Belum ada aktivitas tercatat untuk dokumen ini.</p>
            ) : (
              documentLogs.map((l) => (
                <div key={l.id} className="py-2.5 flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-800">{l.aksi}</div>
                    <p className="text-slate-600">{l.detail}</p>
                    <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                      <span>Oleh: {l.pengguna} ({l.peran})</span>
                      <span>&bull;</span>
                      <span>Model: {l.model}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {new Date(l.waktu).toLocaleString('id-ID')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-5 py-3 text-white flex items-center justify-between">
              <span className="font-bold text-sm">Ubah Status Menjadi: {targetStatus}</span>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                Masukkan catatan pertimbangan atau hasil telaah sebelum mengubah status dokumen ini ke{' '}
                <strong>{targetStatus}</strong>:
              </p>
              <textarea
                rows={3}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Contoh: Seluruh klausul hak dan kewajiban telah diverifikasi dan disetujui..."
                className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmStatusChange}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Konfirmasi Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
