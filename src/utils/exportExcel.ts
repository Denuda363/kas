import * as XLSX from 'xlsx';
import { MonthlyReportData, Category, AccountWallet } from '../types/finance';
import { formatBulanTahun, NAMA_BULAN_INDONESIA } from './formatters';

interface ExportExcelOptions {
  reportData: MonthlyReportData;
  categories: Category[];
  accounts: AccountWallet[];
  appName?: string;
  businessName?: string;
}

/**
 * Applies native Excel currency formatting and numeric type to a cell.
 */
function applyCurrencyFormat(cell: XLSX.CellObject | undefined) {
  if (!cell) return;
  if (typeof cell.v === 'number') {
    cell.t = 'n';
    cell.z = '"Rp" #,##0';
  }
}

/**
 * Dynamically calculates column widths (autofit) based on the actual maximum content length
 * in each column, adding breathing room and respecting min/max boundaries.
 * Skips header titles and section headers so single wide banner cells don't bloat column widths.
 */
function calculateAutoFitCols(
  rows: (string | number)[][],
  minWidths: { [col: number]: number } = {},
  maxWidths: { [col: number]: number } = {}
): { wch: number }[] {
  const colWidths: number[] = [];

  rows.forEach((row) => {
    // Skip empty rows or single-cell title rows
    if (!row || row.length <= 1) return;

    row.forEach((cellVal, colIdx) => {
      if (cellVal === null || cellVal === undefined || cellVal === '') return;

      let len = 0;
      if (typeof cellVal === 'number') {
        // Estimate width of formatted Indonesian Rupiah (e.g., "Rp 12.500.000")
        len = `Rp ${Math.round(cellVal).toLocaleString('id-ID')}`.length;
      } else {
        len = String(cellVal).trim().length;
      }

      colWidths[colIdx] = Math.max(colWidths[colIdx] || 0, len);
    });
  });

  const maxCols = Math.max(...rows.map((r) => r.length), 0);
  const result: { wch: number }[] = [];

  for (let c = 0; c < maxCols; c++) {
    const minW = minWidths[c] || 10;
    const maxW = maxWidths[c] || 60;
    const measuredW = colWidths[c] || minW;
    // Add 4 characters of padding for clear breathing room
    result.push({ wch: Math.min(maxW, Math.max(minW, measuredW + 4)) });
  }

  return result;
}

