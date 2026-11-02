import React, { useState } from 'react';
import {
  Search,
  Plus,
  Minus,
  Edit2,
  Trash2,
  ArrowUpDown,
  FileText,
  Lock,
  X,
  Filter,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah, formatTanggalIndo } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';
import { Transaction, TransactionType } from '../types/finance';

interface TransactionsViewProps {
  onOpenTransactionModal: (type: TransactionType, tx?: Transaction) => void;
  onViewReceipt?: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenTransactionModal,
  onViewReceipt,
}) => {
  const { transactions, categories, accounts, deleteTransaction, isAdmin, openPinModal } = useFinance();

  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const filteredTransactions = transactions
    .filter((tx) => {
      const matchType = typeFilter === 'all' || tx.type === typeFilter;
      const matchCat = categoryFilter === 'all' || tx.categoryId === categoryFilter;
      const matchAcc = accountFilter === 'all' || tx.accountId === accountFilter;

      const catName = categoryMap.get(tx.categoryId)?.name || '';
      const accName = accountMap.get(tx.accountId)?.name || '';
      const query = searchQuery.toLowerCase();

      const matchSearch =
        searchQuery === '' ||
        tx.note?.toLowerCase().includes(query) ||
        tx.recipientOrPayer?.toLowerCase().includes(query) ||
        catName.toLowerCase().includes(query) ||
        accName.toLowerCase().includes(query) ||
        tx.date.includes(query) ||
        tx.amount.toString().includes(query);

      return matchType && matchCat && matchAcc && matchSearch;
    })
    .sort((a, b) => {
      const cmp = a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
      return sortOrder === 'desc' ? -cmp : cmp;
    });

  const totalFilteredIncome = filteredTransactions
    .filter((t) => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFilteredExpense = filteredTransactions
    .filter((t) => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-4 sm:space-y-5 pb-20 md:pb-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Riwayat Transaksi
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar seluruh arus kas masuk dan uang keluar yang tersimpan di Supabase.
          </p>
        </div>

        {isAdmin ? (
          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <button
              onClick={() => onOpenTransactionModal('pemasukan')}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer min-h-[40px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Uang Masuk</span>
            </button>
            <button
              onClick={() => onOpenTransactionModal('pengeluaran')}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer min-h-[40px]"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>- Uang Keluar</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-100 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs text-slate-600">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Mode Lihat Saja</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => openPinModal('Masukkan PIN Admin untuk mencatat atau mengubah transaksi.')}
              className="font-semibold text-slate-900 hover:underline cursor-pointer"
            >
              Buka Akses Admin
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi, catatan, pihak, atau nominal..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segmented Type Filter */}
          <div className="sm:col-span-4 flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600">
            <button
              onClick={() => setTypeFilter('all')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setTypeFilter('pemasukan')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                typeFilter === 'pemasukan'
                  ? 'bg-white text-emerald-700 font-semibold shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => setTypeFilter('pengeluaran')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                typeFilter === 'pengeluaran'
                  ? 'bg-white text-rose-700 font-semibold shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Keluar
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:border-slate-900 cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === 'pemasukan' ? 'Masuk' : 'Keluar'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sub-filter summary line */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>Ditemukan: <strong className="text-slate-800">{filteredTransactions.length}</strong> transaksi</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 font-medium">+ {formatRupiah(totalFilteredIncome)}</span>
            <span aria-hidden="true">·</span>
            <span className="text-rose-600 font-medium">- {formatRupiah(totalFilteredExpense)}</span>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
          >
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <span>Urutan: {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}</span>
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Tidak ada transaksi yang sesuai dengan filter yang dipilih.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => {
              const isInc = tx.type === 'pemasukan';
              const cat = categoryMap.get(tx.categoryId);
              const acc = accountMap.get(tx.accountId);

              return (
                <div
                  key={tx.id}
                  className="p-3 sm:p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-2.5 sm:gap-3"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat?.color || '#64748b' }}
                    >
                      <CategoryIcon name={cat?.icon || 'Tag'} size={15} className="text-white" />
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {tx.note || cat?.name || 'Transaksi Kas'}
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
                        {tx.recipientOrPayer && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-400 truncate max-w-[100px] sm:max-w-[140px]">{tx.recipientOrPayer}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                    <span
                      className={`font-mono text-xs sm:text-sm font-semibold tabular-nums whitespace-nowrap ${
                        isInc ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isInc ? '+' : '-'} {formatRupiah(tx.amount)}
                    </span>

                    {isAdmin && (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => onOpenTransactionModal(tx.type, tx)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                          title="Ubah Transaksi"
                          aria-label="Ubah"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus transaksi "${tx.note || cat?.name}"?`)) {
                              deleteTransaction(tx.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                          title="Hapus Transaksi"
                          aria-label="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
