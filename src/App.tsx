import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { TransactionsView } from './components/TransactionsView';
import { CategoryManager } from './components/CategoryManager';
import { TransactionModal } from './components/TransactionModal';
import { CategoryModal } from './components/CategoryModal';
import { BackupModal } from './components/BackupModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';
import { AdminPinModal } from './components/AdminPinModal';
import { AdminPinSettingsModal } from './components/AdminPinSettingsModal';
import { Transaction, Category, TransactionType } from './types/finance';
import { Radio, LogIn, Sparkles } from 'lucide-react';
import { OfflineIndicator } from './components/OfflineIndicator';

function MainApp() {
  const {
    isAdmin,
    pinModalOpen,
    closePinModal,
    pinModalReason,
    openPinModal,
    pinSettingsModalOpen,
    closePinSettingsModal,
    openFirebaseModal,
    firebaseInfo,
    currentUser,
    loginWithGoogle,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'transactions' | 'categories'>('dashboard');

  // Modal states
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('pengeluaran');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catModalType, setCatModalType] = useState<TransactionType>('pengeluaran');
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [backupModalOpen, setBackupModalOpen] = useState(false);
  const [viewingReceiptTx, setViewingReceiptTx] = useState<Transaction | null>(null);

  // Open Transaction Modal (Guarded: Mode Pengguna prompts PIN)
  const handleOpenTransactionModal = (type: TransactionType = 'pengeluaran', tx?: Transaction) => {
    if (!isAdmin) {
      openPinModal(
        tx
          ? 'Masukkan PIN Admin untuk mengubah data transaksi kas.'
          : 'Masukkan PIN Admin untuk mencatat transaksi kas baru.'
      );
      return;
    }
    setTxModalType(type);
    setEditingTx(tx || null);
    setTxModalOpen(true);
  };

  // Open Category Modal (Guarded: Mode Pengguna prompts PIN)
  const handleOpenCategoryModal = (type: TransactionType = 'pengeluaran', cat?: Category) => {
    if (!isAdmin) {
      openPinModal(
        cat
          ? 'Masukkan PIN Admin untuk mengubah kategori kas.'
          : 'Masukkan PIN Admin untuk menambah kategori baru.'
      );
      return;
    }
    setCatModalType(type);
    setEditingCat(cat || null);
    setCatModalOpen(true);
  };

  const handleViewReceipt = (tx: Transaction) => {
    setViewingReceiptTx(tx);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTransactionModal={(type) => handleOpenTransactionModal(type)}
        onOpenBackupModal={() => setBackupModalOpen(true)}
      />

      {/* Main Content Area - Optimized for mobile viewports */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 pb-24 md:pb-8">
        {/* Realtime Cross-Device Sync Notification Banner for Unauthenticated Visitors */}
        {!currentUser && (
          <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  Database Firebase Realtime Siap Digunakan
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                    Multi-Device
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Masuk dengan Akun Google untuk menyinkronkan seluruh catatan kas masuk & keluar di semua HP dan laptop Anda secara realtime.
                </p>
              </div>
            </div>
            <button
              onClick={loginWithGoogle}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer w-full sm:w-auto justify-center"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk dengan Google</span>
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenTransactionModal={handleOpenTransactionModal}
            onNavigateToReports={() => setActiveTab('reports')}
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onNavigateToCategories={() => setActiveTab('categories')}
            onViewReceipt={handleViewReceipt}
          />
        )}

        {activeTab === 'reports' && (
          <MonthlyReportView
            onOpenTransactionModal={(type) => handleOpenTransactionModal(type)}
            onViewReceipt={handleViewReceipt}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            onOpenTransactionModal={handleOpenTransactionModal}
            onViewReceipt={handleViewReceipt}
          />
        )}

        {activeTab === 'categories' && (
          <CategoryManager
            onOpenCategoryModal={handleOpenCategoryModal}
          />
        )}
      </main>

      {/* Core Modals */}
      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => {
          setTxModalOpen(false);
          setEditingTx(null);
        }}
        initialType={txModalType}
        editingTransaction={editingTx}
        onOpenAddCategory={(type) => handleOpenCategoryModal(type)}
      />

      <CategoryModal
        isOpen={catModalOpen}
        onClose={() => {
          setCatModalOpen(false);
          setEditingCat(null);
        }}
        initialType={catModalType}
        editingCategory={editingCat}
      />

      <BackupModal
        isOpen={backupModalOpen}
        onClose={() => setBackupModalOpen(false)}
      />

      <ReceiptViewerModal
        isOpen={!!viewingReceiptTx}
        transaction={viewingReceiptTx}
        onClose={() => setViewingReceiptTx(null)}
      />

      {/* PIN Verification & Settings Modals */}
      <AdminPinModal
        isOpen={pinModalOpen}
        onClose={closePinModal}
        reason={pinModalReason}
      />

      <AdminPinSettingsModal
        isOpen={pinSettingsModalOpen}
        onClose={closePinSettingsModal}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} BukuKas Pro · Sistem Kas Masuk & Kas Keluar Realtime</p>
          <div className="flex items-center gap-3 text-slate-500">
            <button
              onClick={openFirebaseModal}
              className="inline-flex items-center gap-1.5 hover:text-emerald-700 transition-colors cursor-pointer"
              title="Periksa status & uji koneksi Firebase Cloud Firestore"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Firebase Realtime: {firebaseInfo.projectId}</span>
            </button>
            <span aria-hidden="true">·</span>
            <span>Mode PIN</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => {
                if (isAdmin) setBackupModalOpen(true);
                else openPinModal('Masukkan PIN Admin untuk mengakses cadangan data.');
              }}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cadangan Data
            </button>
          </div>
        </div>
      </footer>

      {/* Offline connectivity indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <MainApp />
    </FinanceProvider>
  );
}
