import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Category, TransactionType } from '../types/finance';
import { useFinance } from '../context/FinanceContext';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../data/defaultData';
import { CategoryIcon } from './CategoryIcon';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  editingCategory?: Category | null;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  initialType = 'pengeluaran',
  editingCategory,
}) => {
  const { addCategory, updateCategory, isAdmin, openPinModal } = useFinance();

  const [type, setType] = useState<TransactionType>(initialType);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [icon, setIcon] = useState<string>('Tag');
  const [color, setColor] = useState<string>('#3b82f6');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (editingCategory) {
      setType(editingCategory.type);
      setName(editingCategory.name);
      setDescription(editingCategory.description || '');
      setIcon(editingCategory.icon || 'Tag');
      setColor(editingCategory.color || '#3b82f6');
    } else {
      setType(initialType);
      setName('');
      setDescription('');
      setIcon(initialType === 'pemasukan' ? 'Briefcase' : 'ShoppingBag');
      setColor(initialType === 'pemasukan' ? '#10b981' : '#f97316');
    }
    setErrorMsg('');
    setIsSubmitting(false);
  }, [editingCategory, initialType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      openPinModal('Mode Admin diperlukan untuk menyimpan kategori.');
      onClose();
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Nama kategori wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          description: description.trim(),
          type,
          icon,
          color,
        });
      } else {
        await addCategory({
          name: name.trim(),
          description: description.trim(),
          type,
          icon,
          color,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal menyimpan kategori ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {editingCategory ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
            </h2>
            <p className="text-xs text-slate-500">
              Kustomisasi kategori {type === 'pemasukan' ? 'uang masuk' : 'uang keluar'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Tipe Kategori */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Jenis Kategori
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setType('pemasukan')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[40px] ${
                  type === 'pemasukan'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setType('pengeluaran')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[40px] ${
                  type === 'pengeluaran'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pengeluaran
              </button>
            </div>
          </div>

          {/* Nama Kategori */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Kategori
            </label>
            <input
              type="text"
              placeholder="Contoh: Katering, Endorsement, Sewa Gudang"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMsg('');
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-hidden focus:border-slate-900 focus:bg-white"
              autoFocus
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Keterangan / Catatan Singkat
            </label>
            <input
              type="text"
              placeholder="Contoh: Pos pengeluaran makan siang tim"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-slate-900 focus:bg-white"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Warna Tema
            </label>
            <div className="flex flex-wrap gap-2.5">
              {AVAILABLE_COLORS.map((c) => {
                const isSelected = color === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    style={{ backgroundColor: c.value }}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-xs cursor-pointer"
                    title={c.name}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pilih Ikon
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {AVAILABLE_ICONS.map((ic) => {
                const isSelected = icon === ic;
                return (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <CategoryIcon name={ic} size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview Card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
              style={{ backgroundColor: color }}
            >
              <CategoryIcon name={icon} size={18} className="text-white" />
            </span>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 truncate">
                {name.trim() || 'Nama Kategori'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {type === 'pemasukan' ? 'Pemasukan Kas' : 'Pengeluaran Kas'} · {description || 'Tanpa keterangan'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer min-h-[40px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer min-h-[40px]"
            >
              {isSubmitting
                ? 'Menyimpan...'
                : editingCategory
                ? 'Simpan Perubahan'
                : 'Tambah Kategori'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
