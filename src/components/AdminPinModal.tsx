import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, X, Delete, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
  onSuccess?: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  reason = 'Masukkan PIN Admin untuk mendapatkan akses penuh mengelola data kas.',
  onSuccess,
}) => {
  const { unlockAdmin } = useFinance();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg('');
      setIsSuccess(false);
      setShake(false);
      // Auto focus hidden input for physical keyboard entry
      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitPress = (digit: string) => {
    if (pin.length >= 8) return;
    setErrorMsg('');
    const newPin = pin + digit;
    setPin(newPin);

    // Auto verify if reaches 6 digits
    if (newPin.length === 6) {
      verifyPin(newPin);
    }
  };

  const handleBackspace = () => {
    setErrorMsg('');
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setErrorMsg('');
    setPin('');
  };

  const verifyPin = (pinToTest: string) => {
    const result = unlockAdmin(pinToTest);
    if (result.success) {
      setIsSuccess(true);
      setErrorMsg('');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 400);
    } else {
      setShake(true);
      setErrorMsg(result.message || 'PIN yang Anda masukkan salah.');
      setPin('');
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length < 4) {
      setErrorMsg('Masukkan minimal 4 digit PIN.');
      return;
    }
    verifyPin(pin);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Hidden input to capture physical keyboard input seamlessly on PC/laptop */}
      <input
        ref={hiddenInputRef}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        value={pin}
        onChange={(e) => {
          const val = e.target.value.replace(/\D/g, '').slice(0, 8);
          setPin(val);
          setErrorMsg('');
          if (val.length === 6) {
            verifyPin(val);
          }
        }}
        onKeyDown={handleKeyDown}
        className="opacity-0 absolute -z-10 pointer-events-none"
        aria-hidden="true"
        autoFocus
      />

      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 transition-transform ${
          shake ? 'animate-bounce' : ''
        }`}
        onClick={() => hiddenInputRef.current?.focus()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
              isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-900 text-white'
            }`}>
              {isSuccess ? <CheckCircle2 className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isSuccess ? 'Akses Terverifikasi' : 'Masuk Mode Admin'}
              </h3>
              <p className="text-xs text-slate-500">
                {isSuccess ? 'Mode Admin aktif sepenuhnya' : 'Otorisasi Keamanan'}
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

        {/* Reason banner */}
        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-5 leading-relaxed">
          {reason}
        </p>

        {/* PIN Indicators Display */}
        <div className="flex justify-center items-center gap-3 py-3 mb-4">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const hasChar = idx < pin.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  hasChar
                    ? isSuccess
                      ? 'bg-emerald-600 scale-110 shadow-xs'
                      : 'bg-slate-900 scale-110 shadow-xs'
                    : 'border-2 border-slate-300 bg-white'
                }`}
              />
            );
          })}
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl py-2 px-3 mb-4 animate-in fade-in">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Numeric Keypad for Mobile, Tablet & Touchscreen */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              disabled={isSuccess}
              className="h-12 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 rounded-xl text-lg font-bold text-slate-800 transition-all cursor-pointer flex items-center justify-center select-none shadow-2xs"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            disabled={isSuccess || pin.length === 0}
            className="h-12 bg-slate-100/70 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center disabled:opacity-40 select-none"
          >
            Bersih
          </button>
          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            disabled={isSuccess}
            className="h-12 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 rounded-xl text-lg font-bold text-slate-800 transition-all cursor-pointer flex items-center justify-center select-none shadow-2xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            disabled={isSuccess || pin.length === 0}
            className="h-12 bg-slate-100/70 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer flex items-center justify-center disabled:opacity-40 select-none"
            aria-label="Hapus satu angka"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Submit button when pin length >= 4 */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => handleManualSubmit()}
            disabled={pin.length < 4 || isSuccess}
            className="flex-1 py-2.5 px-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
          >
            Verifikasi PIN
          </button>
        </div>
      </div>
    </div>
  );
};
