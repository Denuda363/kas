export const NAMA_BULAN_INDONESIA = [
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

export const NAMA_HARI_INDONESIA = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

/**
 * Format number into Indonesian Rupiah (e.g. Rp 1.500.000)
 */
export function formatRupiah(amount: number, withPrefix = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return withPrefix ? 'Rp 0' : '0';
  }
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';
  return withPrefix ? `${sign}Rp ${formatted}` : `${sign}${formatted}`;
}

/**
 * Clean currency string to plain numeric value
 */
export function parseRupiahInput(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Format date string (YYYY-MM-DD) into Indonesian standard date (e.g. 15 Oktober 2026)
 */
export function formatTanggalIndo(dateStr: string, includeDay = false): string {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, monthIdx, day);
      
      const dayName = includeDay ? `${NAMA_HARI_INDONESIA[dateObj.getDay()]}, ` : '';
      const monthName = NAMA_BULAN_INDONESIA[monthIdx] || parts[1];
      return `${dayName}${day} ${monthName} ${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Format month and year (e.g. 10, 2026 -> Oktober 2026)
 */
export function formatBulanTahun(month: number, year: number): string {
  const mName = NAMA_BULAN_INDONESIA[month - 1] || `Bulan ${month}`;
  return `${mName} ${year}`;
}
