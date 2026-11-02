import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MonthlyReportData, Category, AccountWallet } from '../types/finance';
import { formatBulanTahun, formatRupiah, NAMA_BULAN_INDONESIA } from './formatters';

interface ExportPdfOptions {
  reportData: MonthlyReportData;
  categories: Category[];
  accounts: AccountWallet[];
  appName?: string;
  businessName?: string;
}

export function exportMonthlyReportToPdf({
  reportData,
  categories,
  accounts,
  appName = 'BukuKas Pro',
  businessName = 'Keuangan Pribadi & Usaha',
}: ExportPdfOptions): void {
  const { month, year, totalIncome, totalExpense, netSavings, expenseBreakdown, incomeBreakdown, transactions } = reportData;
  const periodTitle = formatBulanTahun(month, year);
  const monthName = NAMA_BULAN_INDONESIA[month - 1] || `${month}`;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  // Document Title & Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(appName.toUpperCase(), 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`${businessName} · Laporan Kas Masuk & Kas Keluar`, 14, 18);
  doc.text(`Periode: ${periodTitle}`, 14, 23);

  const printDateStr = `Dicetak: ${new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
  doc.text(printDateStr, pageWidth - 14, 23, { align: 'right' });

  let startY = 34;

  // Executive Summary Box (3 metric panels)
  const boxWidth = (pageWidth - 28 - 8) / 3;
  const boxHeight = 22;

  // Panel 1: Uang Masuk
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208); // emerald-200
  doc.roundedRect(14, startY, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(21, 128, 61); // emerald-700
  doc.text('TOTAL UANG MASUK', 18, startY + 7);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(formatRupiah(totalIncome), 18, startY + 16);

  // Panel 2: Uang Keluar
  const box2X = 14 + boxWidth + 4;
  doc.setFillColor(254, 242, 242); // rose-50
  doc.setDrawColor(254, 205, 211); // rose-200
  doc.roundedRect(box2X, startY, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(190, 18, 60); // rose-700
  doc.text('TOTAL UANG KELUAR', box2X + 4, startY + 7);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72);
  doc.text(formatRupiah(totalExpense), box2X + 4, startY + 16);

  // Panel 3: Saldo Bersih
  const box3X = box2X + boxWidth + 4;
  const isSurplus = netSavings >= 0;
  if (isSurplus) {
    doc.setFillColor(240, 249, 255); // sky-50
    doc.setDrawColor(186, 230, 253);
    doc.setTextColor(3, 105, 161);
  } else {
    doc.setFillColor(255, 241, 242);
    doc.setDrawColor(254, 205, 211);
    doc.setTextColor(190, 18, 60);
  }
  doc.roundedRect(box3X, startY, boxWidth, boxHeight, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(isSurplus ? 'ARUS KAS BERSIH (SURPLUS)' : 'ARUS KAS BERSIH (DEFISIT)', box3X + 4, startY + 7);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(formatRupiah(netSavings), box3X + 4, startY + 16);

  startY += boxHeight + 8;

  // Breakdown Section: Pengeluaran & Pemasukan per Kategori
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Ringkasan Kategori', 14, startY);
  startY += 3;

  // Table Category Summary
  const expenseRows = expenseBreakdown.slice(0, 8).map((eb, i) => [
    `Pengeluaran #${i + 1}`,
    eb.category.name,
    formatRupiah(eb.totalAmount),
    `${eb.percentage.toFixed(1)}%`,
    `${eb.transactionCount}x`,
  ]);

  const incomeRows = incomeBreakdown.slice(0, 6).map((ib, i) => [
    `Pemasukan #${i + 1}`,
    ib.category.name,
    formatRupiah(ib.totalAmount),
    `${ib.percentage.toFixed(1)}%`,
    `${ib.transactionCount}x`,
  ]);

  autoTable(doc, {
    startY: startY,
    head: [['Tipe', 'Kategori', 'Total Jumlah', 'Porsi %', 'Frekuensi']],
    body: [...expenseRows, ...incomeRows],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      font: 'helvetica',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 55 },
      2: { cellWidth: 38, halign: 'right' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 25, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  // Get current Y after category table
  const finalCatY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : startY + 45;

  // Table of Detailed Transactions
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Daftar Rincian Transaksi Kas', 14, finalCatY);

  const sortedTx = [...transactions].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);

  const txTableData = sortedTx.map((tx, idx) => {
    const cat = categoryMap.get(tx.categoryId);
    const acc = accountMap.get(tx.accountId);
    const isInc = tx.type === 'pemasukan';

    return [
      `${idx + 1}`,
      tx.date,
      isInc ? '+ Masuk' : '- Keluar',
      cat?.name || 'Kategori',
      acc?.name || 'Kas',
      tx.receiptUrl ? 'Ada' : '-',
      tx.note || '-',
      (isInc ? '+ ' : '- ') + formatRupiah(tx.amount),
    ];
  });

  autoTable(doc, {
    startY: finalCatY + 3,
    head: [['No', 'Tanggal', 'Tipe', 'Kategori', 'Akun', 'Nota', 'Catatan', 'Jumlah']],
    body: txTableData,
    theme: 'striped',
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      font: 'helvetica',
      textColor: [15, 23, 42],
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 17, fontStyle: 'bold' },
      3: { cellWidth: 32 },
      4: { cellWidth: 20 },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 40 },
      7: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        if (data.cell.raw === '+ Masuk') {
          data.cell.styles.textColor = [5, 150, 105]; // emerald-600
        } else {
          data.cell.styles.textColor = [225, 29, 72]; // rose-600
        }
      }
      if (data.section === 'body' && data.column.index === 5) {
        if (data.cell.raw === 'Ada') {
          data.cell.styles.textColor = [16, 185, 129]; // emerald-600
          data.cell.styles.fontStyle = 'bold';
        }
      }
      if (data.section === 'body' && data.column.index === 7) {
        const str = String(data.cell.raw || '');
        if (str.startsWith('+')) {
          data.cell.styles.textColor = [5, 150, 105];
        } else {
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 15 },
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);
    doc.text(
      `${appName} · Laporan Kas Otomatis · Hal ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  // Save / Download PDF
  doc.save(`Laporan_Kas_${monthName}_${year}.pdf`);
}