export function exportMonthlyReportToExcel({
  reportData,
  categories,
  accounts,
  appName = 'BukuKas Pro',
  businessName = 'Keuangan Pribadi & Usaha',
}: ExportExcelOptions): void {
  const {
    month,
    year,
    totalIncome,
    totalExpense,
    netSavings,
    incomeBreakdown,
    expenseBreakdown,
    transactions,
  } = reportData;

  const monthName = NAMA_BULAN_INDONESIA[month - 1] || `${month}`;
  const periodTitle = formatBulanTahun(month, year);
  const printDateStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const masukCount = transactions.filter((t) => t.type === 'pemasukan').length;
  const keluarCount = transactions.filter((t) => t.type === 'pengeluaran').length;
  const notaCount = transactions.filter((t) => !!t.receiptUrl).length;

  // =========================================================================
  // SHEET 1: RINGKASAN KAS (HARMONIOUS 5-COLUMN EXECUTIVE DASHBOARD)
  // =========================================================================
  const expensePct = totalIncome > 0 ? `${((totalExpense / totalIncome) * 100).toFixed(1)}%` : '-';
  const netPct = totalIncome > 0 ? `${((netSavings / totalIncome) * 100).toFixed(1)}%` : '-';
  const savingsPct = totalIncome > 0 ? `${((Math.max(0, netSavings) / totalIncome) * 100).toFixed(1)}%` : '0.0%';

  const summaryRows: (string | number)[][] = [
    [`${appName.toUpperCase()} - ${businessName.toUpperCase()}`],
    [`RINGKASAN EKSEKUTIF ARUS KAS BULANAN`],
    [`Periode: ${periodTitle}`, '', `Tanggal Cetak: ${printDateStr}`],
    [],
    // Section 1: Ringkasan Utama (Uniform 5 Columns: No, Indikator, Nominal, Porsi, Keterangan)
    ['1. INDIKATOR UTAMA KEUANGAN KAS'],
    ['No', 'Indikator Keuangan', 'Nilai Nominal (Rp)', 'Porsi (%)', 'Status & Analisis'],
    [1, 'Total Uang Masuk (Pemasukan)', totalIncome, '100.0%', 'Akumulasi total penerimaan kas bulan ini'],
    [2, 'Total Uang Keluar (Pengeluaran)', totalExpense, expensePct, 'Akumulasi total pengeluaran kas bulan ini'],
    [
      3,
      'Arus Kas Bersih (Net Cash Flow)',
      netSavings,
      netPct,
      netSavings >= 0 ? 'SURPLUS (Kas surplus, penerimaan melebihi belanja)' : 'DEFISIT (Kas defisit, belanja melebihi penerimaan)',
    ],
    [
      4,
      'Rasio Penyimpanan (Savings Rate)',
      Math.max(0, netSavings),
      savingsPct,
      'Persentase kas masuk yang berhasil dipertahankan',
    ],
    [
      5,
      'Total Transaksi Kas',
      transactions.length,
      '-',
      `${masukCount} Transaksi Masuk, ${keluarCount} Transaksi Keluar (${notaCount} dengan Bukti Nota)`,
    ],
    [],
    // Section 2: Top 5 Pengeluaran (Follows the same 5 columns!)
    ['2. TOP 5 KATEGORI PENGELUARAN TERBESAR'],
    ['No', 'Nama Kategori Pengeluaran', 'Jumlah Pengeluaran (Rp)', 'Porsi (%)', 'Frekuensi Transaksi'],
  ];

  if (expenseBreakdown.length === 0) {
    summaryRows.push(['-', 'Tidak ada transaksi pengeluaran pada periode ini', 0, '0.0%', '0 transaksi']);
  } else {
    expenseBreakdown.slice(0, 5).forEach((item, idx) => {
      summaryRows.push([
        idx + 1,
        item.category.name,
        item.totalAmount,
        `${item.percentage.toFixed(1)}%`,
        `${item.transactionCount} transaksi`,
      ]);
    });
  }

  summaryRows.push([]);
  // Section 3: Top 5 Pemasukan (Follows the same 5 columns!)
  summaryRows.push(['3. TOP 5 KATEGORI PEMASUKAN TERBESAR']);
  summaryRows.push(['No', 'Nama Kategori Pemasukan', 'Jumlah Pemasukan (Rp)', 'Porsi (%)', 'Frekuensi Transaksi']);

  if (incomeBreakdown.length === 0) {
    summaryRows.push(['-', 'Tidak ada transaksi pemasukan pada periode ini', 0, '0.0%', '0 transaksi']);
  } else {
    incomeBreakdown.slice(0, 5).forEach((item, idx) => {
      summaryRows.push([
        idx + 1,
        item.category.name,
        item.totalAmount,
        `${item.percentage.toFixed(1)}%`,
        `${item.transactionCount} transaksi`,
      ]);
    });
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);

  // Auto-fit columns based on actual data
  summarySheet['!cols'] = calculateAutoFitCols(summaryRows, {
    0: 6,   // No
    1: 34,  // Indikator / Kategori
    2: 24,  // Nilai Nominal (Rp)
    3: 14,  // Porsi (%)
    4: 38,  // Status & Analisis
  });

  // Row heights for Summary Sheet
  const summaryRowHeights: { hpt?: number }[] = [];
  summaryRows.forEach((row, rIdx) => {
    if (rIdx === 0) summaryRowHeights.push({ hpt: 26 });
    else if (rIdx === 1) summaryRowHeights.push({ hpt: 20 });
    else if (row.length === 1 && typeof row[0] === 'string' && row[0].length > 0) {
      summaryRowHeights.push({ hpt: 22 });
    } else if (row.includes('Indikator Keuangan') || row.includes('Nama Kategori Pengeluaran') || row.includes('Nama Kategori Pemasukan')) {
      summaryRowHeights.push({ hpt: 22 });
    } else {
      summaryRowHeights.push({ hpt: 19 });
    }
  });
  summarySheet['!rows'] = summaryRowHeights;

  // Banner Merges
  summarySheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
  ];

  // Apply currency formatting to numeric values in column C (c=2)
  for (let r = 0; r < summaryRows.length; r++) {
    const cellC = summarySheet[XLSX.utils.encode_cell({ r, c: 2 })];
    if (cellC && typeof cellC.v === 'number') {
      applyCurrencyFormat(cellC);
    }
  }

  // =========================================================================
  // SHEET 2: RINCIAN TRANSAKSI (BUKU KAS UMUM DENGAN SALDO BERJALAN)
  // =========================================================================
  const transactionRows: (string | number)[][] = [
    [`${appName.toUpperCase()} - BUKU TRANSAKSI KAS LENGKAP`],
    [`Periode: ${periodTitle} | Total Transaksi: ${transactions.length} | Dicetak: ${printDateStr}`],
    [],
    [
      'No',
      'Tanggal',
      'Waktu',
      'Tipe Kas',
      'Kategori',
      'Akun / Dompet',
      'Pihak Terkait (Payer/Payee)',
      'Keterangan / Catatan Transaksi',
      'Bukti Nota',
      'Uang Masuk (Rp)',
      'Uang Keluar (Rp)',
      'Saldo Berjalan (Rp)',
    ],
  ];

  // Sort chronologically
  const sortedTx = [...transactions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt
  );

  let runningBalance = 0;

  sortedTx.forEach((tx, idx) => {
    const cat = categoryMap.get(tx.categoryId);
    const acc = accountMap.get(tx.accountId);
    const isIncome = tx.type === 'pemasukan';

    if (isIncome) {
      runningBalance += tx.amount;
    } else {
      runningBalance -= tx.amount;
    }

    transactionRows.push([
      idx + 1,
      tx.date,
      tx.time || '-',
      isIncome ? 'Uang Masuk' : 'Uang Keluar',
      cat?.name || 'Tanpa Kategori',
      acc?.name || 'Kas Tunai',
      tx.recipientOrPayer?.trim() || '-',
      tx.note?.trim() || '-',
      tx.receiptUrl ? 'Ada Nota' : '-',
      isIncome ? tx.amount : 0,
      !isIncome ? tx.amount : 0,
      runningBalance,
    ]);
  });

  // Summary row at bottom of transaction ledger
  transactionRows.push([]);
  transactionRows.push([
    '',
    'TOTAL KESELURUHAN',
    '',
    '',
    '',
    '',
    '',
    `${masukCount} Uang Masuk, ${keluarCount} Uang Keluar`,
    `${notaCount} Berbukti Nota`,
    totalIncome,
    totalExpense,
    netSavings,
  ]);
  transactionRows.push([
    '',
    'STATUS ARUS KAS AKHIR',
    '',
    '',
    '',
    '',
    '',
    netSavings >= 0 ? 'SURPLUS KAS (KAS POSITIF)' : 'DEFISIT KAS (KAS NEGATIF)',
    '',
    netSavings >= 0 ? netSavings : 0,
    netSavings < 0 ? Math.abs(netSavings) : 0,
    netSavings,
  ]);

  const transactionSheet = XLSX.utils.aoa_to_sheet(transactionRows);

  // Auto-fit all 12 columns dynamically based on actual content
  transactionSheet['!cols'] = calculateAutoFitCols(transactionRows, {
    0: 6,   // No
    1: 14,  // Tanggal
    2: 9,   // Waktu
    3: 15,  // Tipe Kas
    4: 24,  // Kategori
    5: 18,  // Akun / Dompet
    6: 22,  // Pihak Terkait
    7: 35,  // Keterangan / Catatan
    8: 14,  // Bukti Nota
    9: 20,  // Uang Masuk (Rp)
    10: 20, // Uang Keluar (Rp)
    11: 22, // Saldo Berjalan (Rp)
  }, {
    7: 50,  // Max width for Keterangan so notes don't stretch indefinitely
  });

  // Row heights for Transactions
  const txRowHeights: { hpt?: number }[] = [];
  transactionRows.forEach((row, rIdx) => {
    if (rIdx === 0) txRowHeights.push({ hpt: 26 });
    else if (rIdx === 1) txRowHeights.push({ hpt: 20 });
    else if (rIdx === 3) txRowHeights.push({ hpt: 24 });
    else if (row.includes('TOTAL KESELURUHAN') || row.includes('STATUS ARUS KAS AKHIR')) {
      txRowHeights.push({ hpt: 22 });
    } else {
      txRowHeights.push({ hpt: 19 });
    }
  });
  transactionSheet['!rows'] = txRowHeights;

  transactionSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
  ];

  // Apply currency formatting to Uang Masuk (c=9), Uang Keluar (c=10), and Saldo Berjalan (c=11)
  for (let r = 4; r < transactionRows.length; r++) {
    for (let c = 9; c <= 11; c++) {
      const cell = transactionSheet[XLSX.utils.encode_cell({ r, c })];
      if (cell && typeof cell.v === 'number') {
        applyCurrencyFormat(cell);
      }
    }
  }

  // =========================================================================
  // SHEET 3: REKAP KATEGORI (7-COLUMN UNIFORM STRUCTURE FOR ALL CATEGORIES)
  // =========================================================================
  const categoryRows: (string | number)[][] = [
    [`${appName.toUpperCase()} - REKAPITULASI KATEGORI LENGKAP`],
    [`Periode: ${periodTitle} | Total Kategori Aktif: ${expenseBreakdown.length + incomeBreakdown.length} | Dicetak: ${printDateStr}`],
    [],
    ['A. RINCIAN KATEGORI PENGELUARAN (URUT DARI TERBESAR)'],
    ['No', 'Tipe Kas', 'Nama Kategori', 'Total Pengeluaran (Rp)', 'Porsi (%)', 'Frekuensi Transaksi', 'Rata-rata per Transaksi (Rp)'],
  ];

  if (expenseBreakdown.length === 0) {
    categoryRows.push(['-', 'Pengeluaran', 'Tidak ada pengeluaran pada periode ini', 0, '0.0%', '0', 0]);
  } else {
    expenseBreakdown.forEach((item, idx) => {
      const avg = item.transactionCount > 0 ? Math.round(item.totalAmount / item.transactionCount) : 0;
      categoryRows.push([
        idx + 1,
        'Pengeluaran',
        item.category.name,
        item.totalAmount,
        `${item.percentage.toFixed(1)}%`,
        item.transactionCount,
        avg,
      ]);
    });
    const avgExpense = keluarCount > 0 ? Math.round(totalExpense / keluarCount) : 0;
    categoryRows.push([
      '',
      'SUBTOTAL',
      'TOTAL PENGELUARAN',
      totalExpense,
      '100.0%',
      keluarCount,
      avgExpense,
    ]);
  }

  categoryRows.push([]);
  categoryRows.push(['B. RINCIAN KATEGORI PEMASUKAN (URUT DARI TERBESAR)']);
  categoryRows.push(['No', 'Tipe Kas', 'Nama Kategori', 'Total Pemasukan (Rp)', 'Porsi (%)', 'Frekuensi Transaksi', 'Rata-rata per Transaksi (Rp)']);

  if (incomeBreakdown.length === 0) {
    categoryRows.push(['-', 'Pemasukan', 'Tidak ada pemasukan pada periode ini', 0, '0.0%', '0', 0]);
  } else {
    incomeBreakdown.forEach((item, idx) => {
      const avg = item.transactionCount > 0 ? Math.round(item.totalAmount / item.transactionCount) : 0;
      categoryRows.push([
        idx + 1,
        'Pemasukan',
        item.category.name,
        item.totalAmount,
        `${item.percentage.toFixed(1)}%`,
        item.transactionCount,
        avg,
      ]);
    });
    const avgIncome = masukCount > 0 ? Math.round(totalIncome / masukCount) : 0;
    categoryRows.push([
      '',
      'SUBTOTAL',
      'TOTAL PEMASUKAN',
      totalIncome,
      '100.0%',
      masukCount,
      avgIncome,
    ]);
  }

  categoryRows.push([]);
  categoryRows.push([
    '',
    'SELISIH',
    'ARUS KAS BERSIH (NET SAVINGS)',
    netSavings,
    totalIncome > 0 ? `${((netSavings / totalIncome) * 100).toFixed(1)}%` : '-',
    transactions.length,
    '',
  ]);

  const categorySheet = XLSX.utils.aoa_to_sheet(categoryRows);

  // Auto-fit for Category sheet
  categorySheet['!cols'] = calculateAutoFitCols(categoryRows, {
    0: 6,   // No
    1: 14,  // Tipe Kas
    2: 30,  // Nama Kategori
    3: 24,  // Total Nominal (Rp)
    4: 14,  // Porsi (%)
    5: 18,  // Frekuensi
    6: 25,  // Rata-rata
  });

  const catRowHeights: { hpt?: number }[] = [];
  categoryRows.forEach((row, rIdx) => {
    if (rIdx === 0) catRowHeights.push({ hpt: 26 });
    else if (rIdx === 1) catRowHeights.push({ hpt: 20 });
    else if (row.includes('RINCIAN KATEGORI PENGELUARAN') || row.includes('RINCIAN KATEGORI PEMASUKAN')) {
      catRowHeights.push({ hpt: 22 });
    } else if (row.includes('Nama Kategori')) {
      catRowHeights.push({ hpt: 22 });
    } else if (row.includes('SUBTOTAL') || row.includes('ARUS KAS BERSIH (NET SAVINGS)')) {
      catRowHeights.push({ hpt: 21 });
    } else {
      catRowHeights.push({ hpt: 19 });
    }
  });
  categorySheet['!rows'] = catRowHeights;

  categorySheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
  ];

  // Format currency on Total Nominal (c=3) and Rata-rata (c=6)
  for (let r = 4; r < categoryRows.length; r++) {
    const cellNominal = categorySheet[XLSX.utils.encode_cell({ r, c: 3 })];
    if (cellNominal && typeof cellNominal.v === 'number') {
      applyCurrencyFormat(cellNominal);
    }
    const cellAvg = categorySheet[XLSX.utils.encode_cell({ r, c: 6 })];
    if (cellAvg && typeof cellAvg.v === 'number') {
      applyCurrencyFormat(cellAvg);
    }
  }

  // =========================================================================
  // SHEET 4: REKAP AKUN & DOMPET KAS
  // =========================================================================
  const accountRows: (string | number)[][] = [
    [`${appName.toUpperCase()} - ARUS KAS MENURUT AKUN & DOMPET`],
    [`Periode: ${periodTitle} | Dicetak: ${printDateStr}`],
    [],
    [
      'No',
      'Nama Akun / Dompet',
      'Jenis Akun',
      'Total Uang Masuk (Rp)',
      'Total Uang Keluar (Rp)',
      'Selisih Kas (Rp)',
      'Jumlah Transaksi',
      'Status Mutasi',
    ],
  ];

  accounts.forEach((acc, idx) => {
    const accTx = transactions.filter((t) => t.accountId === acc.id);
    const accIncome = accTx
      .filter((t) => t.type === 'pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);
    const accExpense = accTx
      .filter((t) => t.type === 'pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);
    const accNet = accIncome - accExpense;

    accountRows.push([
      idx + 1,
      acc.name,
      acc.type === 'tunai' ? 'Kas Tunai' : acc.type === 'bank' ? 'Rekening Bank' : 'E-Wallet / Dompet Digital',
      accIncome,
      accExpense,
      accNet,
      `${accTx.length} transaksi`,
      accNet >= 0 ? 'Surplus' : 'Defisit',
    ]);
  });

  accountRows.push([]);
  accountRows.push([
    '',
    'TOTAL SELURUH AKUN',
    '',
    totalIncome,
    totalExpense,
    netSavings,
    `${transactions.length} transaksi`,
    netSavings >= 0 ? 'Surplus' : 'Defisit',
  ]);

  const accountSheet = XLSX.utils.aoa_to_sheet(accountRows);

  accountSheet['!cols'] = calculateAutoFitCols(accountRows, {
    0: 6,   // No
    1: 24,  // Nama Akun
    2: 24,  // Jenis Akun
    3: 22,  // Uang Masuk
    4: 22,  // Uang Keluar
    5: 22,  // Selisih
    6: 18,  // Jumlah Transaksi
    7: 16,  // Status
  });

  const accRowHeights: { hpt?: number }[] = [];
  accountRows.forEach((row, rIdx) => {
    if (rIdx === 0) accRowHeights.push({ hpt: 26 });
    else if (rIdx === 1) accRowHeights.push({ hpt: 20 });
    else if (rIdx === 3) accRowHeights.push({ hpt: 24 });
    else if (row.includes('TOTAL SELURUH AKUN')) accRowHeights.push({ hpt: 22 });
    else accRowHeights.push({ hpt: 19 });
  });
  accountSheet['!rows'] = accRowHeights;

  accountSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } },
  ];

  for (let r = 4; r < accountRows.length; r++) {
    for (let c = 3; c <= 5; c++) {
      const cell = accountSheet[XLSX.utils.encode_cell({ r, c })];
      if (cell && typeof cell.v === 'number') {
        applyCurrencyFormat(cell);
      }
    }
  }

  // =========================================================================
  // 5. WORKBOOK COMPOSITION
  // =========================================================================
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Kas');
  XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Rincian Transaksi');
  XLSX.utils.book_append_sheet(workbook, categorySheet, 'Rekap Kategori');
  XLSX.utils.book_append_sheet(workbook, accountSheet, 'Rekap Akun & Dompet');

  const fileName = `Laporan_Kas_${monthName}_${year}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
