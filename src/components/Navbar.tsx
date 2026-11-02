import React, { useState } from 'react';
import {
  Plus,
  Database,
  LayoutDashboard,
  BarChart3,
  ArrowUpDown,
  Tags,
  ShieldCheck,
  Lock,
  KeyRound,
  ChevronDown,
  FolderArchive,
  Radio,
  LogIn,
  LogOut,
  Smartphone,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { TransactionType } from '../types/finance';
import { PWAInstallButton } from './PWAInstallButton';
import { FirebaseModal } from './FirebaseModal';

interface NavbarProps {
  activeTab: 'dashboard' | 'reports' | 'transactions' | 'categories';
  setActiveTab: (tab: 'dashboard' | 'reports' | 'transactions' | 'categories') => void;
  onOpenTransactionModal: (type: TransactionType) => void;
  onOpenBackupModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenTransactionModal,
  onOpenBackupModal,
}) => {
  const {
    isAdmin,
    openPinModal,
    lockToUserMode,
    openPinSettingsModal,
    isFirebaseConnected,
    isRealtimeActive,
    firebaseInfo,
    currentUser,
    loginWithGoogle,
    logoutUser,
    openFirebaseModal,
  } = useFinance();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleCatatKasClick = () => {
    if (!isAdmin) {
      openPinModal('Masukkan PIN Admin untuk mencatat transaksi uang masuk atau uang keluar.');
      return;
    }
    onOpenTransactionModal('pengeluaran');
  };

  return (
    <>
      {/* Top Bar for Desktop, Tablet, and Mobile */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 h-16">
            {/* Zone 1: Brand title */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-2.5 text-left group focus:outline-hidden cursor-pointer"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xs sm:text-sm tracking-wider shadow-2xs group-hover:bg-slate-800 transition-colors">
                  BK
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-none">
                      BukuKas
                    </span>
                    <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 leading-none">
                      Pro
                    </span>
                  </div>
                  <span className="hidden sm:block text-[11px] text-slate-400 font-normal mt-0.5">
                    Realtime Multi-Perangkat
                  </span>
                </div>
              </button>
            </div>

            {/* Zone 2: Navigation Links (Desktop & Tablet) */}
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-xs font-medium text-slate-600">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'hover:text-slate-900 hover:bg-white/50 text-slate-600'
                }`}
              >
                Ringkasan
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'reports'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'hover:text-slate-900 hover:bg-white/50 text-slate-600'
                }`}
              >
                Laporan & Ekspor
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'transactions'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'hover:text-slate-900 hover:bg-white/50 text-slate-600'
                }`}
              >
                Riwayat Transaksi
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'categories'
                    ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                    : 'hover:text-slate-900 hover:bg-white/50 text-slate-600'
                }`}
              >
                Kategori
              </button>
            </nav>

            {/* Zone 3: Database Status, Google Auth & Action Button */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* PWA Install Button (Desktop & Tablet) */}
              <div className="hidden sm:block">
                <PWAInstallButton variant="navbar" />
              </div>

              {/* Firebase Realtime Status Button */}
              <button
                onClick={openFirebaseModal}
                className={`inline-flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all text-xs cursor-pointer ${
                  isFirebaseConnected
                    ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}
                title="Status Firebase Cloud Firestore Realtime - Klik untuk rincian"
              >
                <span className="relative flex h-2 w-2">
                  {isRealtimeActive && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isFirebaseConnected ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  ></span>
                </span>
                <span className="hidden sm:inline text-[11px] font-medium text-slate-500">Firebase:</span>
                <span className="hidden xs:inline font-semibold text-[11px] text-slate-800">
                  {isRealtimeActive ? 'Realtime' : 'Online'}
                </span>
              </button>

              {/* Google Auth Status / Login */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="inline-flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer text-xs"
                    title={`Akun: ${currentUser.email}`}
                  >
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt="Profile"
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center">
                        {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="hidden lg:inline text-[11px] font-medium text-slate-700 max-w-[100px] truncate">
                      {currentUser.displayName || currentUser.email?.split('@')[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {currentUser.displayName || 'Akun Google'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</p>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                          <Radio className="w-2.5 h-2.5 animate-pulse" />
                          <span>Tersinkronisasi Realtime</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          openFirebaseModal();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer mt-1"
                      >
                        <Database className="w-3.5 h-3.5 text-slate-400" />
                        <span>Info Cloud Database</span>
                      </button>
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logoutUser();
                        }}
                        className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 border-t border-slate-100 mt-1 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar dari Akun</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={loginWithGoogle}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
                  title="Masuk dengan Google untuk sinkronisasi realtime di semua perangkat"
                >
                  <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden xs:inline">Masuk</span>
                </button>
              )}

              {/* Role Indicator / Mode PIN Switcher */}
              <div className="relative">
                {isAdmin ? (
                  <div>
                    <button
                      onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                      className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100/70 transition-all text-xs font-semibold cursor-pointer"
                      title="Mode Admin Aktif (Akses Penuh)"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs">Admin</span>
                      <ChevronDown className="w-3 h-3 text-emerald-600 opacity-70" />
                    </button>

                    {roleDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                        <div className="px-3 py-2 border-b border-slate-100">
                          <p className="text-xs font-bold text-slate-900">Hak Akses: Admin</p>
                          <p className="text-[11px] text-emerald-600 font-medium">Akses Penuh (Input & Edit)</p>
                        </div>
                        <button
                          onClick={() => {
                            setRoleDropdownOpen(false);
                            openPinSettingsModal();
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                          <span>Atur PIN Admin</span>
                        </button>
                        <button
                          onClick={() => {
                            setRoleDropdownOpen(false);
                            onOpenBackupModal();
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2 cursor-pointer"
                        >
                          <FolderArchive className="w-3.5 h-3.5 text-slate-500" />
                          <span>Cadangan & Impor JSON</span>
                        </button>
                        <button
                          onClick={() => {
                            setRoleDropdownOpen(false);
                            lockToUserMode();
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 border-t border-slate-100 mt-1 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5 text-rose-500" />
                          <span>Kunci ke Mode Pengguna</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => openPinModal('Masukkan PIN Admin untuk mendapatkan akses penuh mengelola kas.')}
                    className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all text-xs font-medium cursor-pointer"
                    title="Klik untuk membuka Mode Admin dengan PIN"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-semibold text-slate-700">PIN</span>
                  </button>
                )}
              </div>

              {/* Primary "+ Catat Kas" CTA */}
              {isAdmin && (
                <button
                  onClick={handleCatatKasClick}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-95 rounded-xl shadow-2xs transition-all whitespace-nowrap shrink-0 cursor-pointer min-h-[34px] sm:min-h-[38px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Catat Kas</span>
                  <span className="xs:hidden">Catat</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Dedicated Native-Feel Bottom Navigation Bar for Mobile (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 safe-area-pb shadow-lg">
        <div className="grid grid-cols-4 items-center">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[44px] cursor-pointer ${
              activeTab === 'dashboard'
                ? 'text-slate-900 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Ringkasan</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[44px] cursor-pointer ${
              activeTab === 'reports'
                ? 'text-slate-900 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BarChart3 className={`w-5 h-5 ${activeTab === 'reports' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Laporan</span>
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[44px] cursor-pointer ${
              activeTab === 'transactions'
                ? 'text-slate-900 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ArrowUpDown className={`w-5 h-5 ${activeTab === 'transactions' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Riwayat</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-colors min-h-[44px] cursor-pointer ${
              activeTab === 'categories'
                ? 'text-slate-900 font-bold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Tags className={`w-5 h-5 ${activeTab === 'categories' ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">Kategori</span>
          </button>
        </div>
      </nav>

      {/* Firebase Database Connection Modal */}
      <FirebaseModal />
    </>
  );
};
