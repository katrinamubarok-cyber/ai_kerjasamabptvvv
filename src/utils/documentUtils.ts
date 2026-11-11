import { DokumenKerjasama, StatusDokumen } from '../types';

/**
 * Parses date string in DD-MM-YYYY format or ISO format to Date object.
 */
export function parseDateString(dateStr: string): Date | null {
  if (!dateStr || dateStr === 'TIDAK DITEMUKAN' || dateStr.includes('[ISI')) return null;

  // Check DD-MM-YYYY
  const dmyMatch = dateStr.trim().match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    return new Date(year, month, day);
  }

  // Check YYYY-MM-DD
  const ymdMatch = dateStr.trim().match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    return new Date(year, month, day);
  }

  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Calculates remaining days from today.
 */
export function calculateSisaHari(tanggalBerakhirStr: string): number | null {
  const endDate = parseDateString(tanggalBerakhirStr);
  if (!endDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  const diffTime = endDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Computes live status based on dates and existing status.
 * Application calculates validity from today, not AI.
 */
export function computeLiveStatus(doc: DokumenKerjasama): StatusDokumen {
  if (doc.status === 'Draft' || doc.status === 'Review' || doc.status === 'Persetujuan') {
    return doc.status;
  }

  const sisa = calculateSisaHari(doc.tanggalBerakhir);
  if (sisa !== null && sisa < 0) {
    return 'Berakhir';
  }

  return doc.status;
}

/**
 * Formats a Date to Indonesian formal date DD MMMM YYYY
 */
export function formatTanggalIndonesia(dateStr: string): string {
  const d = parseDateString(dateStr);
  if (!d) return dateStr || '-';

  const bulan = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  const day = String(d.getDate()).padStart(2, '0');
  const monthName = bulan[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${monthName} ${year}`;
}

/**
 * Generates uniform file name following rule:
 * [JENIS]_[MitraSingkat]_[Tahun]_[NomorSingkat].pdf
 */
export function generateUniformFileName(
  jenis: string,
  mitra: string,
  tanggalTtdOrMulai: string,
  nomor: string,
  pattern = '[JENIS]_[MitraSingkat]_[Tahun]_[NomorSingkat]'
): string {
  const jns = jenis.toUpperCase() === 'MOU' ? 'MOU' : 'PKS';

  // Shorten mitra: e.g. "PT Telekomunikasi Selular" -> "TELKOMSEL"
  // "Universitas Indonesia" -> "UI"
  // "Badan Riset dan Inovasi Nasional" -> "BRIN"
  let mitraSingkat = mitra
    .replace(/^PT\s+/i, '')
    .replace(/^CV\s+/i, '')
    .replace(/^Badan\s+/i, '')
    .replace(/^Universitas\s+Indonesia/i, 'UI')
    .replace(/^Institut\s+Teknologi\s+Bandung/i, 'ITB')
    .replace(/^Badan\s+Riset\s+dan\s+Inovasi\s+Nasional/i, 'BRIN')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 15)
    .toUpperCase();

  if (!mitraSingkat) mitraSingkat = 'MITRA';

  // Extract year
  const d = parseDateString(tanggalTtdOrMulai);
  const tahun = d ? String(d.getFullYear()) : String(new Date().getFullYear());

  // Shorten nomor: take first numbers or letters
  let nomorSingkat = nomor
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 6)
    .toUpperCase();
  if (!nomorSingkat || nomorSingkat === 'TIDAKD') nomorSingkat = 'DRAFT';

  let result = pattern
    .replace('[JENIS]', jns)
    .replace('[MitraSingkat]', mitraSingkat)
    .replace('[Tahun]', tahun)
    .replace('[NomorSingkat]', nomorSingkat);

  if (!result.endsWith('.pdf')) {
    result += '.pdf';
  }
  return result;
}

/**
 * Check consistency of dates and partner info.
 */
export function checkDocumentConsistency(
  tanggalMulai: string,
  tanggalBerakhir: string,
  mitra: string,
  dokumenInduk?: string
): string[] {
  const warnings: string[] = [];

  const start = parseDateString(tanggalMulai);
  const end = parseDateString(tanggalBerakhir);

  if (start && end && end.getTime() < start.getTime()) {
    warnings.push(
      'INKONSISTENSI TANGGAL: Tanggal berakhir (' +
        tanggalBerakhir +
        ') lebih awal daripada tanggal mulai berlaku (' +
        tanggalMulai +
        '). Harap periksa pasal jangka waktu.'
    );
  }

  if (dokumenInduk && dokumenInduk !== 'TIDAK DITEMUKAN' && dokumenInduk.length > 5) {
    // If dokumenInduk is specified, check if it mentions partner
    const normDoc = dokumenInduk.toLowerCase();
    const normMitra = mitra.toLowerCase();
    // basic check
    const mitraKeywords = normMitra.split(/\s+/).filter((w) => w.length > 3);
    const hasOverlap = mitraKeywords.some((w) => normDoc.includes(w));
    if (!hasOverlap && mitraKeywords.length > 0) {
      warnings.push(
        `PERINGATAN DOKUMEN INDUK: Dokumen induk "${dokumenInduk}" tampaknya tidak mencantumkan nama mitra "${mitra}". Pastikan MoU induk bersesuaian.`
      );
    }
  }

  return warnings;
}
