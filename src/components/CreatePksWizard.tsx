import React, { useState } from 'react';
import {
  DokumenKerjasama,
  UserRole,
  PengaturanApp,
} from '../types';
import { generateUniformFileName } from '../utils/documentUtils';
import { googleDriveService } from '../services/googleDriveService';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  HardDrive,
  ExternalLink,
  Download,
  Save,
  RefreshCw,
  FileCheck,
  Building,
  Scale,
  Calendar,
  Layers,
  FileCode,
} from 'lucide-react';

interface CreatePksWizardProps {
  documents: DokumenKerjasama[];
  settings: PengaturanApp;
  activeRole: UserRole;
  isDriveConnected: boolean;
  isDemoMode: boolean;
  onSaveNewPks: (doc: DokumenKerjasama) => void;
  onNavigateTab: (tab: string) => void;
  onOpenDriveModal: () => void;
}

export const CreatePksWizard: React.FC<CreatePksWizardProps> = ({
  documents,
  settings,
  activeRole,
  isDriveConnected,
  isDemoMode,
  onSaveNewPks,
  onNavigateTab,
  onOpenDriveModal,
}) => {
  const [step, setStep] = useState<number>(1);

  // Available MoUs for Step 1 selection
  const availableMous = documents.filter((d) => d.jenis === 'MoU');

  // Step 1 Form Data
  const [selectedMouId, setSelectedMouId] = useState<string>('');
  const [mitra, setMitra] = useState<string>('');
  const [dokumenInduk, setDokumenInduk] = useState<string>('');
  const [kategori, setKategori] = useState<string>(settings.kategoriList[0] || 'Perguruan Tinggi');
  const [pejabatBpt, setPejabatBpt] = useState<string>('Kepala Balai Pengujian Telekomunikasi');
  const [jabatanBpt, setJabatanBpt] = useState<string>(
    'Kepala Balai Pengujian Telekomunikasi, Ditjen SDPPI / Kementerian Komunikasi dan Digital'
  );
  const [pejabatMitra, setPejabatMitra] = useState<string>('');
  const [jabatanMitra, setJabatanMitra] = useState<string>('');
  const [judulKegiatan, setJudulKegiatan] = useState<string>('');
  const [ruangLingkup, setRuangLingkup] = useState<string>('');
  const [hakKewajiban, setHakKewajiban] = useState<string>('');
  const [jangkaWaktu, setJangkaWaktu] = useState<string>('1 (satu) tahun');
  const [tanggalMulai, setTanggalMulai] = useState<string>('01-12-2026');
  const [tanggalBerakhir, setTanggalBerakhir] = useState<string>('01-12-2027');
  const [pembiayaan, setPembiayaan] = useState<string>(
    'Dibiayai secara proporsional sesuai ketentuan PNBP Kementerian Komunikasi dan Digital'
  );
  const [penanggungJawab, setPenanggungJawab] = useState<string>(
    'Ketua Tim Kerja Operasional Pengujian BPT'
  );

  // Step 3: Generated Draft
  const [generatedDraft, setGeneratedDraft] = useState<string>('');
  const [isGeneratingDraft, setIsGeneratingDraft] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string>('');

  // Step 4: Created Doc details
  const [createdDocId, setCreatedDocId] = useState<string>('');
  const [createdDocLink, setCreatedDocLink] = useState<string>('');
  const [isCreatingInDocs, setIsCreatingInDocs] = useState<boolean>(false);
  const [docsCreationError, setDocsCreationError] = useState<string>('');
  const [finalizedPdfLink, setFinalizedPdfLink] = useState<string>('');
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);

  // Handle MoU Selection Auto-fill
  const handleMouSelect = (mouId: string) => {
    setSelectedMouId(mouId);
    if (!mouId) return;

    const mou = availableMous.find((m) => m.id === mouId);
    if (mou) {
      setMitra(mou.mitra);
      setKategori(mou.kategori);
      setDokumenInduk(`Nota Kesepahaman Nomor ${mou.nomorPihak1} tanggal ${mou.tanggalMulai}`);
      if (!judulKegiatan) {
        setJudulKegiatan(`Pelaksanaan Kerja Sama Pengujian dan Riset bersama ${mou.mitra}`);
      }
      if (!ruangLingkup) {
        setRuangLingkup(mou.ruangLingkup);
      }
    }
  };

  // Step 2: Check Required Fields
  const requiredFields = [
    { key: 'mitra', label: 'Nama Instansi Mitra', value: mitra },
    { key: 'pejabatMitra', label: 'Nama Pejabat Mitra', value: pejabatMitra },
    { key: 'jabatanMitra', label: 'Jabatan Pejabat Mitra', value: jabatanMitra },
    { key: 'judulKegiatan', label: 'Judul Kegiatan / Kerjasama', value: judulKegiatan },
    { key: 'ruangLingkup', label: 'Ruang Lingkup Kerja Sama', value: ruangLingkup },
    { key: 'hakKewajiban', label: 'Hak dan Kewajiban Para Pihak', value: hakKewajiban },
    { key: 'jangkaWaktu', label: 'Jangka Waktu Pelaksanaan', value: jangkaWaktu },
    { key: 'tanggalMulai', label: 'Tanggal Mulai Berlaku', value: tanggalMulai },
    { key: 'tanggalBerakhir', label: 'Tanggal Berakhir', value: tanggalBerakhir },
    { key: 'pembiayaan', label: 'Ketentuan Pembiayaan', value: pembiayaan },
    { key: 'penanggungJawab', label: 'Penanggung Jawab BPT', value: penanggungJawab },
  ];

  const missingFields = requiredFields.filter((f) => !f.value.trim());
  const filledCount = requiredFields.length - missingFields.length;
  const completenessPercent = Math.round((filledCount / requiredFields.length) * 100);

  // Step 3: Trigger Gemini Draft Generation
  const handleGenerateDraft = async () => {
    setIsGeneratingDraft(true);
    setGenerationError('');
    try {
      const res = await fetch('/api/gemini/draft-pks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: {
            mitra,
            dokumenInduk,
            pejabatBpt,
            jabatanBpt,
            pejabatMitra,
            jabatanMitra,
            judulKegiatan,
            ruangLingkup,
            hakKewajiban,
            jangkaWaktu,
            tanggalMulai,
            tanggalBerakhir,
            pembiayaan,
            penanggungJawab,
          },
          templateText: settings.templatePks,
          templateVersion: settings.versiTemplatePks,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyusun draft PKS dengan AI.');
      }

      setGeneratedDraft(data.draft);
      setStep(3);
    } catch (err: any) {
      setGenerationError(err.message || 'Terjadi kesalahan saat memanggil Gemini API.');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Step 4: Create in Google Docs
  const handleCreateInGoogleDocs = async () => {
    if (!isDriveConnected) {
      onOpenDriveModal();
      return;
    }

    setIsCreatingInDocs(true);
    setDocsCreationError('');
    try {
      const uniformName = generateUniformFileName(
        'PKS',
        mitra || 'MITRA',
        tanggalMulai,
        'DRAFT',
        settings.polaPenamaan
      ).replace('.pdf', '');

      const result = await googleDriveService.createGoogleDoc(
        settings.folderDraftId,
        uniformName,
        generatedDraft
      );

      setCreatedDocId(result.docId);
      setCreatedDocLink(result.webViewLink);

      // Auto save to local Archive as Draft
      const newDoc: DokumenKerjasama = {
        id: 'dok-pks-' + Date.now(),
        jenis: 'PKS',
        judul: judulKegiatan || `Perjanjian Kerja Sama dengan ${mitra}`,
        mitra: mitra || 'Pihak Mitra',
        nomorPihak1: 'DRAFT/BPT/PKS/' + new Date().getFullYear(),
        tanggalTtd: 'TIDAK DITEMUKAN',
        tanggalMulai: tanggalMulai || 'TIDAK DITEMUKAN',
        tanggalBerakhir: tanggalBerakhir || 'TIDAK DITEMUKAN',
        jangkaWaktu: jangkaWaktu || '1 tahun',
        ruangLingkup: ruangLingkup || '',
        hakKewajiban: hakKewajiban || '',
        penanggungJawab: penanggungJawab || '',
        dokumenInduk: dokumenInduk || '',
        kategori: kategori,
        namaFile: `${uniformName}.docx`,
        status: 'Draft',
        sumber: 'Google Drive',
        driveFileId: result.docId,
        driveLink: result.webViewLink,
        docId: result.docId,
        versi: [
          {
            versiNomor: 1,
            tanggal: new Date().toISOString(),
            diubahOleh: activeRole,
            catatan: 'Penyusunan draft awal via Gemini AI di Google Docs.',
          },
        ],
        buktiKutipan: {},
        peringatan: ['Draft baru dibuat via Google Docs. Perlu penyuntingan dan telaah reviewer.'],
        rawText: generatedDraft,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onSaveNewPks(newDoc);
    } catch (err: any) {
      setDocsCreationError(err.message || 'Gagal membuat Google Docs.');
    } finally {
      setIsCreatingInDocs(false);
    }
  };

  // Step 4: Finalize PKS (Export to PDF in Final Folder)
  const handleFinalizePks = async () => {
    if (!createdDocId) {
      alert('Berkas Google Docs belum dibuat.');
      return;
    }

    setIsFinalizing(true);
    try {
      const pdfTitle = generateUniformFileName(
        'PKS',
        mitra || 'MITRA',
        tanggalMulai,
        'FINAL',
        settings.polaPenamaan
      );

      const result = await googleDriveService.exportDocToPdfAndSave(
        createdDocId,
        settings.folderFinalId,
        pdfTitle
      );

      setFinalizedPdfLink(result.webViewLink);
      alert('PKS berhasil difinalisasi dan diekspor ke PDF di folder PKS - Final!');
    } catch (err: any) {
      alert('Gagal memfinalisasi dokumen: ' + err.message);
    } finally {
      setIsFinalizing(false);
    }
  };

  // Save to Archive (Local / Demo mode)
  const handleSaveToArchiveDirectly = () => {
    const uniformName = generateUniformFileName(
      'PKS',
      mitra || 'MITRA',
      tanggalMulai,
      '001',
      settings.polaPenamaan
    );

    const newDoc: DokumenKerjasama = {
      id: 'dok-pks-' + Date.now(),
      jenis: 'PKS',
      judul: judulKegiatan || `Perjanjian Kerja Sama dengan ${mitra}`,
      mitra: mitra || 'Pihak Mitra',
      nomorPihak1: '001/BPT.KOMDIGI/PKS/' + new Date().getFullYear(),
      tanggalTtd: 'TIDAK DITEMUKAN',
      tanggalMulai: tanggalMulai || 'TIDAK DITEMUKAN',
      tanggalBerakhir: tanggalBerakhir || 'TIDAK DITEMUKAN',
      jangkaWaktu: jangkaWaktu || '1 tahun',
      ruangLingkup: ruangLingkup || '',
      hakKewajiban: hakKewajiban || '',
      penanggungJawab: penanggungJawab || '',
      dokumenInduk: dokumenInduk || '',
      kategori: kategori,
      namaFile: uniformName,
      status: 'Draft',
      sumber: 'Unggah',
      versi: [
        {
          versiNomor: 1,
          tanggal: new Date().toISOString(),
          diubahOleh: activeRole,
          catatan: 'Draft PKS disusun via Wizard KerjasamaBPT AI.',
        },
      ],
      buktiKutipan: {},
      peringatan: ['DRAFT, PERLU REVIEW MANUSIA'],
      rawText: generatedDraft,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveNewPks(newDoc);
    onNavigateTab('arsip');
  };

  // Render highlighted draft preview (highlighting [ISI: ...] in yellow)
  const renderHighlightedDraft = (text: string) => {
    const parts = text.split(/(\[ISI:[^\]]+\])/g);
    return (
      <div className="font-mono text-xs whitespace-pre-wrap leading-relaxed select-text p-4 bg-white text-slate-800 rounded-lg border border-slate-200">
        {parts.map((p, i) => {
          if (p.startsWith('[ISI:')) {
            return (
              <mark
                key={i}
                className="bg-amber-300 text-amber-950 font-bold px-1 py-0.5 rounded border border-amber-400"
              >
                {p}
              </mark>
            );
          }
          return <span key={i}>{p}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Wizard Step Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Penyusunan Perjanjian Kerja Sama (PKS) Baru
            </h2>
            <p className="text-xs text-slate-500">
              Wizard 4 Langkah: Isi Data &bull; Cek Kelengkapan &bull; Draft AI &bull; Google Docs & Finalisasi
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  step === s
                    ? 'bg-blue-600 text-white shadow-xs'
                    : step > s
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <span>{s}</span>
                <span className="hidden md:inline">
                  {s === 1
                    ? 'Data PKS'
                    : s === 2
                    ? 'Kelengkapan'
                    : s === 3
                    ? 'Draft AI'
                    : 'Google Docs'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STEP 1: Pengisian Data Awal */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Langkah 1: Pengisian Data dan Parameter Kerja Sama
              </h3>
              <p className="text-xs text-slate-500">
                Pilih MoU induk untuk mengisi data mitra secara otomatis, atau lengkapi formulir di bawah.
              </p>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200">
              Langkah 1 dari 4
            </span>
          </div>

          {/* Opsi MoU Induk Dropdown */}
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
            <label className="block text-xs font-bold text-blue-950">
              Pilih MoU Induk dari Arsip (Opsional):
            </label>
            <select
              value={selectedMouId}
              onChange={(e) => handleMouSelect(e.target.value)}
              className="w-full bg-white border border-blue-300 rounded-lg px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Tanpa Dokumen Induk (PKS Mandiri / Langsung) --</option>
              {availableMous.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nomorPihak1} - {m.mitra} ({m.judul.slice(0, 70)}...)
                </option>
              ))}
            </select>
            {selectedMouId && (
              <p className="text-[11px] text-blue-800 font-medium">
                Data mitra dan kategori telah diisi secara otomatis dari MoU induk terpilih.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Mitra & Kategori */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Instansi / Perusahaan Mitra <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={mitra}
                onChange={(e) => setMitra(e.target.value)}
                placeholder="Contoh: PT Telekomunikasi Selular / Universitas Gadjah Mada"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kategori Mitra <span className="text-red-500">*</span>
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {settings.kategoriList.map((kat) => (
                  <option key={kat} value={kat}>
                    {kat}
                  </option>
                ))}
              </select>
            </div>

            {/* Pejabat BPT & Jabatan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pejabat BPT Komdigi</label>
              <input
                type="text"
                value={pejabatBpt}
                onChange={(e) => setPejabatBpt(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jabatan Pejabat BPT</label>
              <input
                type="text"
                value={jabatanBpt}
                onChange={(e) => setJabatanBpt(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Pejabat Mitra & Jabatan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Pejabat Penandatangan Mitra <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={pejabatMitra}
                onChange={(e) => setPejabatMitra(e.target.value)}
                placeholder="Nama lengkap pejabat mitra penandatangan"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jabatan Pejabat Mitra <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={jabatanMitra}
                onChange={(e) => setJabatanMitra(e.target.value)}
                placeholder="Contoh: Direktur Teknologi & Jaringan"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Judul Kegiatan (Colspan 2) */}
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Judul Kegiatan Kerja Sama <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={judulKegiatan}
                onChange={(e) => setJudulKegiatan(e.target.value)}
                placeholder="Contoh: Pengujian Kepatuhan Perangkat Radio Frekuensi 5G Millimeter Wave"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Ruang Lingkup (Colspan 2) */}
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Ruang Lingkup Kegiatan <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={ruangLingkup}
                onChange={(e) => setRuangLingkup(e.target.value)}
                placeholder="1. Pengujian laboratorium; 2. Penyediaan sampel; 3. Penerbitan LHU..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Hak dan Kewajiban (Colspan 2) */}
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Hak dan Kewajiban Para Pihak <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={hakKewajiban}
                onChange={(e) => setHakKewajiban(e.target.value)}
                placeholder="Rincian hak dan kewajiban masing-masing pihak..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Jangka Waktu, Tanggal Mulai, Tanggal Berakhir */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jangka Waktu Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={jangkaWaktu}
                onChange={(e) => setJangkaWaktu(e.target.value)}
                placeholder="Contoh: 1 (satu) tahun"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Rencana Tanggal Mulai & Berakhir <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  placeholder="DD-MM-YYYY"
                  className="w-full font-mono border border-slate-300 rounded-lg px-2 py-2 text-center"
                />
                <input
                  type="text"
                  value={tanggalBerakhir}
                  onChange={(e) => setTanggalBerakhir(e.target.value)}
                  placeholder="DD-MM-YYYY"
                  className="w-full font-mono border border-slate-300 rounded-lg px-2 py-2 text-center"
                />
              </div>
            </div>

            {/* Pembiayaan & PIC */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ketentuan Pembiayaan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={pembiayaan}
                onChange={(e) => setPembiayaan(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Penanggung Jawab (PIC BPT Komdigi) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={penanggungJawab}
                onChange={(e) => setPenanggungJawab(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <span>Lanjut ke Cek Kelengkapan Data</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Pengecekan Kelengkapan Data Wajib PKS */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Langkah 2: Verifikasi Kelengkapan Data Wajib PKS
              </h3>
              <p className="text-xs text-slate-500">
                Data yang belum lengkap akan otomatis menjadi placeholder "[ISI: nama_data]" pada naskah draft.
              </p>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200">
              Langkah 2 dari 4
            </span>
          </div>

          {/* Completeness Progress Bar */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Status Kelengkapan Data Wajib PKS</span>
              <span>{completenessPercent}% Terisi</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  completenessPercent === 100
                    ? 'bg-emerald-500'
                    : completenessPercent > 60
                    ? 'bg-blue-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${completenessPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {missingFields.length === 0
                ? 'Semua data wajib telah lengkap. Siap disusun oleh Gemini AI.'
                : `Terdapat ${missingFields.length} butir data yang masih kosong. Bagian ini akan ditandai dengan placeholder kuning di draft.`}
            </p>
          </div>

          {/* Checklist table */}
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
            {requiredFields.map((field) => {
              const isFilled = !!field.value.trim();
              return (
                <div key={field.key} className="p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    {isFilled ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    )}
                    <span className="font-semibold text-slate-800">{field.label}</span>
                  </div>

                  <div className="text-right">
                    {isFilled ? (
                      <span className="text-slate-600 font-medium truncate max-w-xs block">
                        {field.value}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[10px] font-bold">
                        [ISI: {field.label}]
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {generationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {generationError}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="flex items-center space-x-1 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Data</span>
            </button>

            <button
              onClick={handleGenerateDraft}
              disabled={isGeneratingDraft}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${isGeneratingDraft ? 'animate-spin' : ''}`} />
              <span>{isGeneratingDraft ? 'Menyusun Draft dengan Gemini...' : 'Susun Draft PKS dengan AI'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Pratinjau Draft AI */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  DRAFT, PERLU REVIEW MANUSIA
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Template {settings.versiTemplatePks} &bull; Model {settings.modelName}
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 mt-1">
                Langkah 3: Pratinjau Naskah Draft Perjanjian Kerja Sama
              </h3>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200 self-start sm:self-auto">
              Langkah 3 dari 4
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Naskah disusun secara runtut sesuai template standar naskah dinas PKS BPT Komdigi. Placeholder kuning wajib
            dilengkapi sebelum penandatanganan resmi.
          </p>

          {/* Draft Preview Container with Highlighting */}
          <div className="max-h-[500px] overflow-y-auto border border-slate-200 rounded-lg p-2 bg-slate-50">
            {renderHighlightedDraft(generatedDraft)}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="flex items-center space-x-1 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <button
              onClick={() => setStep(4)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <span>Lanjut ke Pembuatan Google Docs & Arsip</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Google Docs & Finalisasi */}
      {step === 4 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Langkah 4: Pembuatan Berkas Google Docs & Pengarsipan
              </h3>
              <p className="text-xs text-slate-500">
                Buat berkas Google Docs di folder "PKS - Draft" agar staf dan reviewer dapat menyunting langsung secara kolaboratif.
              </p>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold border border-emerald-200">
              Langkah Selesai
            </span>
          </div>

          {/* Option A: Create in Google Docs */}
          <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <HardDrive className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-sm text-blue-950">
                  Buat Dokumen di Google Drive (Folder "{settings.folderDraftNama || 'PKS - Draft'}")
                </h4>
              </div>
              {createdDocLink && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Telah Dibuat di Docs
                </span>
              )}
            </div>

            <p className="text-xs text-blue-900 leading-relaxed">
              Berkas Google Docs akan dibuat sesuai pola penamaan berkas seragam BPT Komdigi. Tautan berkas disimpan
              otomatis ke dalam arsip dengan status <strong>Draft</strong>.
            </p>

            {docsCreationError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {docsCreationError}
              </div>
            )}

            {!createdDocLink ? (
              <button
                onClick={handleCreateInGoogleDocs}
                disabled={isCreatingInDocs}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                <HardDrive className={`w-4 h-4 ${isCreatingInDocs ? 'animate-spin' : ''}`} />
                <span>{isCreatingInDocs ? 'Membuat Berkas di Docs...' : 'Buat Berkas di Google Docs Sekarang'}</span>
              </button>
            ) : (
              <div className="p-4 bg-white rounded-lg border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-800">
                    Berkas Google Docs Siap Disunting:
                  </div>
                  <a
                    href={createdDocLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                  >
                    <span>Buka Google Docs</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-500 font-mono break-all">{createdDocLink}</p>

                {/* Finalize button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-600">
                    Setelah naskah selesai disunting dan disetujui, ekspor ke PDF:
                  </span>
                  <button
                    onClick={handleFinalizePks}
                    disabled={isFinalizing}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition cursor-pointer"
                  >
                    <Download className={`w-3.5 h-3.5 ${isFinalizing ? 'animate-spin' : ''}`} />
                    <span>{isFinalizing ? 'Mengekspor...' : 'Finalkan (Ekspor PDF ke PKS - Final)'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Option B: Direct Save to Local Archive */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800">
                Simpan Langsung ke Arsip Sistem (Mode Mandiri / Demo)
              </div>
              <p className="text-[11px] text-slate-500">
                Menyimpan draft yang dihasilkan ke database lokal browser dengan status Draft untuk ditelaah reviewer.
              </p>
            </div>
            <button
              onClick={handleSaveToArchiveDirectly}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan ke Arsip</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between">
            <button
              onClick={() => setStep(3)}
              className="flex items-center space-x-1 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Pratinjau</span>
            </button>

            <button
              onClick={() => onNavigateTab('arsip')}
              className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              Selesai & Buka Daftar Arsip
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
