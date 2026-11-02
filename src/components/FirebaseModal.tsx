import React, { useState } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Smartphone,
  Laptop,
  Radio,
  LogIn,
  LogOut,
  ShieldCheck,
  Server,
  Layers,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const FirebaseModal: React.FC = () => {
  const {
    firebaseModalOpen,
    closeFirebaseModal,
    firebaseInfo,
    currentUser,
    loginWithGoogle,
    logoutUser,
    testConnection,
  } = useFinance();

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message?: string;
  } | null>(null);

  if (!firebaseModalOpen) return null;

  const handleRunPing = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection();
      setTestResult(res);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Firebase Cloud Firestore
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600" />
                  Realtime
                </span>
              </h3>
              <p className="text-xs text-slate-500">Status sinkronisasi multi-perangkat online</p>
            </div>
          </div>
          <button
            onClick={closeFirebaseModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Realtime Multi-Device Sync Card */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg shrink-0 mt-0.5">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div className="text-xs space-y-1">
              <p className="font-bold text-emerald-950">Sinkronisasi Realtime Aktif di Semua Perangkat</p>
              <p className="text-emerald-800 leading-relaxed">
                Setiap kali Anda mencatat kas masuk atau kas keluar di satu HP atau laptop, data langsung muncul
                di seluruh perangkat lain secara instan tanpa perlu memuat ulang halaman.
              </p>
            </div>
          </div>

          {/* User Account / Auth State */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                Akun Terhubung:
              </span>
              {currentUser ? (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                  Aktif
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                  Belum Masuk
                </span>
              )}
            </div>

            {currentUser ? (
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'User'}
                      className="w-8 h-8 rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser.displayName || 'Pengguna'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={logoutUser}
                  className="px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1 font-medium cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  Keluar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-600">
                  Masuk dengan Google untuk mengaktifkan sinkronisasi cloud real-time di seluruh HP dan laptop Anda.
                </p>
                <button
                  onClick={loginWithGoogle}
                  className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Masuk dengan Akun Google
                </button>
              </div>
            )}
          </div>

          {/* Database Specs Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">Project ID</span>
              <span className="font-mono font-medium text-slate-800 break-all">{firebaseInfo.projectId}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">Database ID</span>
              <span className="font-mono font-medium text-slate-800 truncate block" title={firebaseInfo.databaseId}>
                {firebaseInfo.databaseId}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">Status Koneksi</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Terhubung & Siap
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-[11px] text-slate-400 block mb-0.5">Sinkronisasi Terakhir</span>
              <span className="font-medium text-slate-700">
                {firebaseInfo.lastSyncTime
                  ? firebaseInfo.lastSyncTime.toLocaleTimeString('id-ID')
                  : 'Baru saja'}
              </span>
            </div>
          </div>

          {/* Multi-Device Instructions */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              Cara Penggunaan di Perangkat Lain:
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Buka di HP Android / iOS via browser & install PWA</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                <Laptop className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Buka di Komputer / Laptop kasir secara bersamaan</span>
              </div>
            </div>
          </div>

          {/* Connection Test / Ping Result */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50/80 border-rose-200 text-rose-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  {testResult.success ? 'Koneksi ke Firestore Berhasil' : 'Koneksi Bermasalah'}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {testResult.latencyMs !== undefined && `Latensi server: ${testResult.latencyMs} ms. `}
                  {testResult.message || 'Firestore online & siap menerima transaksi realtime.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleRunPing}
            disabled={isTesting}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Menguji...' : 'Uji Koneksi (Ping)'}
          </button>
          <button
            onClick={closeFirebaseModal}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-200/70 hover:bg-slate-300/70 rounded-xl transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
