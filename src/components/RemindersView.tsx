import React, { useState } from 'react';
import {
  DokumenKerjasama,
  UserRole,
  TindakLanjut,
} from '../types';
import {
  calculateSisaHari,
  computeLiveStatus,
  formatTanggalIndonesia,
} from '../utils/documentUtils';
import {
  BellRing,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Calendar,
  Building,
  CheckSquare,
  FileText,
  RotateCcw,
  Archive,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface RemindersViewProps {
  documents: DokumenKerjasama[];
  activeRole: UserRole;
  onSelectDocument: (doc: DokumenKerjasama) => void;
  onTindakLanjut: (docId: string, tindakLanjut: TindakLanjut) => void;
  onNavigateTab: (tab: string) => void;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  documents,
  activeRole,
  onSelectDocument,
  onTindakLanjut,
  onNavigateTab,
}) => {
  const [filterTab, setFilterTab] = useState<'semua' | 'kritis' | 'segera' | 'berlaku' | 'berakhir'>('semua');

  // Modal Tindak Lanjut State
  const [selectedDocForAction, setSelectedDocForAction] = useState<DokumenKerjasama | null>(null);
  const [actionChoice, setActionChoice] = useState<'Perpanjang' | 'Evaluasi' | 'Arsipkan'>('Perpanjang');
  const [actionNotes, setActionNotes] = useState<string>('');

  // Analyze all documents
  const analyzedDocs = documents.map((doc) => {
    const sisa = calculateSisaHari(doc.tanggalBerakhir);
    const liveStatus = computeLiveStatus(doc);
    let category: 'kritis' | 'segera' | 'berlaku' | 'berakhir' = 'berlaku';

    if (sisa === null) category = 'berlaku';
    else if (sisa < 0) category = 'berakhir';
    else if (sisa <= 30) category = 'kritis';
    else if (sisa <= 90) category = 'segera';
    else category = 'berlaku';

    return { doc, sisa, liveStatus, category };
  });

  const criticalList = analyzedDocs.filter((d) => d.category === 'kritis');
  const soonList = analyzedDocs.filter((d) => d.category === 'segera');
  const activeList = analyzedDocs.filter((d) => d.category === 'berlaku');
  const expiredList = analyzedDocs.filter((d) => d.category === 'berakhir');

  const filteredItems =
    filterTab === 'semua'
      ? analyzedDocs
      : filterTab === 'kritis'
      ? criticalList
      : filterTab === 'segera'
      ? soonList
      : filterTab === 'berlaku'
      ? activeList
      : expiredList;

  const handleOpenActionModal = (doc: DokumenKerjasama) => {
    setSelectedDocForAction(doc);
    setActionChoice(doc.tindakLanjut?.status || 'Perpanjang');
    setActionNotes(doc.tindakLanjut?.catatan || '');
  };

  const handleConfirmAction = () => {
    if (!selectedDocForAction) return;

    const tindakLanjut: TindakLanjut = {
      status: actionChoice,
      tanggal: new Date().toISOString(),
      catatan: actionNotes.trim() || `Ditandai tindak lanjut: ${actionChoice} oleh ${activeRole}.`,
      petugas: activeRole,
    };

    onTindakLanjut(selectedDocForAction.id, tindakLanjut);
    setSelectedDocForAction(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BellRing className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">
              Pengingat & Pemantauan Masa Berlaku Kerja Sama
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Notifikasi otomatis H-90 dan H-30 untuk mencegah keterlambatan perpanjangan addendum atau evaluasi pelaksanaan kerja sama BPT Komdigi.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            <span>Kritis: {criticalList.length} Dokumen</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            Segera Berakhir: {soonList.length} Dokumen
          </div>
        </div>
      </div>

      {/* Critical Notifications Cards on top if any */}
      {criticalList.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center space-x-1.5">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            <span>Pemberitahuan Mendesak H-30 (Masa Berlaku Kritis)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {criticalList.map(({ doc, sisa }) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl border-2 border-rose-300 bg-rose-50/70 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white">
                      H-30 KRITIS &bull; {sisa} Hari Lagi
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{doc.nomorPihak1}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-2 line-clamp-1">{doc.judul}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Mitra: <strong>{doc.mitra}</strong> &bull; PIC: {doc.penanggungJawab}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Berakhir pada:{' '}
                    <strong className="text-rose-900">
                      {formatTanggalIndonesia(doc.tanggalBerakhir)}
                    </strong>
                  </p>

                  {doc.tindakLanjut && (
                    <div className="mt-2 p-2 rounded bg-white border border-rose-200 text-[11px] text-rose-950 font-medium">
                      Status Tindak Lanjut: <strong>{doc.tindakLanjut.status}</strong> ({doc.tindakLanjut.catatan})
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-rose-200 flex items-center justify-between">
                  <button
                    onClick={() => onSelectDocument(doc)}
                    className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Detail Dokumen</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleOpenActionModal(doc)}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    Tandai Tindak Lanjut
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 text-xs font-semibold">
        {[
          { id: 'semua', label: `Semua (${analyzedDocs.length})` },
          { id: 'kritis', label: `Kritis &le; 30 Hari (${criticalList.length})`, color: 'text-rose-600' },
          { id: 'segera', label: `Segera Berakhir &le; 90 Hari (${soonList.length})`, color: 'text-amber-600' },
          { id: 'berlaku', label: `Berlaku Aman (${activeList.length})` },
          { id: 'berakhir', label: `Telah Berakhir (${expiredList.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterTab(t.id as any)}
            className={`pb-2.5 px-2 transition cursor-pointer ${
              filterTab === t.id
                ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            } ${t.color || ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Reminders List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Nama Dokumen & Mitra</th>
              <th className="py-3 px-3">Jenis</th>
              <th className="py-3 px-3">Tanggal Berakhir</th>
              <th className="py-3 px-3">Sisa Masa Berlaku</th>
              <th className="py-3 px-3">Status Saat Ini</th>
              <th className="py-3 px-3">Tindak Lanjut</th>
              <th className="py-3 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  Tidak ada dokumen pada kategori masa berlaku ini.
                </td>
              </tr>
            ) : (
              filteredItems.map(({ doc, sisa, liveStatus, category }) => {
                let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                let label = `${sisa} Hari`;

                if (sisa === null) {
                  badgeClass = 'bg-slate-100 text-slate-600 border-slate-300';
                  label = 'Tidak Ditentukan';
                } else if (sisa < 0) {
                  badgeClass = 'bg-slate-200 text-slate-700 border-slate-300';
                  label = `Lewat ${Math.abs(sisa)} Hari`;
                } else if (sisa <= 30) {
                  badgeClass = 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold';
                  label = `${sisa} Hari (Kritis)`;
                } else if (sisa <= 90) {
                  badgeClass = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
                  label = `${sisa} Hari (H-90)`;
                }

                return (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => onSelectDocument(doc)}
                  >
                    <td className="py-3 px-4 max-w-sm">
                      <div className="font-bold text-slate-900 truncate">{doc.judul}</div>
                      <div className="text-[11px] text-slate-600 font-medium">
                        Mitra: <strong>{doc.mitra}</strong> &bull; Nomor: {doc.nomorPihak1}
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.jenis === 'MoU'
                            ? 'bg-blue-50 text-blue-800'
                            : 'bg-purple-50 text-purple-800'
                        }`}
                      >
                        {doc.jenis}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-slate-700 font-medium">
                      {formatTanggalIndonesia(doc.tanggalBerakhir)}
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] border ${badgeClass}`}>
                        {label}
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                        {liveStatus}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {doc.tindakLanjut ? (
                        <div className="text-[11px] font-semibold text-blue-700 truncate max-w-xs">
                          {doc.tindakLanjut.status}: {doc.tindakLanjut.catatan}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Belum ada</span>
                      )}
                    </td>

                    <td
                      className="py-3 px-4 whitespace-nowrap text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleOpenActionModal(doc)}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition cursor-pointer"
                      >
                        Tindak Lanjut
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tindak Lanjut */}
      {selectedDocForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">Tindak Lanjut Masa Berlaku Dokumen</h4>
                <p className="text-[11px] text-slate-400 truncate max-w-xs">
                  {selectedDocForAction.mitra} ({selectedDocForAction.nomorPihak1})
                </p>
              </div>
              <button
                onClick={() => setSelectedDocForAction(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-2">
                  Pilihan Keputusan Tindak Lanjut:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Perpanjang', icon: RotateCcw, label: 'Perpanjang' },
                    { id: 'Evaluasi', icon: CheckSquare, label: 'Evaluasi' },
                    { id: 'Arsipkan', icon: Archive, label: 'Arsipkan' },
                  ].map((act) => {
                    const isSelected = actionChoice === act.id;
                    const Icon = act.icon;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setActionChoice(act.id as any)}
                        className={`p-3 rounded-lg border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{act.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Catatan Tindak Lanjut & Rekomendasi:
                </label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Contoh: Disiapkan permohonan addendum perpanjangan masa berlaku 1 tahun lagi berdasarkan rekomendasi tim teknis lab..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500">
                Pencatatan tindak lanjut tidak menghapus atau mengubah masa berlaku secara otomatis; status dan naskah tetap dikendalikan oleh otoritas pimpinan.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDocForAction(null)}
                  className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  Simpan Tindak Lanjut
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
