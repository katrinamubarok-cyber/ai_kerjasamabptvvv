import React, { useState } from 'react';
import { PengaturanApp, UserRole } from '../types';
import {
  Settings,
  HardDrive,
  Save,
  RotateCcw,
  Check,
  AlertTriangle,
  FolderOpen,
  FileCode,
  Layers,
  Cpu,
  Clock,
  Plus,
  Trash2,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

interface SettingsViewProps {
  settings: PengaturanApp;
  activeRole: UserRole;
  onSaveSettings: (newSettings: PengaturanApp) => void;
  onResetSampleData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  activeRole,
  onSaveSettings,
  onResetSampleData,
}) => {
  const isAdmin = activeRole === 'Admin';

  const [formSettings, setFormSettings] = useState<PengaturanApp>({ ...settings });
  const [newCategory, setNewCategory] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    onSaveSettings(formSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddCategory = () => {
    if (!newCategory.trim() || !isAdmin) return;
    if (formSettings.kategoriList.includes(newCategory.trim())) {
      alert('Kategori sudah ada dalam daftar.');
      return;
    }
    setFormSettings((prev) => ({
      ...prev,
      kategoriList: [...prev.kategoriList, newCategory.trim()],
    }));
    setNewCategory('');
  };

  const handleRemoveCategory = (cat: string) => {
    if (!isAdmin) return;
    setFormSettings((prev) => ({
      ...prev,
      kategoriList: prev.kategoriList.filter((c) => c !== cat),
    }));
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">
                Pengaturan Sistem & Konfigurasi Integrasi
              </h2>
              {!isAdmin && (
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                  Hanya Baca (Perlu Hak Admin)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola Google OAuth Client ID, folder Google Drive, interval sinkronisasi, aturan penamaan, dan template naskah dinas.
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1">
                <Check className="w-4 h-4" />
                <span>Pengaturan Tersimpan!</span>
              </span>
            )}
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Konfigurasi</span>
            </button>
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p>
            Anda sedang menggunakan peran <strong>{activeRole}</strong>. Halaman Pengaturan hanya dapat diedit oleh peran <strong>Admin</strong>. Silakan ubah peran pengguna di pojok kanan atas menjadi Admin jika Anda perlu mengubah pengaturan.
          </p>
        </div>
      )}

      {/* SECTION 1: Google OAuth & Google Drive */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <HardDrive className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-sm text-slate-900">
            Integrasi Google Drive & Google Identity Services (OAuth 2.0)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Client ID */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-800">
                Google OAuth Client ID (Web Application)
              </label>
              <span className="text-[10px] text-slate-400">
                Disimpan aman di storage browser, tidak permanen di kode
              </span>
            </div>
            <input
              type="text"
              disabled={!isAdmin}
              value={formSettings.googleClientId}
              onChange={(e) =>
                setFormSettings((prev) => ({ ...prev, googleClientId: e.target.value.trim() }))
              }
              placeholder="Contoh: 1234567890-abcdef.apps.googleusercontent.com"
              className="w-full font-mono text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Jika kolom ini kosong, aplikasi berjalan dalam <strong>MODE DEMO</strong> (unggah manual saja dan tombol Drive dinonaktifkan dengan panduan).
            </p>
          </div>

          {/* Folder Sumber (Arsip MoU-PKS) */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              ID Folder Sumber Arsip (Drive)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={formSettings.folderSumberId}
              onChange={(e) =>
                setFormSettings((prev) => ({ ...prev, folderSumberId: e.target.value.trim() }))
              }
              placeholder="ID Folder Google Drive Sumber (misal: 1A2B3C...)"
              className="w-full font-mono text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
            <input
              type="text"
              disabled={!isAdmin}
              value={formSettings.folderSumberNama}
              onChange={(e) =>
                setFormSettings((prev) => ({ ...prev, folderSumberNama: e.target.value }))
              }
              placeholder="Nama Label Folder (misal: Arsip MoU-PKS)"
              className="w-full mt-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>

          {/* Folder Draft (PKS - Draft) */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              ID Folder Draft (PKS - Draft)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={formSettings.folderDraftId}
              onChange={(e) =>
                setFormSettings((prev) => ({ ...prev, folderDraftId: e.target.value.trim() }))
              }
              placeholder="ID Folder Draft Google Docs (misal: 1D2E3F...)"
              className="w-full font-mono text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
            <input
              type="text"
              disabled={!isAdmin}
              value={formSettings.folderDraftNama}
              onChange={(e) =>
                setFormSettings((prev) => ({ ...prev, folderDraftNama: e.target.value }))
              }
              placeholder="Nama Label Folder Draft"
              className="w-full mt-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>

          {/* Folder Final (PKS - Final) */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              ID Folder Final (PKS - Final)
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={formSettings.folderFinalId}
              onChange={(e) =>
                setFormSettings((prev) => ({ ...prev, folderFinalId: e.target.value.trim() }))
              }
              placeholder="ID Folder Ekspor PDF Final"
              className="w-full font-mono text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
            <input
              type="text"
              disabled={!isAdmin}
              value={formSettings.folderFinalNama}
              onChange={(e) =>
                setFormSettings((prev) => ({ ...prev, folderFinalNama: e.target.value }))
              }
              placeholder="Nama Label Folder Final"
              className="w-full mt-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
            />
          </div>

          {/* Interval Sinkronisasi Otomatis */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Interval Sinkronisasi Otomatis
            </label>
            <select
              disabled={!isAdmin}
              value={formSettings.syncIntervalMenit}
              onChange={(e) =>
                setFormSettings((prev) => ({
                  ...prev,
                  syncIntervalMenit: parseInt(e.target.value, 10),
                }))
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            >
              <option value={1}>Tiap 1 Menit (Cepat)</option>
              <option value={5}>Tiap 5 Menit (Standar BPT)</option>
              <option value={10}>Tiap 10 Menit</option>
              <option value={15}>Tiap 15 Menit</option>
              <option value={30}>Tiap 30 Menit</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: Kategori & Pola Penamaan Berkas */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Layers className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-sm text-slate-900">
            Standar Kategori Mitra & Aturan Penamaan Berkas
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          {/* Kategori Management */}
          <div>
            <label className="block font-bold text-slate-800 mb-2">Daftar Kategori Mitra:</label>
            <div className="space-y-1.5 mb-3">
              {formSettings.kategoriList.map((kat) => (
                <div
                  key={kat}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <span className="font-medium text-slate-800">{kat}</span>
                  {isAdmin && formSettings.kategoriList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(kat)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isAdmin && (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Tambah kategori baru..."
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>
            )}
          </div>

          {/* Aturan Penamaan File */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800">
              Format Aturan Penamaan Berkas Seragam:
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={formSettings.polaPenamaan}
              onChange={(e) =>
                setFormSettings((prev) => ({ ...prev, polaPenamaan: e.target.value }))
              }
              className="w-full font-mono text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            />
            <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-600 space-y-1 font-mono">
              <div>Tag Variabel:</div>
              <div>- [JENIS]: MoU atau PKS</div>
              <div>- [MitraSingkat]: Singkatan resmi nama mitra (misal: TELKOMSEL, UI, BRIN)</div>
              <div>- [Tahun]: Tahun pelaksanaan (misal: 2026)</div>
              <div>- [NomorSingkat]: Bagian nomor surat dokumen</div>
              <div className="text-blue-700 font-bold mt-1">
                Contoh Hasil: PKS_TELKOMSEL_2026_045.pdf
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Editor Template PKS & MoU */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <FileCode className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Editor Template Standar Naskah Dinas PKS
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Versi Template:</span>
            <input
              type="text"
              disabled={!isAdmin}
              value={formSettings.versiTemplatePks}
              onChange={(e) =>
                setFormSettings((prev) => ({ ...prev, versiTemplatePks: e.target.value }))
              }
              className="w-24 font-mono text-xs border border-slate-300 rounded px-2 py-0.5 text-center disabled:bg-slate-100"
            />
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Template PKS baku memuat 12 Pasal standar: Pembukaan, Pasal 1 Maksud dan Tujuan, Pasal 2 Dasar Pelaksanaan, Pasal 3 Ruang Lingkup, Pasal 4 Hak dan Kewajiban, Pasal 5 Jangka Waktu, Pasal 6 Pembiayaan, Pasal 7 Penanggung Jawab, Pasal 8 Kerahasiaan, Pasal 9 Perubahan, Pasal 10 Penyelesaian Perselisihan, Pasal 11 Force Majeure, Pasal 12 Penutup. Gunakan tag format <code>&#123;&#123;nama_data&#125;&#125;</code>.
        </p>

        <textarea
          rows={12}
          disabled={!isAdmin}
          value={formSettings.templatePks}
          onChange={(e) =>
            setFormSettings((prev) => ({ ...prev, templatePks: e.target.value }))
          }
          className="w-full font-mono text-xs border border-slate-300 rounded-lg p-3 leading-relaxed outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 select-text"
        />
      </div>

      {/* SECTION 4: Versi Prompt & Model AI */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Cpu className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-sm text-slate-900">
            Spesifikasi Prompt & Model Gemini AI
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">Versi Prompt BPT</span>
            <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
              {formSettings.versiPrompt} (Tanam di Sistem)
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">Model AI Aktif</span>
            <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
              {formSettings.modelName}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold block uppercase">Format Ekstraksi</span>
            <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
              Structured JSON Schema
            </span>
          </div>
        </div>

        {/* Reset to Sample Data */}
        {isAdmin && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-600">
              Kembalikan arsip dan konfigurasi ke 3 dokumen contoh realistis BPT Komdigi:
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('Yakin ingin mereset seluruh arsip ke 3 dokumen contoh awal?')) {
                  onResetSampleData();
                }
              }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
              <span>Reset Data Contoh BPT</span>
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Seluruh Pengaturan</span>
          </button>
        </div>
      )}
    </form>
  );
};
