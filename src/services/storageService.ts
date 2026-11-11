import { DokumenKerjasama, AktivitasLog, PengaturanApp, AntreanItem } from '../types';

const DB_NAME = 'KerjasamaBPT_DB';
const DB_VERSION = 1;

const STORES = {
  DOCUMENTS: 'documents',
  LOGS: 'logs',
  SETTINGS: 'settings',
  QUEUE: 'queue',
};

// Default Settings
export const DEFAULT_SETTINGS: PengaturanApp = {
  googleClientId: '',
  folderSumberId: '',
  folderSumberNama: 'Arsip MoU-PKS (BPT Komdigi)',
  folderDraftId: '',
  folderDraftNama: 'PKS - Draft',
  folderFinalId: '',
  folderFinalNama: 'PKS - Final',
  syncIntervalMenit: 5,
  kategoriList: [
    'Pemerintah Pusat',
    'Pemerintah Daerah',
    'Perguruan Tinggi',
    'BUMN/BUMD',
    'Swasta',
    'Lembaga Internasional',
  ],
  polaPenamaan: '[JENIS]_[MitraSingkat]_[Tahun]_[NomorSingkat]',
  templatePks: `PERJANJIAN KERJA SAMA
ANTARA
BALAI PENGUJIAN TELEKOMUNIKASI
KEMENTERIAN KOMUNIKASI DAN DIGITAL
DENGAN
{{mitra}}
TENTANG
{{judul_kegiatan}}
NOMOR: {{nomor_bpt}}
NOMOR: {{nomor_mitra}}

Pada hari ini, {{hari_tanggal}}, bertempat di Depok/Jakarta, yang bertanda tangan di bawah ini:
1. {{pejabat_bpt}}, dalam hal ini bertindak dalam jabatannya selaku {{jabatan_bpt}}, berkedudukan di Balai Pengujian Telekomunikasi Komdigi, selanjutnya disebut PIHAK PERTAMA.
2. {{pejabat_mitra}}, dalam hal ini bertindak dalam jabatannya selaku {{jabatan_mitra}}, berkedudukan di {{alamat_mitra}}, selanjutnya disebut PIHAK KEDUA.

PIHAK PERTAMA dan PIHAK KEDUA secara bersama-sama disebut PARA PIHAK.

Menyatakan bersepakat mengikatkan diri dalam Perjanjian Kerja Sama ini dengan ketentuan sebagai berikut:

PASAL 1: MAKSUD DAN TUJUAN
(1) Maksud Perjanjian Kerja Sama ini adalah sebagai landasan operasional pelaksanaan kerja sama teknis antara PARA PIHAK.
(2) Tujuan Perjanjian Kerja Sama ini adalah untuk {{tujuan_kegiatan}}.

PASAL 2: DASAR PELAKSANAAN
Perjanjian ini dilaksanakan berdasarkan {{dokumen_induk}} dan peraturan perundang-undangan di bidang standardisasi pengujian telekomunikasi.

PASAL 3: RUANG LINGKUP
Ruang lingkup kerja sama ini meliputi:
{{ruang_lingkup}}

PASAL 4: HAK DAN KEWAJIBAN
(1) Hak dan Kewajiban PIHAK PERTAMA:
{{hak_kewajiban_pihak1}}
(2) Hak dan Kewajiban PIHAK KEDUA:
{{hak_kewajiban_pihak2}}

PASAL 5: JANGKA WAKTU
(1) Perjanjian Kerja Sama ini berlaku untuk jangka waktu {{jangka_waktu}}, terhitung sejak {{tanggal_mulai}} sampai dengan {{tanggal_berakhir}}.
(2) Perjanjian ini dapat diperpanjang atau diakhiri atas kesepakatan tertulis PARA PIHAK paling lambat 30 (tiga puluh) hari kalender sebelum berakhirnya jangka waktu.

PASAL 6: PEMBIAYAAN
Segala biaya yang timbul dalam rangka pelaksanaan kegiatan ini {{pembiayaan}} sesuai ketentuan peraturan perundang-undangan yang berlaku.

PASAL 7: PENANGGUNG JAWAB PELAKSANA
Untuk kelancaran koordinasi, PARA PIHAK menunjuk:
a. PIHAK PERTAMA: {{penanggung_jawab_bpt}}
b. PIHAK KEDUA: {{penanggung_jawab_mitra}}

PASAL 8: KERAHASIAAN DAN PERLINDUNGAN DATA
PARA PIHAK sepakat untuk menjaga kerahasiaan seluruh data, informasi teknis pengujian, dan rahasia dagang yang diperoleh selama pelaksanaan kerja sama ini.

PASAL 9: PERUBAHAN (ADDENDUM)
Hal-hal yang belum diatur atau perubahan atas isi Perjanjian Kerja Sama ini akan diatur kemudian dalam bentuk Perjanjian Tambahan (Addendum) atas dasar musyawarah mufakat.

PASAL 10: PENYELESAIAN PERSELISIHAN
Apabila terjadi perselisihan dalam pelaksanaan perjanjian ini, PARA PIHAK sepakat untuk menyelesaikan secara musyawarah untuk mufakat.

PASAL 11: KEADAAN MEMAKSA (FORCE MAJEURE)
Tidak ada pihak yang dianggap lalai apabila kegagalan pelaksanaan kewajiban disebabkan oleh keadaan di luar kendali wajar (force majeure).

PASAL 12: PENUTUP
Perjanjian Kerja Sama ini dibuat rangkap 2 (dua) asli bermaterai cukup, masing-masing mempunyai kekuatan hukum yang sama.

PIHAK PERTAMA,
{{jabatan_bpt}}
Balai Pengujian Telekomunikasi

({{pejabat_bpt}})

PIHAK KEDUA,
{{jabatan_mitra}}
{{mitra}}

({{pejabat_mitra}})`,
  templateMou: `NOTA KESEPAHAMAN (MEMORANDUM OF UNDERSTANDING)
ANTARA
BALAI PENGUJIAN TELEKOMUNIKASI KEMENTERIAN KOMUNIKASI DAN DIGITAL
DENGAN
{{mitra}}
TENTANG
{{judul_kegiatan}}
NOMOR: {{nomor_bpt}}

Pada hari ini {{hari_tanggal}}, PARA PIHAK bersepakat menyelenggarakan Nota Kesepahaman dalam rangka pengembangan dan pengujian telekomunikasi nasional.`,
  versiTemplatePks: 'v1.2-resmi',
  versiTemplateMou: 'v1.0-resmi',
  versiPrompt: 'v0.1',
  modelName: 'gemini-3.8-flash',
};

