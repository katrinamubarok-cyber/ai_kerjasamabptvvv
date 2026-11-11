export type UserRole = 'Staf' | 'Reviewer' | 'Pimpinan' | 'Admin';

export type StatusDokumen =
  | 'Draft'
  | 'Review'
  | 'Persetujuan'
  | 'Ditandatangani'
  | 'Berlaku'
  | 'Berakhir';

export type JenisDokumen = 'MoU' | 'PKS';

export type SumberDokumen = 'Unggah' | 'Google Drive';

export interface VersiDokumen {
  versiNomor: number;
  tanggal: string;
  diubahOleh: string;
  catatan: string;
  fileId?: string;
  namaFile?: string;
}

export interface CatatanReviewer {
  id: string;
  penulis: string;
  peran: UserRole;
  tanggal: string;
  isi: string;
  pasalRujukan?: string;
}

export interface PihakKerjasama {
  nama: string;
  diwakili_oleh: string;
  jabatan: string;
}

export interface KutipanItem {
  field: string;
  pasal_atau_halaman: string;
  kutipan_teks: string;
}

export interface TindakLanjut {
  status: 'Perpanjang' | 'Evaluasi' | 'Arsipkan';
  tanggal: string;
  catatan: string;
  petugas: string;
}

export interface DokumenKerjasama {
  id: string;
  jenis: JenisDokumen;
  judul: string;
  mitra: string;
  nomorPihak1: string;
  nomorPihak2?: string;
  tanggalTtd: string;
  tanggalMulai: string;
  tanggalBerakhir: string;
  jangkaWaktu: string;
  ruangLingkup: string;
  hakKewajiban: string;
  penanggungJawab: string;
  dokumenInduk?: string;
  kategori: string;
  namaFile: string;
  status: StatusDokumen;
  sumber: SumberDokumen;
  driveFileId?: string;
  driveLink?: string;
  docId?: string;
  versi: VersiDokumen[];
  buktiKutipan: Record<string, string>; // e.g. { tanggalBerakhir: "Pasal 5 ayat 1", mitra: "Halaman 1 Pembukaan" }
  kutipanDetail?: KutipanItem[];
  peringatan: string[];
  tindakLanjut?: TindakLanjut;
  catatanReviewer?: CatatanReviewer[];
  ringkasanAi?: string;
  rawText?: string;
  fileDataUrl?: string; // base64 or object url for manual upload preview
  isDeletedInDrive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AktivitasLog {
  id: string;
  waktu: string;
  pengguna: string;
  peran: UserRole;
  aksi: string;
  dokumenId?: string;
  detail: string;
  versiPrompt: string;
  versiTemplate: string;
  model: string;
}

export interface AntreanItem {
  id: string;
  namaFile: string;
  ukuran: number;
  mimeType: string;
  sumber: SumberDokumen;
  status: 'Menunggu' | 'Memproses' | 'Perlu verifikasi' | 'Selesai' | 'Gagal';
  driveFileId?: string;
  pesanError?: string;
  dataEkstraksi?: any;
  rawText?: string;
  pdfBase64?: string;
  progress: number;
  ditambahkanPada: string;
}

export interface PengaturanApp {
  googleClientId: string;
  folderSumberId: string;
  folderSumberNama: string;
  folderDraftId: string;
  folderDraftNama: string;
  folderFinalId: string;
  folderFinalNama: string;
  syncIntervalMenit: number;
  kategoriList: string[];
  polaPenamaan: string;
  templatePks: string;
  templateMou: string;
  versiTemplatePks: string;
  versiTemplateMou: string;
  versiPrompt: string;
  modelName: string;
}

export interface ExtractionResult {
  jenis_dokumen: 'MoU' | 'PKS';
  judul: string;
  nomor: string;
  nomor_pihak_kedua?: string;
  para_pihak: PihakKerjasama[];
  tanggal_penandatanganan: string;
  tanggal_mulai_berlaku: string;
  tanggal_berakhir: string;
  jangka_waktu: string;
  ruang_lingkup_ringkas: string;
  hak_dan_kewajiban_ringkas: string;
  penanggung_jawab_bpt_komdigi: string;
  dokumen_induk?: string;
  kategori_usulan: string;
  usulan_nama_file: string;
  kutipan_bukti: KutipanItem[];
  bidang_tidak_ditemukan: string[];
  peringatan: string[];
}
