import React, { useState, useEffect } from 'react';
import {
  DokumenKerjasama,
  AntreanItem,
  UserRole,
  PengaturanApp,
  ExtractionResult,
} from '../types';
import {
  generateUniformFileName,
  checkDocumentConsistency,
  calculateSisaHari,
  computeLiveStatus,
} from '../utils/documentUtils';
import {
  Check,
  AlertTriangle,
  FileText,
  Save,
  ArrowLeft,
  Quote,
  ShieldAlert,
  Info,
  Calendar,
  Building,
  Hash,
  Scale,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface VerificationViewProps {
  selectedItem: AntreanItem | null;
  existingDoc: DokumenKerjasama | null;
  settings: PengaturanApp;
  activeRole: UserRole;
  onSaveToArchive: (doc: DokumenKerjasama, fromQueueId?: string) => void;
  onBack: () => void;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  selectedItem,
  existingDoc,
  settings,
  activeRole,
  onSaveToArchive,
  onBack,
}) => {
  // Extract initial values from either existingDoc or selectedItem's dataEkstraksi
  const extraction: Partial<ExtractionResult> =
    selectedItem?.dataEkstraksi ||
    (existingDoc
      ? {
          jenis_dokumen: existingDoc.jenis,
          judul: existingDoc.judul,
          nomor: existingDoc.nomorPihak1,
          nomor_pihak_kedua: existingDoc.nomorPihak2,
          para_pihak: [
            { nama: existingDoc.mitra, diwakili_oleh: '', jabatan: '' },
          ],
          tanggal_penandatanganan: existingDoc.tanggalTtd,
          tanggal_mulai_berlaku: existingDoc.tanggalMulai,
          tanggal_berakhir: existingDoc.tanggalBerakhir,
          jangka_waktu: existingDoc.jangkaWaktu,
          ruang_lingkup_ringkas: existingDoc.ruangLingkup,
          hak_dan_kewajiban_ringkas: existingDoc.hakKewajiban,
          penanggung_jawab_bpt_komdigi: existingDoc.penanggungJawab,
          dokumen_induk: existingDoc.dokumenInduk,
          kategori_usulan: existingDoc.kategori,
          usulan_nama_file: existingDoc.namaFile,
          kutipan_bukti: existingDoc.kutipanDetail || [],
          bidang_tidak_ditemukan: [],
          peringatan: existingDoc.peringatan || [],
        }
      : {});

  // Form Fields State
  const [jenis, setJenis] = useState<'MoU' | 'PKS'>(
    extraction.jenis_dokumen === 'MoU' ? 'MoU' : 'PKS'
  );
  const [judul, setJudul] = useState<string>(extraction.judul || '');
  const [mitra, setMitra] = useState<string>(
    extraction.para_pihak?.[0]?.nama || extraction.judul || ''
  );
  const [nomorPihak1, setNomorPihak1] = useState<string>(extraction.nomor || '');
  const [nomorPihak2, setNomorPihak2] = useState<string>(extraction.nomor_pihak_kedua || '');
  const [tanggalTtd, setTanggalTtd] = useState<string>(
    extraction.tanggal_penandatanganan || ''
  );
  const [tanggalMulai, setTanggalMulai] = useState<string>(
    extraction.tanggal_mulai_berlaku || ''
  );
  const [tanggalBerakhir, setTanggalBerakhir] = useState<string>(
    extraction.tanggal_berakhir || ''
  );
  const [jangkaWaktu, setJangkaWaktu] = useState<string>(
    extraction.jangka_waktu || ''
  );
  const [ruangLingkup, setRuangLingkup] = useState<string>(
    extraction.ruang_lingkup_ringkas || ''
  );
  const [hakKewajiban, setHakKewajiban] = useState<string>(
    extraction.hak_dan_kewajiban_ringkas || ''
  );
  const [penanggungJawab, setPenanggungJawab] = useState<string>(
    extraction.penanggung_jawab_bpt_komdigi || ''
  );
  const [dokumenInduk, setDokumenInduk] = useState<string>(
    extraction.dokumen_induk || ''
  );
  const [kategori, setKategori] = useState<string>(
    extraction.kategori_usulan || settings.kategoriList[0] || 'Perguruan Tinggi'
  );
  const [namaFile, setNamaFile] = useState<string>(
    extraction.usulan_nama_file ||
      generateUniformFileName(
        jenis,
        mitra || 'MITRA',
        tanggalMulai || tanggalTtd,
        nomorPihak1 || '001',
        settings.polaPenamaan
      )
  );

  // Dynamic Warnings Check
  const [inconsistencyWarnings, setInconsistencyWarnings] = useState<string[]>([]);

  useEffect(() => {
    const rawWarnings = extraction.peringatan || [];
    const dynWarnings = checkDocumentConsistency(tanggalMulai, tanggalBerakhir, mitra, dokumenInduk);
    const combined = Array.from(new Set([...rawWarnings, ...dynWarnings]));
    setInconsistencyWarnings(combined);
  }, [tanggalMulai, tanggalBerakhir, mitra, dokumenInduk]);

  // Recalculate uniform file name when core fields change
  const handleRecalculateFileName = () => {
    const generated = generateUniformFileName(
      jenis,
      mitra || 'MITRA',
      tanggalMulai || tanggalTtd || '2026',
      nomorPihak1 || '001',
      settings.polaPenamaan
    );
    setNamaFile(generated);
  };

  const isNotFound = (val: string) => {
    return !val || val.trim().toUpperCase() === 'TIDAK DITEMUKAN' || val.includes('[ISI:');
  };

  // Save verified document
  const handleSave = () => {
    const sisa = calculateSisaHari(tanggalBerakhir);
    let initialStatus: any = 'Berlaku';
    if (sisa !== null && sisa < 0) {
      initialStatus = 'Berakhir';
    } else if (existingDoc?.status) {
      initialStatus = existingDoc.status;
    }

    const docId = existingDoc?.id || 'dok-' + Date.now();

    // Map evidence citations
    const buktiMap: Record<string, string> = {};
    if (extraction.kutipan_bukti) {
      extraction.kutipan_bukti.forEach((kb) => {
        if (kb.field) buktiMap[kb.field] = `${kb.pasal_atau_halaman}: ${kb.kutipan_teks}`;
      });
    }

    const docToSave: DokumenKerjasama = {
      id: docId,
      jenis,
      judul: judul || 'Kerjasama BPT Komdigi',
      mitra: mitra || 'Pihak Mitra',
      nomorPihak1: nomorPihak1 || 'TIDAK DITEMUKAN',
      nomorPihak2: nomorPihak2 || '',
      tanggalTtd: tanggalTtd || 'TIDAK DITEMUKAN',
      tanggalMulai: tanggalMulai || 'TIDAK DITEMUKAN',
      tanggalBerakhir: tanggalBerakhir || 'TIDAK DITEMUKAN',
      jangkaWaktu: jangkaWaktu || 'TIDAK DITEMUKAN',
      ruangLingkup: ruangLingkup || 'TIDAK DITEMUKAN',
      hakKewajiban: hakKewajiban || 'TIDAK DITEMUKAN',
      penanggungJawab: penanggungJawab || 'TIDAK DITEMUKAN',
      dokumenInduk: dokumenInduk || '',
      kategori,
      namaFile: namaFile || `${jenis}_${mitra}.pdf`,
      status: initialStatus,
      sumber: selectedItem?.sumber || existingDoc?.sumber || 'Unggah',
      driveFileId: selectedItem?.driveFileId || existingDoc?.driveFileId || '',
      driveLink: existingDoc?.driveLink || '',
      docId: existingDoc?.docId || '',
      versi: existingDoc?.versi || [
        {
          versiNomor: 1,
          tanggal: new Date().toISOString(),
          diubahOleh: activeRole,
          catatan: 'Verifikasi hasil ekstraksi awal oleh staf.',
        },
      ],
      buktiKutipan: buktiMap,
      kutipanDetail: extraction.kutipan_bukti || [],
      peringatan: inconsistencyWarnings,
      rawText: selectedItem?.rawText || existingDoc?.rawText || '',
      createdAt: existingDoc?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveToArchive(docToSave, selectedItem?.id);
  };

  const rawDocumentText =
    selectedItem?.rawText ||
    existingDoc?.rawText ||
    (selectedItem?.dataEkstraksi
      ? JSON.stringify(selectedItem.dataEkstraksi, null, 2)
      : 'Teks dokumen mentah diekstrak oleh modul Gemini AI dari berkas PDF/DOCX.');

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
            title="Kembali ke halaman sebelumnya"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                Verifikasi Metadata AI
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {selectedItem?.namaFile || existingDoc?.namaFile || 'Dokumen Baru'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Verifikasi & Koreksi Data Ekstraksi Dokumen
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={activeRole !== 'Staf' && activeRole !== 'Admin'}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            title={
              activeRole === 'Staf' || activeRole === 'Admin'
                ? 'Simpan hasil verifikasi ke arsip resmi'
                : 'Hanya Staf & Admin yang dapat menyimpan'
            }
          >
            <Save className="w-4 h-4" />
            <span>Simpan ke Arsip</span>
          </button>
        </div>
      </div>

      {/* Inconsistency Warnings Banner */}
      {inconsistencyWarnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 space-y-2 shadow-xs">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Peringatan Inkonsistensi / Anomali Data yang Terdeteksi AI:</span>
          </div>
          <ul className="list-disc list-inside text-xs text-amber-800 space-y-1 pl-1">
            {inconsistencyWarnings.map((w, idx) => (
              <li key={idx} className="font-medium">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Two Column Layout: Left (Preview & Evidence) | Right (Editable Verification Form) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 cols): Document Text & Quotation Evidence */}
        <div className="lg:col-span-5 space-y-4">
          {/* Evidence Quotations Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <Quote className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Kutipan Bukti Pasal / Halaman
              </h3>
            </div>
            <p className="text-[11px] text-slate-500">
              Gemini AI mengekstrak data berikut dengan menyertakan rujukan pasal pembuktian langsung dari teks perjanjian.
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {extraction.kutipan_bukti && extraction.kutipan_bukti.length > 0 ? (
                extraction.kutipan_bukti.map((kb, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="text-[11px] text-blue-700 capitalize">
                        {kb.field?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono">
                        {kb.pasal_atau_halaman}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic border-l-2 border-blue-400 pl-2">
                      "{kb.kutipan_teks}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Tidak ada kutipan bukti eksplisit yang terlampir.
                </div>
              )}
            </div>
          </div>

          {/* Raw Document Text Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                  Teks Dokumen Asli
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Pratinjau Ekstraksi</span>
            </div>
            <div className="bg-slate-950 text-slate-300 font-mono text-[11px] p-3 rounded-lg max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
              {rawDocumentText}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Editable Verification Form */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Formulir Metadata Kerja Sama</h3>
              <p className="text-xs text-slate-500">
                Pastikan seluruh data diverifikasi. Kolom berwarna kuning menandakan nilai tidak ditemukan di dokumen.
              </p>
            </div>
            <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
              <span>Kuning = TIDAK DITEMUKAN</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Jenis Dokumen */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jenis Dokumen <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="jenis_doc"
                    value="MoU"
                    checked={jenis === 'MoU'}
                    onChange={() => setJenis('MoU')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Nota Kesepahaman (MoU)</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer font-medium text-slate-700">
                  <input
                    type="radio"
                    name="jenis_doc"
                    value="PKS"
                    checked={jenis === 'PKS'}
                    onChange={() => setJenis('PKS')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <span>Perjanjian Kerja Sama (PKS)</span>
                </label>
              </div>
            </div>

            {/* Kategori Usulan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kategori Mitra <span className="text-red-500">*</span>
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {settings.kategoriList.map((kat) => (
                  <option key={kat} value={kat}>
                    {kat}
                  </option>
                ))}
              </select>
            </div>

            {/* Judul Kerjasama (Colspan 2) */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Judul Lengkap Dokumen / Kerjasama <span className="text-red-500">*</span>
                </label>
                {isNotFound(judul) && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-1.5 py-0.2 rounded">
                    TIDAK DITEMUKAN
                  </span>
                )}
              </div>
              <textarea
                rows={2}
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                className={`w-full rounded-lg px-3 py-2 text-xs font-medium border outline-none focus:ring-2 focus:ring-blue-500 ${
                  isNotFound(judul) ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold' : 'border-slate-300'
                }`}
                placeholder="Contoh: Nota Kesepakatan Bersama antara BPT Komdigi dengan ..."
              />
            </div>

            {/* Nama Mitra */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Nama Instansi Mitra <span className="text-red-500">*</span>
                </label>
                {isNotFound(mitra) && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-1.5 py-0.2 rounded">
                    TIDAK DITEMUKAN
                  </span>
                )}
              </div>
              <input
                type="text"
                value={mitra}
                onChange={(e) => setMitra(e.target.value)}
                className={`w-full rounded-lg px-3 py-1.5 text-xs font-medium border outline-none focus:ring-2 focus:ring-blue-500 ${
                  isNotFound(mitra) ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold' : 'border-slate-300'
                }`}
                placeholder="Nama resmi instansi/universitas/perusahaan mitra"
              />
            </div>

            {/* Penanggung Jawab BPT Komdigi */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Penanggung Jawab (PIC BPT Komdigi)</label>
                {isNotFound(penanggungJawab) && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-1.5 py-0.2 rounded">
                    TIDAK DITEMUKAN
                  </span>
                )}
              </div>
              <input
                type="text"
                value={penanggungJawab}
                onChange={(e) => setPenanggungJawab(e.target.value)}
                className={`w-full rounded-lg px-3 py-1.5 text-xs font-medium border outline-none focus:ring-2 focus:ring-blue-500 ${
                  isNotFound(penanggungJawab)
                    ? 'bg-amber-50 border-amber-400 text-amber-950'
                    : 'border-slate-300'
                }`}
                placeholder="Nama pejabat atau ketua tim PIC BPT Komdigi"
              />
            </div>

            {/* Nomor Surat BPT */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Nomor Surat Pihak Pertama (BPT Komdigi) <span className="text-red-500">*</span>
                </label>
                {isNotFound(nomorPihak1) && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-1.5 py-0.2 rounded">
                    TIDAK DITEMUKAN
                  </span>
                )}
              </div>
              <input
                type="text"
                value={nomorPihak1}
                onChange={(e) => setNomorPihak1(e.target.value)}
                className={`w-full rounded-lg px-3 py-1.5 text-xs font-mono border outline-none focus:ring-2 focus:ring-blue-500 ${
                  isNotFound(nomorPihak1)
                    ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                    : 'border-slate-300'
                }`}
                placeholder="Contoh: 120/BPT.KOMDIGI/PKS/03/2026"
              />
            </div>

            {/* Nomor Surat Mitra */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nomor Surat Pihak Mitra (Opsional)
              </label>
              <input
                type="text"
                value={nomorPihak2}
                onChange={(e) => setNomorPihak2(e.target.value)}
                className="w-full rounded-lg px-3 py-1.5 text-xs font-mono border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nomor dari pihak kedua jika ada"
              />
            </div>

            {/* Tanggal Penandatanganan */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Tanggal Ditandatangani (DD-MM-YYYY)</label>
                {isNotFound(tanggalTtd) && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-1.5 py-0.2 rounded">
                    TIDAK DITEMUKAN
                  </span>
                )}
              </div>
              <input
                type="text"
                value={tanggalTtd}
                onChange={(e) => setTanggalTtd(e.target.value)}
                className={`w-full rounded-lg px-3 py-1.5 text-xs font-mono border outline-none focus:ring-2 focus:ring-blue-500 ${
                  isNotFound(tanggalTtd)
                    ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                    : 'border-slate-300'
                }`}
                placeholder="DD-MM-YYYY"
              />
            </div>

            {/* Jangka Waktu */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Jangka Waktu</label>
                {isNotFound(jangkaWaktu) && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-1.5 py-0.2 rounded">
                    TIDAK DITEMUKAN
                  </span>
                )}
              </div>
              <input
                type="text"
                value={jangkaWaktu}
                onChange={(e) => setJangkaWaktu(e.target.value)}
                className={`w-full rounded-lg px-3 py-1.5 text-xs font-medium border outline-none focus:ring-2 focus:ring-blue-500 ${
                  isNotFound(jangkaWaktu)
                    ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                    : 'border-slate-300'
                }`}
                placeholder="Contoh: 3 (tiga) tahun"
              />
            </div>

            {/* Tanggal Mulai */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Tanggal Mulai Berlaku (DD-MM-YYYY) <span className="text-red-500">*</span>
                </label>
                {isNotFound(tanggalMulai) && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-1.5 py-0.2 rounded">
                    TIDAK DITEMUKAN
                  </span>
                )}
              </div>
              <input
                type="text"
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className={`w-full rounded-lg px-3 py-1.5 text-xs font-mono border outline-none focus:ring-2 focus:ring-blue-500 ${
                  isNotFound(tanggalMulai)
                    ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                    : 'border-slate-300'
                }`}
                placeholder="DD-MM-YYYY"
              />
            </div>

            {/* Tanggal Berakhir */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Tanggal Berakhir (DD-MM-YYYY) <span className="text-red-500">*</span>
                </label>
                {isNotFound(tanggalBerakhir) && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-1.5 py-0.2 rounded">
                    TIDAK DITEMUKAN
                  </span>
                )}
              </div>
              <input
                type="text"
                value={tanggalBerakhir}
                onChange={(e) => setTanggalBerakhir(e.target.value)}
                className={`w-full rounded-lg px-3 py-1.5 text-xs font-mono border outline-none focus:ring-2 focus:ring-blue-500 ${
                  isNotFound(tanggalBerakhir)
                    ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold'
                    : 'border-slate-300'
                }`}
                placeholder="DD-MM-YYYY"
              />
            </div>

            {/* Dokumen Induk (MoU) */}
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Dokumen Induk (MoU Pengayom)
              </label>
              <input
                type="text"
                value={dokumenInduk}
                onChange={(e) => setDokumenInduk(e.target.value)}
                className="w-full rounded-lg px-3 py-1.5 text-xs border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nomor atau nama MoU induk jika PKS ini merupakan pelaksanaan teknis"
              />
            </div>

            {/* Ruang Lingkup (Colspan 2) */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Ruang Lingkup Ringkas</label>
                {isNotFound(ruangLingkup) && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-1.5 py-0.2 rounded">
                    TIDAK DITEMUKAN
                  </span>
                )}
              </div>
              <textarea
                rows={2}
                value={ruangLingkup}
                onChange={(e) => setRuangLingkup(e.target.value)}
                className={`w-full rounded-lg px-3 py-2 text-xs border outline-none focus:ring-2 focus:ring-blue-500 ${
                  isNotFound(ruangLingkup)
                    ? 'bg-amber-50 border-amber-400 text-amber-950'
                    : 'border-slate-300'
                }`}
                placeholder="Rincian ruang lingkup kerja sama"
              />
            </div>

            {/* Hak dan Kewajiban (Colspan 2) */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Hak dan Kewajiban Para Pihak</label>
                {isNotFound(hakKewajiban) && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-1.5 py-0.2 rounded">
                    TIDAK DITEMUKAN
                  </span>
                )}
              </div>
              <textarea
                rows={2}
                value={hakKewajiban}
                onChange={(e) => setHakKewajiban(e.target.value)}
                className={`w-full rounded-lg px-3 py-2 text-xs border outline-none focus:ring-2 focus:ring-blue-500 ${
                  isNotFound(hakKewajiban)
                    ? 'bg-amber-50 border-amber-400 text-amber-950'
                    : 'border-slate-300'
                }`}
                placeholder="Rincian hak dan kewajiban masing-masing pihak"
              />
            </div>

            {/* Uniform File Name Preview (Colspan 2) */}
            <div className="md:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">
                  Nama Berkas Seragam Sesuai Standar:
                </label>
                <button
                  type="button"
                  onClick={handleRecalculateFileName}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  Regenerasi Nama
                </button>
              </div>
              <input
                type="text"
                value={namaFile}
                onChange={(e) => setNamaFile(e.target.value)}
                className="w-full font-mono text-xs px-3 py-1.5 bg-white border border-slate-300 rounded font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-[10px] text-slate-500 font-mono">
                Pola aturan penamaan: {settings.polaPenamaan}.pdf
              </p>
            </div>
          </div>

          {/* Action Button at bottom */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Kembali
            </button>
            <button
              onClick={handleSave}
              disabled={activeRole !== 'Staf' && activeRole !== 'Admin'}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan ke Arsip Resmi BPT Komdigi</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