// 3 Realistic Sample Documents for Demo Mode
export const SAMPLE_DOCUMENTS: DokumenKerjasama[] = [
  {
    id: 'dok-sample-1',
    jenis: 'MoU',
    judul:
      'Nota Kesepakatan Bersama antara Balai Pengujian Telekomunikasi Kementerian Komunikasi dan Digital dengan Universitas Indonesia tentang Pengembangan Riset, Pengujian Teknologi AI dan SDM Talenta Digital Telekomunikasi',
    mitra: 'Universitas Indonesia',
    nomorPihak1: '120/BPT.KOMDIGI/MoU/03/2026',
    nomorPihak2: 'UI/R-041/KS.01/2026',
    tanggalTtd: '15-03-2026',
    tanggalMulai: '15-03-2026',
    tanggalBerakhir: '15-03-2029',
    jangkaWaktu: '3 (tiga) tahun',
    ruangLingkup:
      '1. Riset bersama pengujian algoritma kecerdasan artifisial telekomunikasi; 2. Pelatihan dan sertifikasi talenta digital bidang RF dan telekomunikasi; 3. Pemanfaatan fasilitas laboratorium anechoic chamber dan emc.',
    hakKewajiban:
      'BPT Komdigi menyediakan akses pengujian laboratorium dan bimbingan teknis; UI menyediakan periset, mahasiswa tugas akhir, dan publikasi ilmiah bersama.',
    penanggungJawab: 'Ir. Hendra Setiawan, M.T. (Ketua Tim Pengujian BPT)',
    kategori: 'Perguruan Tinggi',
    namaFile: 'MOU_UI_2026_120.pdf',
    status: 'Berlaku',
    sumber: 'Unggah',
    driveFileId: '',
    driveLink: '',
    buktiKutipan: {
      mitra: 'Halaman 1 - Pembukaan Konsiderans',
      tanggalBerakhir: 'Pasal 8 Ayat (2) - Masa Berlaku 3 Tahun',
      ruangLingkup: 'Pasal 3 - Ruang Lingkup Riset & Diklat',
    },
    ringkasanAi:
      'Kerja sama strategis BPT Komdigi dengan UI (2026-2029) berfokus pada riset pengujian kecerdasan artifisial telekomunikasi dan pelatihan talenta digital (Pasal 3). BPT menyediakan fasilitas lab EMC/RF, sedangkan UI menyediakan periset dan publikasi (Pasal 4). Berlaku hingga 15-03-2029.',
    versi: [
      {
        versiNomor: 1,
        tanggal: '15-03-2026',
        diubahOleh: 'Staf Administrasi',
        catatan: 'Dokumen final ditandatangani diarsipkan ke sistem.',
      },
    ],
    catatanReviewer: [
      {
        id: 'cat-1',
        penulis: 'Dra. Ratna Dewi',
        peran: 'Reviewer',
        tanggal: '14-03-2026',
        isi: 'Klausul hak kekayaan intelektual (IPR) bersama sudah diverifikasi oleh tim legal BPT.',
        pasalRujukan: 'Pasal 6',
      },
    ],
    peringatan: [],
    createdAt: '2026-03-15T08:00:00.000Z',
    updatedAt: '2026-03-15T08:00:00.000Z',
  },
  {
    id: 'dok-sample-2',
    jenis: 'PKS',
    judul:
      'Perjanjian Kerja Sama antara Balai Pengujian Telekomunikasi Komdigi dengan PT Telekomunikasi Selular tentang Penyediaan Fasilitas Laboratorium Uji Kepatuhan Perangkat Frekuensi Radio 5G Millimeter Wave',
    mitra: 'PT Telekomunikasi Selular',
    nomorPihak1: '045/BPT.KOMDIGI/PKS/12/2025',
    nomorPihak2: 'TELKOMSEL/LEGAL/PKS/89/2025',
    tanggalTtd: '05-12-2025',
    tanggalMulai: '05-12-2025',
    tanggalBerakhir: '05-12-2026', // Critical: Expiring in ~24 days from 10-11-2026!
    jangkaWaktu: '1 (satu) tahun',
    ruangLingkup:
      '1. Pengujian kepatuhan perangkat pemancar 5G mmWave pada frekuensi 26 GHz dan 28 GHz; 2. Penyediaan instrumen uji spectrum analyzer dan signal generator terkalibrasi; 3. Penerbitan laporan hasil uji (LHU) resmi BPT.',
    hakKewajiban:
      'BPT Komdigi melaksanakan pengujian kepatuhan teknis dan menerbitkan LHU; Telkomsel menyediakan sampel perangkat pemancar uji dan memenuhi tarif PNBP sesuai PP yang berlaku.',
    penanggungJawab: 'Bambang Prasetyo, S.T. (Subkoordinator Lab Frekuensi BPT)',
    dokumenInduk: 'MoU Telkom Group - Komdigi No. 012/KOMDIGI/2024',
    kategori: 'BUMN/BUMD',
    namaFile: 'PKS_TELKOMSEL_2025_045.pdf',
    status: 'Berlaku',
    sumber: 'Google Drive',
    driveFileId: 'drive_sample_telkomsel_045',
    driveLink: 'https://drive.google.com/open?id=drive_sample_telkomsel_045',
    buktiKutipan: {
      tanggalBerakhir: 'Pasal 6 Ayat (1) - Jangka waktu 1 tahun berakhir 5 Desember 2026',
      mitra: 'Pihak Kedua Pembukaan',
      pembiayaan: 'Pasal 5 - Tarif PNBP Pengujian Alat Telekomunikasi',
    },
    ringkasanAi:
      'PKS pengujian kepatuhan perangkat pemancar 5G mmWave frekuensi 26/28 GHz antara BPT Komdigi dan PT Telekomunikasi Selular (Pasal 2). BPT menerbitkan LHU resmi dan Telkomsel memenuhi tarif PNBP (Pasal 5). Berakhir pada 05-12-2026 dan memerlukan perpanjangan segera (status kritis).',
    versi: [
      {
        versiNomor: 1,
        tanggal: '05-12-2025',
        diubahOleh: 'Staf Kerjasama',
        catatan: 'Dokumen diimpor tersinkronisasi dari Google Drive.',
      },
    ],
    catatanReviewer: [
      {
        id: 'cat-2',
        penulis: 'Bambang Prasetyo, S.T.',
        peran: 'Reviewer',
        tanggal: '01-11-2026',
        isi: 'Masa berlaku tersisa kurang dari 30 hari kalender. Tim teknis merekomendasikan penerbitan addendum perpanjangan 1 tahun lagi.',
        pasalRujukan: 'Pasal 5 Ayat (2)',
      },
    ],
    peringatan: ['Masa berlaku perjanjian mendekati batas kritis (<= 30 hari). Diperlukan tindakan perpanjangan atau evaluasi segera.'],
    createdAt: '2025-12-05T09:30:00.000Z',
    updatedAt: '2026-11-01T10:15:00.000Z',
  },
  {
    id: 'dok-sample-3',
    jenis: 'PKS',
    judul:
      'Perjanjian Kerja Sama antara Balai Pengujian Telekomunikasi Komdigi dengan Badan Riset dan Inovasi Nasional (BRIN) tentang Audit Standardisasi dan Interoperabilitas Alat Ukur Kalibrasi Optik Telekomunikasi',
    mitra: 'Badan Riset dan Inovasi Nasional',
    nomorPihak1: '088/BPT.KOMDIGI/PKS/01/2026',
    nomorPihak2: 'BRIN/KS-LAB/018/2026',
    tanggalTtd: '25-01-2026',
    tanggalMulai: '25-01-2026',
    tanggalBerakhir: '25-01-2027', // Expiring in ~75 days from 10-11-2026 (<= 90 days)
    jangkaWaktu: '1 (satu) tahun',
    ruangLingkup:
      '1. Verifikasi kalibrasi optical time domain reflectometer (OTDR); 2. Studi banding metode uji transmisi serat optik pita lebar; 3. Audit berkala akreditasi ISO/IEC 17025.',
    hakKewajiban:
      'BPT Komdigi memfasilitasi audit kalibrasi laboratorium; BRIN melaksanakan penjaminan mutu metrologi dan standar frekuensi nasional.',
    penanggungJawab: 'Dr. Siti Nurhaliza, M.Sc. (Koordinator Metrologi BPT)',
    dokumenInduk: 'MoU Komdigi-BRIN No. 008/MOU/2024',
    kategori: 'Pemerintah Pusat',
    namaFile: 'PKS_BRIN_2026_088.pdf',
    status: 'Review',
    sumber: 'Unggah',
    driveFileId: '',
    driveLink: '',
    buktiKutipan: {
      tanggalBerakhir: 'Pasal 7 Ayat (1) - Berlaku 12 bulan berakhir 25 Januari 2027',
      mitra: 'Pihak Kedua Halaman 1',
      ruangLingkup: 'Pasal 2 - Lingkup Kalibrasi Optik',
    },
    ringkasanAi:
      'PKS audit standardisasi alat ukur serat optik antara BPT Komdigi dan BRIN (Pasal 2). Fokus pada penjaminan mutu kalibrasi OTDR dan pemenuhan ISO/IEC 17025 (Pasal 4). Saat ini berstatus Review untuk penelaahan perpanjangan kerja sama.',
    versi: [
      {
        versiNomor: 1,
        tanggal: '25-01-2026',
        diubahOleh: 'Staf Administrasi',
        catatan: 'PKS awal disahkan',
      },
      {
        versiNomor: 2,
        tanggal: '01-11-2026',
        diubahOleh: 'Reviewer Hukum',
        catatan: 'Draft addendum diajukan untuk telaah lanjutan perpanjangan',
      },
    ],
    catatanReviewer: [
      {
        id: 'cat-3',
        penulis: 'Reviewer Hukum',
        peran: 'Reviewer',
        tanggal: '02-11-2026',
        isi: 'Perlu verifikasi revisi jadwal audit kalibrasi optik pada lampiran teknis sebelum disetujui Pimpinan.',
        pasalRujukan: 'Lampiran I',
      },
    ],
    peringatan: ['Masa berlaku segera berakhir (<= 90 hari). Sedang dalam proses review perpanjangan kerja sama.'],
    createdAt: '2026-01-25T11:00:00.000Z',
    updatedAt: '2026-11-02T14:20:00.000Z',
  },
];

class StorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initDB();
  }

  private initDB(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('IndexedDB tidak didukung pada lingkungan ini.');
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.DOCUMENTS)) {
          db.createObjectStore(STORES.DOCUMENTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.LOGS)) {
          db.createObjectStore(STORES.LOGS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORES.QUEUE)) {
          db.createObjectStore(STORES.QUEUE, { keyPath: 'id' });
        }
      };

      request.onsuccess = async (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        await this.seedInitialData();
        resolve();
      };

      request.onerror = (err) => {
        console.error('IndexedDB error:', err);
        resolve();
      };
    });
  }

  private async ensureInit() {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  private async seedInitialData() {
    try {
      const docs = await this.getAllDocuments();
      if (docs.length === 0) {
        for (const doc of SAMPLE_DOCUMENTS) {
          await this.saveDocument(doc);
        }
        await this.addLog({
          id: 'log-init-1',
          waktu: new Date().toISOString(),
          pengguna: 'Sistem',
          peran: 'Admin',
          aksi: 'Inisialisasi Dokumen Contoh BPT Komdigi',
          detail: '3 dokumen contoh fiktif realistis berhasil dimuat untuk Mode Demo.',
          versiPrompt: 'v0.1',
          versiTemplate: 'v1.2-resmi',
          model: 'gemini-3.8-flash',
        });
      }

      const settings = await this.getSettings();
      if (!settings) {
        await this.saveSettings(DEFAULT_SETTINGS);
      }
    } catch (e) {
      console.warn('Gagal melakukan seeding data awal:', e);
    }
  }

  // DOCUMENTS
  async getAllDocuments(): Promise<DokumenKerjasama[]> {
    await this.ensureInit();
    return new Promise((resolve) => {
      if (!this.db) {
        // Fallback localStorage
        try {
          const raw = localStorage.getItem('k_bpt_docs');
          resolve(raw ? JSON.parse(raw) : SAMPLE_DOCUMENTS);
        } catch {
          resolve(SAMPLE_DOCUMENTS);
        }
        return;
      }
      try {
        const tx = this.db.transaction(STORES.DOCUMENTS, 'readonly');
        const store = tx.objectStore(STORES.DOCUMENTS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  async getDocumentById(id: string): Promise<DokumenKerjasama | null> {
    await this.ensureInit();
    return new Promise((resolve) => {
      if (!this.db) {
        const docs = this.getAllDocumentsFallback();
        return resolve(docs.find((d) => d.id === id) || null);
      }
      try {
        const tx = this.db.transaction(STORES.DOCUMENTS, 'readonly');
        const store = tx.objectStore(STORES.DOCUMENTS);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async saveDocument(doc: DokumenKerjasama): Promise<void> {
    await this.ensureInit();
    return new Promise((resolve) => {
      if (!this.db) {
        const docs = this.getAllDocumentsFallback();
        const idx = docs.findIndex((d) => d.id === doc.id);
        if (idx >= 0) docs[idx] = doc;
        else docs.unshift(doc);
        localStorage.setItem('k_bpt_docs', JSON.stringify(docs));
        resolve();
        return;
      }
      try {
        const tx = this.db.transaction(STORES.DOCUMENTS, 'readwrite');
        const store = tx.objectStore(STORES.DOCUMENTS);
        store.put(doc);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async deleteDocument(id: string): Promise<void> {
    await this.ensureInit();
    return new Promise((resolve) => {
      if (!this.db) {
        const docs = this.getAllDocumentsFallback().filter((d) => d.id !== id);
        localStorage.setItem('k_bpt_docs', JSON.stringify(docs));
        resolve();
        return;
      }
      try {
        const tx = this.db.transaction(STORES.DOCUMENTS, 'readwrite');
        const store = tx.objectStore(STORES.DOCUMENTS);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  private getAllDocumentsFallback(): DokumenKerjasama[] {
    try {
      const raw = localStorage.getItem('k_bpt_docs');
      return raw ? JSON.parse(raw) : SAMPLE_DOCUMENTS;
    } catch {
      return SAMPLE_DOCUMENTS;
    }
  }

  // LOGS
  async getAllLogs(): Promise<AktivitasLog[]> {
    await this.ensureInit();
    return new Promise((resolve) => {
      if (!this.db) {
        try {
          const raw = localStorage.getItem('k_bpt_logs');
          resolve(raw ? JSON.parse(raw) : []);
        } catch {
          resolve([]);
        }
        return;
      }
      try {
        const tx = this.db.transaction(STORES.LOGS, 'readonly');
        const store = tx.objectStore(STORES.LOGS);
        const req = store.getAll();
        req.onsuccess = () => {
          const res: AktivitasLog[] = req.result || [];
          res.sort((a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime());
          resolve(res);
        };
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  async addLog(log: AktivitasLog): Promise<void> {
    await this.ensureInit();
    return new Promise((resolve) => {
      if (!this.db) {
        try {
          const logs = JSON.parse(localStorage.getItem('k_bpt_logs') || '[]');
          logs.unshift(log);
          localStorage.setItem('k_bpt_logs', JSON.stringify(logs.slice(0, 500)));
        } catch (e) {
          console.warn(e);
        }
        resolve();
        return;
      }
      try {
        const tx = this.db.transaction(STORES.LOGS, 'readwrite');
        const store = tx.objectStore(STORES.LOGS);
        store.put(log);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // SETTINGS
  async getSettings(): Promise<PengaturanApp> {
    await this.ensureInit();
    return new Promise((resolve) => {
      if (!this.db) {
        try {
          const raw = localStorage.getItem('k_bpt_settings');
          resolve(raw ? JSON.parse(raw) : DEFAULT_SETTINGS);
        } catch {
          resolve(DEFAULT_SETTINGS);
        }
        return;
      }
      try {
        const tx = this.db.transaction(STORES.SETTINGS, 'readonly');
        const store = tx.objectStore(STORES.SETTINGS);
        const req = store.get('app_settings');
        req.onsuccess = () => {
          if (req.result && req.result.data) {
            resolve({ ...DEFAULT_SETTINGS, ...req.result.data });
          } else {
            resolve(DEFAULT_SETTINGS);
          }
        };
        req.onerror = () => resolve(DEFAULT_SETTINGS);
      } catch {
        resolve(DEFAULT_SETTINGS);
      }
    });
  }

  async saveSettings(settings: PengaturanApp): Promise<void> {
    await this.ensureInit();
    return new Promise((resolve) => {
      if (!this.db) {
        localStorage.setItem('k_bpt_settings', JSON.stringify(settings));
        resolve();
        return;
      }
      try {
        const tx = this.db.transaction(STORES.SETTINGS, 'readwrite');
        const store = tx.objectStore(STORES.SETTINGS);
        store.put({ key: 'app_settings', data: settings });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // QUEUE
  async getAllQueue(): Promise<AntreanItem[]> {
    await this.ensureInit();
    return new Promise((resolve) => {
      if (!this.db) {
        try {
          const raw = localStorage.getItem('k_bpt_queue');
          resolve(raw ? JSON.parse(raw) : []);
        } catch {
          resolve([]);
        }
        return;
      }
      try {
        const tx = this.db.transaction(STORES.QUEUE, 'readonly');
        const store = tx.objectStore(STORES.QUEUE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  async saveQueueItem(item: AntreanItem): Promise<void> {
    await this.ensureInit();
    return new Promise((resolve) => {
      if (!this.db) {
        try {
          const q: AntreanItem[] = JSON.parse(localStorage.getItem('k_bpt_queue') || '[]');
          const idx = q.findIndex((i) => i.id === item.id);
          if (idx >= 0) q[idx] = item;
          else q.push(item);
          localStorage.setItem('k_bpt_queue', JSON.stringify(q));
        } catch (e) {
          console.warn(e);
        }
        resolve();
        return;
      }
      try {
        const tx = this.db.transaction(STORES.QUEUE, 'readwrite');
        const store = tx.objectStore(STORES.QUEUE);
        store.put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async deleteQueueItem(id: string): Promise<void> {
    await this.ensureInit();
    return new Promise((resolve) => {
      if (!this.db) {
        try {
          const q: AntreanItem[] = JSON.parse(localStorage.getItem('k_bpt_queue') || '[]');
          localStorage.setItem('k_bpt_queue', JSON.stringify(q.filter((i) => i.id !== id)));
        } catch (e) {
          console.warn(e);
        }
        resolve();
        return;
      }
      try {
        const tx = this.db.transaction(STORES.QUEUE, 'readwrite');
        const store = tx.objectStore(STORES.QUEUE);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  // EXPORT / IMPORT
  async exportToJson(): Promise<string> {
    const documents = await this.getAllDocuments();
    const logs = await this.getAllLogs();
    const settings = await this.getSettings();
    const payload = {
      app: 'KerjasamaBPT',
      exportDate: new Date().toISOString(),
      version: '1.0',
      documents,
      logs,
      settings,
    };
    return JSON.stringify(payload, null, 2);
  }

  async exportToCsv(): Promise<string> {
    const documents = await this.getAllDocuments();
    const headers = [
      'ID',
      'Jenis',
      'Judul',
      'Mitra',
      'Kategori',
      'Nomor Pihak 1',
      'Nomor Pihak 2',
      'Tanggal Mulai',
      'Tanggal Berakhir',
      'Jangka Waktu',
      'Status',
      'Sumber',
      'Nama File',
      'Penanggung Jawab',
      'Dokumen Induk',
    ];

    const escapeCsv = (val: string | undefined | null) => {
      if (!val) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = documents.map((d) => [
      escapeCsv(d.id),
      escapeCsv(d.jenis),
      escapeCsv(d.judul),
      escapeCsv(d.mitra),
      escapeCsv(d.kategori),
      escapeCsv(d.nomorPihak1),
      escapeCsv(d.nomorPihak2),
      escapeCsv(d.tanggalMulai),
      escapeCsv(d.tanggalBerakhir),
      escapeCsv(d.jangkaWaktu),
      escapeCsv(d.status),
      escapeCsv(d.sumber),
      escapeCsv(d.namaFile),
      escapeCsv(d.penanggungJawab),
      escapeCsv(d.dokumenInduk),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  async importFromJson(jsonString: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const data = JSON.parse(jsonString);
      if (!data.documents || !Array.isArray(data.documents)) {
        return { success: false, count: 0, error: 'Format JSON tidak valid (atribut documents tidak ditemukan)' };
      }

      let count = 0;
      for (const doc of data.documents) {
        if (doc.id && doc.judul && doc.mitra) {
          await this.saveDocument(doc);
          count++;
        }
      }

      if (data.settings) {
        await this.saveSettings({ ...DEFAULT_SETTINGS, ...data.settings });
      }

      await this.addLog({
        id: 'log-import-' + Date.now(),
        waktu: new Date().toISOString(),
        pengguna: 'Admin',
        peran: 'Admin',
        aksi: 'Impor Data Arsip JSON',
        detail: `Berhasil mengimpor ${count} dokumen kerja sama dari berkas JSON eksternal.`,
        versiPrompt: 'v0.1',
        versiTemplate: 'v1.2-resmi',
        model: 'gemini-3.8-flash',
      });

      return { success: true, count };
    } catch (e: any) {
      return { success: false, count: 0, error: e.message || 'Gagal memproses JSON' };
    }
  }

  async resetToSampleData(): Promise<void> {
    await this.ensureInit();
    // clear all docs
    const existing = await this.getAllDocuments();
    for (const d of existing) {
      await this.deleteDocument(d.id);
    }
    for (const doc of SAMPLE_DOCUMENTS) {
      await this.saveDocument(doc);
    }
  }
}

export const storageService = new StorageService();
