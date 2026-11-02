import React, { useState } from 'react';
import { KeyRound, Shield, X, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface AdminPinSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPinSettingsModal: React.FC<AdminPinSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { updateAdminPin } = useFinance();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPin.trim()) {
      setErrorMsg('Masukkan PIN lama saat ini.');
      return;
    }

    if (!/^\d{4,8}$/.test(newPin.trim())) {
      setErrorMsg('PIN baru harus berupa 4 sampai 8 digit angka.');
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      setErrorMsg('Konfirmasi PIN baru tidak sesuai.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateAdminPin(currentPin.trim(), newPin.trim());
      if (res.success) {
        setSuccessMsg(res.message || 'PIN Admin berhasil diubah!');
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.message || 'Gagal mengubah PIN.');
      }
    } catch {
      setErrorMsg('Terjadi kendala saat menyimpan PIN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pengaturan PIN Admin
              </h3>
              <p className="text-xs text-slate-500">
                Kelola keamanan akses penuh sistem kas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info card */}
        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 mb-5 text-xs text-slate-600 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
          <span>
            PIN Admin digunakan untuk membuka akses penuh saat mencatat kas, mengubah kategori, dan memodifikasi data keuangan.
          </span>
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 mb-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 p-3 mb-4 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* PIN Lama */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              PIN Lama / Saat Ini <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={8}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Masukkan PIN lama"
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-mono tracking-widest"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPin(!showCurrentPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* PIN Baru */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              PIN Baru (4 - 8 Digit Angka) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNewPin ? 'text' : 'password'}
                inputMode="numeric"
                maxLength={8}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Contoh: 889900"
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-mono tracking-widest"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPin(!showNewPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Konfirmasi PIN Baru */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Konfirmasi PIN Baru <span className="text-rose-500">*</span>
            </label>
            <input
              type={showNewPin ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={8}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Ulangi PIN baru"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-mono tracking-widest"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !currentPin || !newPin || !confirmPin}
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan PIN Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
