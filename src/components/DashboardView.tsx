import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  Plus,
  Minus,
  Edit2,
  Trash2,
  ArrowRight,
  CreditCard,
  DollarSign,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lock,
  Calendar,
  Database,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah, formatTanggalIndo, formatBulanTahun, NAMA_BULAN_INDONESIA } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { Transaction, TransactionType } from '../types/finance';

interface DashboardViewProps {
  onOpenTransactionModal: (type: TransactionType, tx?: Transaction) => void;
  onNavigateToReports: () => void;
  onNavigateToTransactions: () => void;
  onNavigateToCategories: () => void;
  onViewReceipt?: (tx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenTransactionModal,
  onNavigateToReports,
  onNavigateToTransactions,
  onNavigateToCategories,
  onViewReceipt,
}) => {
  const {
    transactions,
    categories,
    accounts,
    currentMonth,
    currentYear,
    setCurrentMonth,
    setCurrentYear,
    activeReport,
    deleteTransaction,
    isAdmin,
    openPinModal,
    openFirebaseModal,
    firebaseInfo,
  } = useFinance();

  // Overall Net Balance from all transactions
  const totalAllIncome = transactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalAllExpense = transactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = totalAllIncome - totalAllExpense;

  // Account balances
  const accountBalances = accounts.map((acc) => {
    const accTx = transactions.filter((t) => t.accountId === acc.id);
    const inc = accTx.filter((t) => t.type === 'pemasukan').reduce((s, t) => s + t.amount, 0);
    const exp = accTx.filter((t) => t.type === 'pengeluaran').reduce((s, t) => s + t.amount, 0);
    return {
      ...acc,
      balance: inc - exp,
      txCount: accTx.length,
    };
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const recentTransactions = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .slice(0, 6);

  // Month navigation handlers
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

  // Last 6 months trend calculation
  const monthsTrend = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const prefix = `${y}-${String(m).padStart(2, '0')}`;
    const mTx = transactions.filter((t) => t.date.startsWith(prefix));
    const inc = mTx.filter((t) => t.type === 'pemasukan').reduce((s, t) => s + t.amount, 0);
    const exp = mTx.filter((t) => t.type === 'pengeluaran').reduce((s, t) => s + t.amount, 0);

    monthsTrend.push({
      label: `${NAMA_BULAN_INDONESIA[m - 1].substring(0, 3)}`,
      fullLabel: `${NAMA_BULAN_INDONESIA[m - 1]} ${y}`,
      income: inc,
      expense: exp,
      net: inc - exp,
    });
  }

  const maxTrendVal = Math.max(
    ...monthsTrend.map((m) => Math.max(m.income, m.expense)),
    1000000
  );

  return (
    <div className="space-y-3.5 sm:space-y-5 pb-6">
      {/* Top Header: Period Selector & Mode Indicator */}
      <div className="flex items-center justify-between gap-2">
        {/* Compact Period Selector */}
        <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-xl p-1 shadow-2xs">
          <button
            onClick={handlePrevMonth}
            className="p-1 sm:p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="Bulan Sebelumnya"
            aria-label="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-1.5 sm:px-2 text-xs font-semibold text-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{formatBulanTahun(currentMonth, currentYear)}</span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-1 sm:p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            title="Bulan Berikutnya"
            aria-label="Bulan Berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Firebase Status & Ping Button */}
          <button
            onClick={openFirebaseModal}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-white hover:bg-slate-50 text-slate-700 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs transition-colors cursor-pointer"
            title="Database Firebase Cloud Firestore Realtime - Klik untuk Rincian"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <Database className="w-3 h-3 text-emerald-600 hidden xs:inline" />
            <span className="font-semibold text-slate-800 text-[11px]">Firebase</span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200/50">
              Realtime
            </span>
          </button>

          {/* Quiet Mode Indicator */}
          {!isAdmin ? (
            <button
              onClick={() => openPinModal('Masukkan PIN Admin untuk mencatat atau mengubah data transaksi.')}
              className="flex items-center gap-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200/70 transition-colors cursor-pointer"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span className="hidden xs:inline">Lihat</span>
              <span className="font-semibold text-slate-900 underline ml-0.5">PIN</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/60 font-semibold px-2 py-1.5 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px]">Admin</span>
            </div>
          )}
        </div>
      </div>

      {/* Hero Financial Overview Cards - Adaptively 2-col on Mobile, 3-col on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Saldo Card (Spans full width on mobile/tablet) */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider text-[10px] sm:text-[11px]">
                Total Saldo Kas Tersedia
              </span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold font-mono mt-1.5 sm:mt-2 text-white tracking-tight tabular-nums">
              {formatRupiah(totalBalance)}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 sm:mt-1.5">
              <span>{transactions.length} total transaksi</span>
              <span aria-hidden="true">·</span>
              <span>{accounts.length} dompet</span>
            </div>
          </div>

          {/* Quick Dual Actions */}
          <div className="mt-3.5 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-800">
            {isAdmin ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOpenTransactionModal('pemasukan')}
                  className="flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer min-h-[38px] sm:min-h-[42px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Uang Masuk</span>
                </button>
                <button
                  onClick={() => onOpenTransactionModal('pengeluaran')}
                  className="flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-3 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer min-h-[38px] sm:min-h-[42px]"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>- Uang Keluar</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => openPinModal('Masukkan PIN Admin untuk mencatat arus uang masuk atau keluar.')}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-xl transition-all cursor-pointer min-h-[38px]"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Buka Akses Admin untuk Mencatat Kas</span>
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Split for Monthly Cash Flow on Mobile */}
        <div className="grid grid-cols-2 lg:contents gap-2.5 sm:gap-4">
          {/* Uang Masuk Bulan Ini */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Uang Masuk
                </span>
                <span className="p-1 sm:p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold font-mono text-emerald-600 mt-1.5 sm:mt-2 tabular-nums truncate">
                {formatRupiah(activeReport.totalIncome)}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
                {activeReport.incomeBreakdown.reduce((sum, item) => sum + item.transactionCount, 0)} transaksi
              </p>
            </div>
            <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs text-slate-500">
              <span className="hidden xs:inline">Dominan:</span>
              <span className="font-semibold text-slate-800 truncate">
                {activeReport.incomeBreakdown[0]?.category.name || '-'}
              </span>
            </div>
          </div>

          {/* Uang Keluar Bulan Ini */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Uang Keluar
                </span>
                <span className="p-1 sm:p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold font-mono text-rose-600 mt-1.5 sm:mt-2 tabular-nums truncate">
                {formatRupiah(activeReport.totalExpense)}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
                {activeReport.expenseBreakdown.reduce((sum, item) => sum + item.transactionCount, 0)} transaksi
              </p>
            </div>
            <div className="mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs text-slate-500">
              <span className="hidden xs:inline">Terbesar:</span>
              <span className="font-semibold text-slate-800 truncate">
                {activeReport.expenseBreakdown[0]?.category.name || '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Trend & Account Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-5">
        {/* Trend Arus Kas 6 Bulan Terakhir */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                Tren Arus Kas (6 Bulan)
              </h3>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Perbandingan pemasukan vs pengeluaran</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] self-start sm:self-auto">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-slate-600">Masuk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-rose-400 rounded-full" />
                <span className="text-slate-600">Keluar</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization - Optimized for mobile viewports */}
          <div className="pt-2 pb-1">
            <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-32 sm:h-40 border-b border-slate-100 pb-2">
              {monthsTrend.map((m, idx) => {
                const incHeight = maxTrendVal > 0 ? (m.income / maxTrendVal) * 100 : 0;
                const expHeight = maxTrendVal > 0 ? (m.expense / maxTrendVal) * 100 : 0;

                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-24 sm:h-32">
                      <div
                        className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all"
                        style={{ height: `${Math.max(incHeight, 4)}%` }}
                        title={`${m.fullLabel} Masuk: ${formatRupiah(m.income)}`}
                      />
                      <div
                        className="w-1/2 bg-rose-400 hover:bg-rose-500 rounded-t transition-all"
                        style={{ height: `${Math.max(expHeight, 4)}%` }}
                        title={`${m.fullLabel} Keluar: ${formatRupiah(m.expense)}`}
                      />
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 mt-1.5 truncate w-full text-center">
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Saldo per Rekening / Dompet - Mobile Swipeable or Desktop List */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">Rekening & Dompet</h3>
              <span className="text-[11px] text-slate-400">{accounts.length} Akun</span>
            </div>

            {/* Mobile swipeable strip / Desktop vertical list */}
            <div className="flex overflow-x-auto sm:overflow-visible gap-2 sm:space-y-2 sm:block pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
              {accountBalances.map((acc) => (
                <div
                  key={acc.id}
                  className="min-w-[140px] sm:min-w-0 flex-shrink-0 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200/70 flex items-center justify-center text-slate-700 shadow-2xs shrink-0">
                      {acc.type === 'tunai' ? (
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      ) : acc.type === 'bank' ? (
                        <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-[11px] sm:text-xs font-semibold text-slate-900 truncate">{acc.name}</p>
                      <p className="text-[10px] text-slate-400">{acc.txCount} tx</p>
                    </div>
                  </div>
                  <p className="text-[11px] sm:text-xs font-bold font-mono text-slate-800 shrink-0 ml-1 tabular-nums">
                    {formatRupiah(acc.balance)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onNavigateToCategories}
            className="mt-3 pt-2 sm:pt-3 border-t border-slate-100 text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center justify-between cursor-pointer"
          >
            <span>Kelola Kategori</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Transaksi Kas Terakhir */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-3.5 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">Transaksi Terkini</h3>
            <p className="text-[10px] sm:text-xs text-slate-500">Arus kas mutakhir</p>
          </div>
          <button
            onClick={onNavigateToTransactions}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Semua</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentTransactions.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Belum ada transaksi kas yang dicatat.
            </div>
          ) : (
            recentTransactions.map((tx) => {
              const isInc = tx.type === 'pemasukan';
              const cat = categoryMap.get(tx.categoryId);
              const acc = accountMap.get(tx.accountId);

              return (
                <div
                  key={tx.id}
                  className="p-3 sm:p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat?.color || '#64748b' }}
                    >
                      <CategoryIcon name={cat?.icon || 'Tag'} size={14} className="text-white" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {tx.note || cat?.name || 'Transaksi'}
                        </p>
                        {tx.receiptUrl && (
                          <button
                            onClick={() => onViewReceipt && onViewReceipt(tx)}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[9px] font-medium cursor-pointer transition-colors shrink-0"
                            title="Lihat Bukti Nota"
                          >
                            <FileText className="w-2.5 h-2.5 text-blue-600" />
                            <span>Nota</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                        <span>{formatTanggalIndo(tx.date)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{cat?.name}</span>
                        {acc?.name && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-400 truncate">{acc.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                    <span
                      className={`font-mono text-xs sm:text-sm font-semibold tabular-nums ${
                        isInc ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isInc ? '+' : '-'} {formatRupiah(tx.amount)}
                    </span>
                    {isAdmin && (
                      <div className="flex items-center">
                        <button
                          onClick={() => onOpenTransactionModal(tx.type, tx)}
                          className="p-1 sm:p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
                          title="Ubah Transaksi"
                          aria-label="Ubah"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus transaksi "${tx.note || cat?.name}"?`)) {
                              deleteTransaction(tx.id);
                            }
                          }}
                          className="p-1 sm:p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer min-w-[28px] min-h-[28px] flex items-center justify-center"
                          title="Hapus Transaksi"
                          aria-label="Hapus"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
