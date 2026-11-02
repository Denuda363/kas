import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowUpRight, ArrowDownRight, AlertCircle, Lock, Search } from 'lucide-react';
import { Category, TransactionType } from '../types/finance';
import { useFinance } from '../context/FinanceContext';
import { CategoryIcon } from './CategoryIcon';

interface CategoryManagerProps {
  onOpenCategoryModal: (type: TransactionType, cat?: Category) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({ onOpenCategoryModal }) => {
  const {
    incomeCategories,
    expenseCategories,
    deleteCategory,
    transactions,
    isAdmin,
    openPinModal,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<TransactionType>('pengeluaran');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categories = activeTab === 'pemasukan' ? incomeCategories : expenseCategories;

  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = async (cat: Category) => {
    if (!isAdmin) {
      openPinModal('Masukkan PIN Admin untuk menghapus kategori kas.');
      return;
    }
    setDeleteError(null);
    const result = await deleteCategory(cat.id);
    if (!result.success) {
      setDeleteError(result.message || 'Gagal menghapus kategori.');
    }
  };

  const handleAddCategoryClick = () => {
    if (!isAdmin) {
      openPinModal('Masukkan PIN Admin untuk menambah kategori kas baru.');
      return;
    }
    onOpenCategoryModal(activeTab);
  };

  const getUsageCount = (catId: string) => {
    return transactions.filter((t) => t.categoryId === catId).length;
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-20 md:pb-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Kategori Kas
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar pos uang masuk dan uang keluar untuk klasifikasi arus keuangan.
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={handleAddCategoryClick}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-2xs transition-all shrink-0 cursor-pointer min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kategori {activeTab === 'pemasukan' ? 'Masuk' : 'Keluar'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-100 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs text-slate-600">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Mode Lihat Saja</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => openPinModal('Masukkan PIN Admin untuk menambah atau mengubah kategori.')}
              className="font-semibold text-slate-900 hover:underline cursor-pointer"
            >
              Buka Akses Admin
            </button>
          </div>
        )}
      </div>

      {deleteError && (
        <div className="flex items-center gap-2 p-3 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Tabs & Search Filter */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Interactive Segmented Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600 w-full sm:w-auto">
          <button
            onClick={() => {
              setActiveTab('pengeluaran');
              setDeleteError(null);
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'pengeluaran'
                ? 'bg-white text-rose-700 font-semibold shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
            <span>
              <span className="hidden xs:inline">Pengeluaran</span>
              <span className="xs:hidden">Keluar</span> ({expenseCategories.length})
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab('pemasukan');
              setDeleteError(null);
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'pemasukan'
                ? 'bg-white text-emerald-700 font-semibold shadow-2xs'
                : 'hover:text-slate-900'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              <span className="hidden xs:inline">Pemasukan</span>
              <span className="xs:hidden">Masuk</span> ({incomeCategories.length})
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200/80 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-slate-900 transition-colors"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCategories.map((cat) => {
          const usageCount = getUsageCount(cat.id);

          return (
            <div
              key={cat.id}
              className="p-4 bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl shadow-2xs transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                    style={{ backgroundColor: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} size={16} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{cat.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {usageCount} transaksi terkait
                    </p>
                  </div>
                </div>

                {/* Action buttons (Only for Admin) */}
                {isAdmin && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => onOpenCategoryModal(cat.type, cat)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                      title="Ubah Kategori"
                      aria-label={`Ubah ${cat.name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                      title={
                        usageCount > 0
                          ? `Kategori tidak bisa dihapus karena dipakai di ${usageCount} transaksi`
                          : 'Hapus Kategori'
                      }
                      aria-label={`Hapus ${cat.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {cat.description && (
                <p className="text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100 line-clamp-2">
                  {cat.description}
                </p>
              )}
            </div>
          );
        })}

        {filteredCategories.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl p-6">
            <p className="text-sm font-semibold text-slate-700">Tidak ada kategori yang cocok</p>
            <p className="text-xs text-slate-500 mt-1">
              Coba kata kunci lain atau tambahkan kategori baru.
            </p>
            {isAdmin && (
              <button
                onClick={() => onOpenCategoryModal(activeTab)}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 cursor-pointer min-h-[40px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Sekarang</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
