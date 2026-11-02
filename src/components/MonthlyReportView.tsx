import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Scale,
  Percent,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatBulanTahun, formatRupiah, formatTanggalIndo, NAMA_BULAN_INDONESIA } from '../utils/formatters';
import { exportMonthlyReportToExcel } from '../utils/exportExcel';
import { exportMonthlyReportToPdf } from '../utils/exportPdf';
import { CategoryIcon } from './CategoryIcon';
import { Transaction, TransactionType } from '../types/finance';

interface MonthlyReportViewProps {
  onOpenTransactionModal: (type: TransactionType) => void;
  onViewReceipt?: (tx: Transaction) => void;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  onOpenTransactionModal,
  onViewReceipt,
}) => {
  const {
    currentMonth,
    currentYear,
    setCurrentMonth,
    setCurrentYear,
    getMonthlyReport,
    categories,
    accounts,
  } = useFinance();

  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const report = getMonthlyReport(currentMonth, currentYear);
  const { totalIncome, totalExpense, netSavings, savingsRate, expenseBreakdown, incomeBreakdown, transactions } = report;

  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = typeFilter === 'all' || tx.type === typeFilter;
    const cat = categories.find((c) => c.id === tx.categoryId);
    const matchesSearch =
      !searchQuery ||
      tx.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat && cat.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.recipientOrPayer && tx.recipientOrPayer.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleCurrentMonthReset = () => {
    const now = new Date();
    setCurrentMonth(now.getMonth() + 1);
    setCurrentYear(now.getFullYear());
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      exportMonthlyReportToExcel({
        reportData: report,
        categories,
        accounts,
      });
    } catch (err) {
      console.error('Failed to export Excel', err);
      alert('Terjadi kendala saat mengekspor Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = () => {
    setIsExporting(true);
    try {
      exportMonthlyReportToPdf({
        reportData: report,
        categories,
        accounts,
      });
    } catch (err) {
      console.error('Failed to export PDF', err);
      alert('Terjadi kendala saat mengekspor PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 md:pb-6">
      {/* Top Banner & Month Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Laporan Keuangan Bulanan</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
              {formatBulanTahun(currentMonth, currentYear)}
            </h1>
          </div>

          {/* Month Selector Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <select
                value={currentMonth}
                onChange={(e) => setCurrentMonth(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-semibold text-slate-800 px-1.5 py-1 focus:outline-hidden cursor-pointer"
              >
                {NAMA_BULAN_INDONESIA.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
                className="bg-transparent text-xs font-semibold text-slate-800 px-1 py-1 focus:outline-hidden cursor-pointer font-mono"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button
                onClick={handleNextMonth}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleCurrentMonthReset}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap cursor-pointer min-h-[36px]"
            >
              Bulan Ini
            </button>
          </div>
        </div>

        {/* Prominent Export Actions Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <p className="text-[11px] sm:text-xs text-slate-500">
            Ekspor rekapitulasi data kas bulan ini ke Excel atau cetak PDF.
          </p>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:scale-95 border border-emerald-200/80 rounded-xl transition-all shadow-2xs whitespace-nowrap cursor-pointer min-h-[38px]"
              title="Download file spreadsheet Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 active:scale-95 border border-rose-200/80 rounded-xl transition-all shadow-2xs whitespace-nowrap cursor-pointer min-h-[38px]"
              title="Download file dokumen cetak PDF (.pdf)"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 shrink-0" />
              <span>PDF (.pdf)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip - Compact 2x2 grid on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Uang Masuk */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Uang Masuk</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-sm sm:text-xl font-bold font-mono text-emerald-600 mt-1.5 tabular-nums truncate">
            {formatRupiah(totalIncome)}
          </p>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            {incomeBreakdown.length} kategori
          </div>
        </div>

        {/* Total Uang Keluar */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Uang Keluar</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-sm sm:text-xl font-bold font-mono text-rose-600 mt-1.5 tabular-nums truncate">
            {formatRupiah(totalExpense)}
          </p>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            {expenseBreakdown.length} kategori
          </div>
        </div>

        {/* Arus Kas Bersih */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Saldo Bersih</span>
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center ${
              netSavings >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <Scale className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className={`text-sm sm:text-xl font-bold font-mono mt-1.5 tabular-nums truncate ${
            netSavings >= 0 ? 'text-blue-700' : 'text-rose-600'
          }`}>
            {formatRupiah(netSavings)}
          </p>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1 truncate">
            {netSavings >= 0 ? 'Surplus kas' : 'Defisit kas'}
          </div>
        </div>

        {/* Rasio Tabungan */}
        <div className="bg-white p-3 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Rasio Simpan</span>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-sm sm:text-xl font-bold font-mono text-slate-900 mt-1.5 tabular-nums truncate">
            {savingsRate.toFixed(1)}%
          </p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${savingsRate >= 20 ? 'bg-emerald-500' : savingsRate >= 0 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Two Column Breakdown: Pemasukan & Pengeluaran */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Pengeluaran per Kategori */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pengeluaran per Kategori
              </h3>
              <p className="text-xs text-slate-500">Alokasi dana bulan ini</p>
            </div>
            <span className="text-xs font-bold font-mono text-rose-600">
              {formatRupiah(totalExpense)}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {expenseBreakdown.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Belum ada pengeluaran di bulan ini.
              </div>
            ) : (
              expenseBreakdown.map((item) => (
                <div key={item.category.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: item.category.color }}
                      >
                        <CategoryIcon name={item.category.icon} size={11} className="text-white" />
                      </span>
                      <span className="font-semibold text-slate-800 truncate">{item.category.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">({item.transactionCount}x)</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono shrink-0 ml-2">
                      <span className="font-bold text-slate-900">{formatRupiah(item.totalAmount)}</span>
                      <span className="text-[10px] text-slate-400 w-9 text-right">{item.percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.category.color,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pemasukan per Kategori */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Pemasukan per Kategori
              </h3>
              <p className="text-xs text-slate-500">Sumber aliran dana</p>
            </div>
            <span className="text-xs font-bold font-mono text-emerald-600">
              {formatRupiah(totalIncome)}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {incomeBreakdown.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Belum ada pemasukan di bulan ini.
              </div>
            ) : (
              incomeBreakdown.map((item) => (
                <div key={item.category.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: item.category.color }}
                      >
                        <CategoryIcon name={item.category.icon} size={11} className="text-white" />
                      </span>
                      <span className="font-semibold text-slate-800 truncate">{item.category.name}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">({item.transactionCount}x)</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono shrink-0 ml-2">
                      <span className="font-bold text-slate-900">{formatRupiah(item.totalAmount)}</span>
                      <span className="text-[10px] text-slate-400 w-9 text-right">{item.percentage.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.category.color,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Monthly Transactions: Responsive Cards on Mobile + Table on Desktop/Tablet */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Rincian Transaksi Bulan {formatBulanTahun(currentMonth, currentYear)}
            </h3>
            <p className="text-xs text-slate-500">
              {filteredTransactions.length} transaksi ditampilkan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setTypeFilter('pemasukan')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  typeFilter === 'pemasukan'
                    ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Masuk
              </button>
              <button
                onClick={() => setTypeFilter('pengeluaran')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  typeFilter === 'pengeluaran'
                    ? 'bg-white text-rose-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Keluar
              </button>
            </div>

            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-900 focus:bg-white sm:w-44"
              />
            </div>
          </div>
        </div>

        {/* Mobile View: High Legibility Card List (screens < 768px) */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 px-4">
              Tidak ada transaksi kas di bulan ini.
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isInc = tx.type === 'pemasukan';
              const cat = categoryMap.get(tx.categoryId);
              const acc = accountMap.get(tx.accountId);

              return (
                <div key={tx.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat?.color || '#64748b' }}
                    >
                      <CategoryIcon name={cat?.icon || 'Tag'} size={16} className="text-white" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {tx.note || cat?.name}
                        </p>
                        {tx.receiptUrl && (
                          <button
                            onClick={() => onViewReceipt && onViewReceipt(tx)}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-[9px] font-semibold cursor-pointer transition-colors"
                            title="Lihat Bukti Nota"
                          >
                            <FileText className="w-2.5 h-2.5 text-blue-600" />
                            <span>Nota</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 truncate">
                        <span>{formatTanggalIndo(tx.date)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-slate-600 truncate">{cat?.name}</span>
                        <span aria-hidden="true">·</span>
                        <span>{acc?.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-mono text-xs font-bold ${isInc ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isInc ? '+' : '-'} {formatRupiah(tx.amount)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop & Tablet View: Clean High-Density Table (screens >= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Tanggal & Waktu</th>
                <th className="py-3 px-4">Tipe Arus</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Akun / Rekening</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-center w-16">Nota</th>
                <th className="py-3 px-4 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Tidak ada transaksi kas di bulan ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx, idx) => {
                  const isInc = tx.type === 'pemasukan';
                  const cat = categoryMap.get(tx.categoryId);
                  const acc = accountMap.get(tx.accountId);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        <div className="font-medium">{formatTanggalIndo(tx.date)}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{tx.time || '-'}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                            isInc ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isInc ? (
                            <>
                              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Uang Masuk</span>
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                              <span>Uang Keluar</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: cat?.color || '#64748b' }}
                          >
                            <CategoryIcon name={cat?.icon || 'Tag'} size={11} className="text-white" />
                          </span>
                          <span className="font-medium text-slate-800">
                            {cat?.name || 'Lainnya'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {acc?.name || 'Kas Tunai'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-xs">
                        <div className="font-medium truncate">{tx.note || '-'}</div>
                        {tx.recipientOrPayer && (
                          <div className="text-[11px] text-slate-400 truncate">
                            {isInc ? 'Dari: ' : 'Untuk: '}
                            {tx.recipientOrPayer}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {tx.receiptUrl ? (
                          <button
                            onClick={() => onViewReceipt && onViewReceipt(tx)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold cursor-pointer transition-colors shadow-2xs"
                            title="Lihat Bukti Nota Transaksi"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Nota</span>
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span className={isInc ? 'text-emerald-600' : 'text-rose-600'}>
                          {isInc ? '+' : '-'} {formatRupiah(tx.amount)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
