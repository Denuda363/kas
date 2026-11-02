import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Plus, Calendar, Wallet, Camera, UploadCloud, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Transaction, TransactionType } from '../types/finance';
import { useFinance } from '../context/FinanceContext';
import { formatRupiah, parseRupiahInput } from '../utils/formatters';
import { compressReceiptImage } from '../utils/imageCompressor';
import { CategoryIcon } from './CategoryIcon';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
  onOpenAddCategory?: (type: TransactionType) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialType = 'pengeluaran',
  editingTransaction,
  onOpenAddCategory,
}) => {
  const {
    incomeCategories,
    expenseCategories,
    accounts,
    addTransaction,
    updateTransaction,
    isAdmin,
    openPinModal,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<TransactionType>(initialType);
  const [rawAmount, setRawAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [recipientOrPayer, setRecipientOrPayer] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>(undefined);
  const [receiptSizeKb, setReceiptSizeKb] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currentCategories = type === 'pemasukan' ? incomeCategories : expenseCategories;

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setRawAmount(editingTransaction.amount.toString());
      setCategoryId(editingTransaction.categoryId);
      setAccountId(editingTransaction.accountId);
      setDate(editingTransaction.date);
      setTime(editingTransaction.time || '12:00');
      setNote(editingTransaction.note || '');
      setRecipientOrPayer(editingTransaction.recipientOrPayer || '');
      setReceiptUrl(editingTransaction.receiptUrl || undefined);
      setReceiptSizeKb(null);
    } else {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const hh = String(today.getHours()).padStart(2, '0');
      const min = String(today.getMinutes()).padStart(2, '0');

      setType(initialType);
      setRawAmount('');
      setDate(`${yyyy}-${mm}-${dd}`);
      setTime(`${hh}:${min}`);
      setNote('');
      setRecipientOrPayer('');
      setReceiptUrl(undefined);
      setReceiptSizeKb(null);

      const relevantCats = initialType === 'pemasukan' ? incomeCategories : expenseCategories;
      if (relevantCats.length > 0) {
        setCategoryId(relevantCats[0].id);
      }
      if (accounts.length > 0) {
        setAccountId(accounts[0].id);
      }
    }
    setErrorMsg('');
    setIsSubmitting(false);
    setIsCompressing(false);
  }, [editingTransaction, initialType, isOpen]);

  const handleReceiptFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setErrorMsg('');
    try {
      const { dataUrl, fileSizeKb } = await compressReceiptImage(file);
      setReceiptUrl(dataUrl);
      setReceiptSizeKb(fileSizeKb);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mengunggah foto nota.');
    } finally {
      setIsCompressing(false);
      // Reset input so same file can be re-selected if desired
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptUrl(undefined);
    setReceiptSizeKb(null);
  };

  useEffect(() => {
    const relevantCats = type === 'pemasukan' ? incomeCategories : expenseCategories;
    const exists = relevantCats.some((c) => c.id === categoryId);
    if (!exists && relevantCats.length > 0) {
      setCategoryId(relevantCats[0].id);
    }
  }, [type, incomeCategories, expenseCategories]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseRupiahInput(e.target.value);
    setRawAmount(val > 0 ? val.toString() : '');
    setErrorMsg('');
  };

  const addQuickAmount = (val: number) => {
    const current = parseRupiahInput(rawAmount);
    setRawAmount((current + val).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      openPinModal('Mode Admin diperlukan untuk menyimpan transaksi kas.');
      onClose();
      return;
    }

    const amountNumber = parseRupiahInput(rawAmount);

    if (amountNumber <= 0) {
      setErrorMsg('Harap masukkan nominal transaksi lebih dari Rp 0.');
      return;
    }
    if (!categoryId) {
      setErrorMsg('Pilih kategori transaksi.');
      return;
    }
    if (!accountId) {
      setErrorMsg('Pilih rekening atau akun kas.');
      return;
    }
    if (!date) {
      setErrorMsg('Tanggal transaksi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          type,
          amount: amountNumber,
          categoryId,
          accountId,
          date,
          time,
          note: note.trim(),
          recipientOrPayer: recipientOrPayer.trim(),
          receiptUrl: receiptUrl || '',
        });
      } else {
        await addTransaction({
          type,
          amount: amountNumber,
          categoryId,
          accountId,
          date,
          time,
          note: note.trim(),
          recipientOrPayer: recipientOrPayer.trim(),
          receiptUrl: receiptUrl || undefined,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Gagal menyimpan transaksi ke database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {editingTransaction ? 'Ubah Transaksi Kas' : 'Catat Transaksi Baru'}
            </h2>
            <p className="text-xs text-slate-500">
              {type === 'pemasukan' ? 'Catat uang masuk ke kas' : 'Catat uang keluar dari kas'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Type Selector (Pemasukan vs Pengeluaran) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Jenis Arus Kas
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setType('pemasukan')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[42px] ${
                  type === 'pemasukan'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-200" />
                <span>Uang Masuk</span>
              </button>
              <button
                type="button"
                onClick={() => setType('pengeluaran')}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer min-h-[42px] ${
                  type === 'pengeluaran'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-200" />
                <span>Uang Keluar</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nominal Transaksi (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={rawAmount ? formatRupiah(parseInt(rawAmount, 10), false) : ''}
                onChange={handleAmountChange}
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold font-mono text-slate-900 focus:outline-hidden focus:border-slate-900 focus:bg-white transition-colors"
                autoFocus
              />
            </div>
            {/* Quick amount increment pills */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400">Cepat:</span>
              {[50000, 100000, 250000, 500000, 1000000].map((inc) => (
                <button
                  type="button"
                  key={inc}
                  onClick={() => addQuickAmount(inc)}
                  className="px-2.5 py-1 text-[11px] font-semibold font-mono text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-lg transition-all cursor-pointer"
                >
                  +{formatRupiah(inc, false)}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selector with Quick Custom Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Kategori {type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
              </label>
              {onOpenAddCategory && (
                <button
                  type="button"
                  onClick={() => onOpenAddCategory(type)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer min-h-[30px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Kategori Baru</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50">
              {currentCategories.map((cat) => {
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs transition-colors border cursor-pointer min-h-[38px] ${
                      isSelected
                        ? 'border-slate-900 bg-white shadow-xs font-semibold text-slate-900'
                        : 'border-transparent bg-white/70 hover:bg-white text-slate-700'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} size={12} className="text-white" />
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Account Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Transaksi
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-slate-900 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rekening / Dompet
              </label>
              <div className="relative">
                <Wallet className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:border-slate-900 focus:bg-white appearance-none cursor-pointer"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Note / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan / Keterangan
            </label>
            <input
              type="text"
              placeholder="Contoh: Belanja bahan baku, Pembayaran invoice, Makan siang"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-slate-900 focus:bg-white"
            />
          </div>

          {/* Recipient / Payer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {type === 'pemasukan' ? 'Diterima Dari' : 'Dibayarkan Ke'}{' '}
              <span className="text-[11px] font-normal text-slate-400">(Opsional)</span>
            </label>
            <input
              type="text"
              placeholder={type === 'pemasukan' ? 'Contoh: Klien PT ABC' : 'Contoh: Supermarket Indomaret'}
              value={recipientOrPayer}
              onChange={(e) => setRecipientOrPayer(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-slate-900 focus:bg-white"
            />
          </div>

          {/* Upload Bukti Nota / Struk Transaksi */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Bukti Nota / Struk Transaksi{' '}
                <span className="text-[11px] font-normal text-slate-400">(Opsional)</span>
              </label>
              {receiptSizeKb && (
                <span className="text-[10px] text-emerald-600 font-semibold">
                  Tersimpan (~{receiptSizeKb} KB)
                </span>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleReceiptFile}
              accept="image/*"
              className="hidden"
            />

            {isCompressing ? (
              <div className="p-3.5 border border-dashed border-slate-300 rounded-xl bg-slate-50 flex items-center justify-center gap-2 text-xs text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin text-slate-800" />
                <span>Mengompres & memproses foto nota...</span>
              </div>
            ) : receiptUrl ? (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={receiptUrl}
                    alt="Nota Preview"
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-2xs shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      Foto Nota Terlampir
                    </p>
                    <p className="text-[11px] text-emerald-600 font-medium">
                      Siap disimpan ke database
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-colors"
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveReceipt}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                    title="Hapus foto nota"
                    aria-label="Hapus nota"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/70 hover:bg-slate-100/70 rounded-xl flex items-center justify-center gap-2.5 cursor-pointer transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-slate-800 group-hover:scale-105 transition-all shadow-2xs">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-800">
                    Ambil Foto / Unggah Bukti Nota
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Format JPG, PNG, atau WebP (Kamera / Galeri HP)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0">
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
              className={`px-5 py-2.5 text-xs font-semibold text-white rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer min-h-[40px] ${
                type === 'pemasukan'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting
                ? 'Menyimpan...'
                : editingTransaction
                ? 'Simpan Perubahan'
                : 'Catat Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
