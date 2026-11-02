import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Transaction,
  Category,
  AccountWallet,
  MonthlyReportData,
  CategoryBreakdown,
  TransactionType,
} from '../types/finance';
import {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_ACCOUNTS,
  getInitialSampleTransactions,
} from '../data/defaultData';
import {
  auth,
  signInWithGoogle,
  signOutUser,
  firestoreApi,
  testFirestoreConnection,
} from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export interface FirebaseStatusInfo {
  projectId: string;
  databaseId: string;
  connected: boolean;
  userEmail: string | null;
  realtimeActive: boolean;
  lastSyncTime: Date | null;
  latencyMs?: number;
}

export interface FinanceContextType {
  // Firebase State
  isFirebaseConnected: boolean;
  isRealtimeActive: boolean;
  firebaseInfo: FirebaseStatusInfo;
  currentUser: User | null;
  isAuthLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logoutUser: () => Promise<void>;
  testConnection: () => Promise<{ success: boolean; latencyMs?: number; message?: string }>;

  // Data
  transactions: Transaction[];
  categories: Category[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  accounts: AccountWallet[];
  currentMonth: number;
  currentYear: number;
  setCurrentMonth: (month: number) => void;
  setCurrentYear: (year: number) => void;
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (data: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<{ success: boolean; message?: string }>;
  resetToDefaultData: () => Promise<void>;
  importBackupData: (jsonStr: string) => Promise<boolean>;
  exportBackupData: () => string;
  getMonthlyReport: (month: number, year: number) => MonthlyReportData;
  activeReport: MonthlyReportData;

  // Role Access & PIN Management
  isAdmin: boolean;
  adminPin: string;
  unlockAdmin: (pin: string) => { success: boolean; message?: string };
  lockToUserMode: () => void;
  updateAdminPin: (oldPin: string, newPin: string) => Promise<{ success: boolean; message?: string }>;
  pinModalOpen: boolean;
  pinModalReason: string;
  openPinModal: (reason?: string) => void;
  closePinModal: () => void;
  pinSettingsModalOpen: boolean;
  openPinSettingsModal: () => void;
  closePinSettingsModal: () => void;
  firebaseModalOpen: boolean;
  openFirebaseModal: () => void;
  closeFirebaseModal: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY_TX = 'bukukas_transactions_v3';
const STORAGE_KEY_CAT = 'bukukas_categories_v3';
const STORAGE_KEY_ACC = 'bukukas_accounts_v3';
const STORAGE_KEY_PIN = 'bukukas_admin_pin_v3';
const STORAGE_KEY_ADMIN_ACTIVE = 'bukukas_admin_active_v3';

// Master Super User PIN: Always grants full admin access
const SUPER_USER_PIN = '151219';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentDate = new Date();
  const [currentMonth, setCurrentMonth] = useState<number>(currentDate.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState<number>(currentDate.getFullYear());

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Firebase Connection & Realtime State
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | undefined>(undefined);

  // Admin Mode & PIN States
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY_ADMIN_ACTIVE) === 'true';
    } catch {
      return false;
    }
  });

  const [adminPin, setAdminPin] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_PIN) || '123456';
    } catch {
      return '123456';
    }
  });

  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinModalReason, setPinModalReason] = useState('Masukkan PIN Admin untuk mendapatkan akses penuh.');
  const [pinSettingsModalOpen, setPinSettingsModalOpen] = useState(false);
  const [firebaseModalOpen, setFirebaseModalOpen] = useState(false);

  const openPinModal = (reason?: string) => {
    if (reason) setPinModalReason(reason);
    setPinModalOpen(true);
  };

  const closePinModal = () => setPinModalOpen(false);
  const openPinSettingsModal = () => setPinSettingsModalOpen(true);
  const closePinSettingsModal = () => setPinSettingsModalOpen(false);
  const openFirebaseModal = () => setFirebaseModalOpen(true);
  const closeFirebaseModal = () => setFirebaseModalOpen(false);

  // Fallback initial cached state
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CAT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Storage read warning', e);
    }
    return [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
  });

  const [accounts, setAccounts] = useState<AccountWallet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACC);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Storage read warning', e);
    }
    return DEFAULT_ACCOUNTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TX);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Storage read warning', e);
    }
    return getInitialSampleTransactions();
  });

  // Track Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user) {
        setIsFirebaseConnected(true);
        // Automatically grant admin if signed in with app owner email
        if (user.email === 'assyfachanel99@gmail.com') {
          setIsAdmin(true);
          try {
            sessionStorage.setItem(STORAGE_KEY_ADMIN_ACTIVE, 'true');
          } catch {}
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore in Realtime across all devices when authenticated
  useEffect(() => {
    if (!currentUser) {
      setIsRealtimeActive(false);
      return;
    }

    let isSubscribed = true;

    // 1. Subscribe Transactions
    const unsubTx = firestoreApi.subscribeTransactions(
      (txList) => {
        if (!isSubscribed) return;
        setTransactions(txList);
        setLastSyncTime(new Date());
        setIsRealtimeActive(true);
        setIsFirebaseConnected(true);
        try {
          localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(txList));
        } catch {}
      },
      (err) => {
        console.warn('Firestore transaction stream warning:', err);
      }
    );

    // 2. Subscribe Categories
    const unsubCat = firestoreApi.subscribeCategories(
      (catList) => {
        if (!isSubscribed) return;
        if (catList.length > 0) {
          setCategories(catList);
          try {
            localStorage.setItem(STORAGE_KEY_CAT, JSON.stringify(catList));
          } catch {}
        } else {
          // If Firestore is empty, seed default categories
          const initialCats = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
          firestoreApi.seedInitialData(
            initialCats,
            DEFAULT_ACCOUNTS,
            getInitialSampleTransactions(),
            adminPin
          ).catch((e) => console.warn('Initial seed note:', e));
        }
      },
      (err) => console.warn('Firestore category stream warning:', err)
    );

    // 3. Subscribe Accounts
    const unsubAcc = firestoreApi.subscribeAccounts(
      (accList) => {
        if (!isSubscribed) return;
        if (accList.length > 0) {
          setAccounts(accList);
          try {
            localStorage.setItem(STORAGE_KEY_ACC, JSON.stringify(accList));
          } catch {}
        }
      },
      (err) => console.warn('Firestore account stream warning:', err)
    );

    // 4. Subscribe Admin PIN
    const unsubPin = firestoreApi.subscribeAdminPin(
      (pin) => {
        if (!isSubscribed) return;
        setAdminPin(pin);
        try {
          localStorage.setItem(STORAGE_KEY_PIN, pin);
        } catch {}
      },
      (err) => console.warn('Firestore PIN stream warning:', err)
    );

    return () => {
      isSubscribed = false;
      unsubTx();
      unsubCat();
      unsubAcc();
      unsubPin();
    };
  }, [currentUser, adminPin]);

  // Periodic connection ping
  const testConnection = useCallback(async () => {
    try {
      const res = await testFirestoreConnection();
      setIsFirebaseConnected(res.success);
      if (res.latencyMs !== undefined) setLatencyMs(res.latencyMs);
      return res;
    } catch (err: any) {
      setIsFirebaseConnected(false);
      return { success: false, message: err.message || 'Gagal tersambung' };
    }
  }, []);

  const loginWithGoogle = async () => {
    try {
      await signInWithGoogle();
      await testConnection();
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logoutUser = async () => {
    try {
      await signOutUser();
      setIsAdmin(false);
      try {
        sessionStorage.removeItem(STORAGE_KEY_ADMIN_ACTIVE);
      } catch {}
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const unlockAdmin = (inputPin: string) => {
    const clean = inputPin.trim();
    if (clean === SUPER_USER_PIN || clean === adminPin) {
      setIsAdmin(true);
      try {
        sessionStorage.setItem(STORAGE_KEY_ADMIN_ACTIVE, 'true');
      } catch {}
      return { success: true };
    }
    return { success: false, message: 'PIN yang Anda masukkan salah. Silakan coba lagi.' };
  };

  const lockToUserMode = () => {
    setIsAdmin(false);
    try {
      sessionStorage.removeItem(STORAGE_KEY_ADMIN_ACTIVE);
    } catch {}
  };

  const updateAdminPin = async (
    oldPin: string,
    newPin: string
  ): Promise<{ success: boolean; message?: string }> => {
    const cleanOld = oldPin.trim();
    const cleanNew = newPin.trim();

    if (cleanOld !== SUPER_USER_PIN && cleanOld !== adminPin) {
      return { success: false, message: 'PIN lama yang Anda masukkan tidak sesuai.' };
    }

    if (!/^\d{4,8}$/.test(cleanNew)) {
      return { success: false, message: 'PIN baru harus terdiri dari 4 sampai 8 digit angka.' };
    }

    setAdminPin(cleanNew);
    try {
      localStorage.setItem(STORAGE_KEY_PIN, cleanNew);
    } catch {}

    if (currentUser) {
      try {
        await firestoreApi.setAdminPin(cleanNew);
      } catch (err) {
        console.warn('Sync adminPin to Firestore warning:', err);
      }
    }

    return { success: true, message: 'PIN Admin berhasil disimpan dan disinkronkan ke Firebase Firestore!' };
  };

  // Derived category lists
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'pemasukan'),
    [categories]
  );
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'pengeluaran'),
    [categories]
  );

  // Add transaction
  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!isAdmin) {
      openPinModal('Mode Admin diperlukan untuk mencatat uang masuk atau uang keluar.');
      return;
    }

    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTx: Transaction = {
      ...data,
      id: txId,
      createdAt: Date.now(),
      userId: currentUser?.uid || 'guest_admin',
    };

    // Optimistic local update
    setTransactions((prev) => [newTx, ...prev]);

    // Save to Firestore Realtime
    if (currentUser) {
      try {
        await firestoreApi.setTransaction(newTx);
      } catch (err) {
        console.error('Failed to save transaction to Firestore:', err);
      }
    } else {
      // Local storage fallback
      try {
        const updated = [newTx, ...transactions];
        localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(updated));
      } catch {}
    }
  };

  // Update transaction
  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    if (!isAdmin) {
      openPinModal('Mode Admin diperlukan untuk mengedit data transaksi kas.');
      return;
    }

    // Optimistic local update
    setTransactions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...data } : item))
    );

    if (currentUser) {
      try {
        await firestoreApi.updateTransaction(id, data);
      } catch (err) {
        console.error('Failed to update transaction in Firestore:', err);
      }
    }
  };

  // Delete transaction
  const deleteTransaction = async (id: string) => {
    if (!isAdmin) {
      openPinModal('Mode Admin diperlukan untuk menghapus transaksi kas.');
      return;
    }

    // Optimistic local update
    setTransactions((prev) => prev.filter((item) => item.id !== id));

    if (currentUser) {
      try {
        await firestoreApi.deleteTransaction(id);
      } catch (err) {
        console.error('Failed to delete transaction from Firestore:', err);
      }
    }
  };

  // Add category
  const addCategory = async (data: Omit<Category, 'id'>): Promise<Category> => {
    if (!isAdmin) {
      openPinModal('Mode Admin diperlukan untuk menambah kategori baru.');
      throw new Error('Hanya Admin yang dapat menambah kategori.');
    }

    const catId = `cat_${data.type.slice(0, 3)}_${Date.now()}`;
    const newCat: Category = {
      ...data,
      id: catId,
      isCustom: true,
      userId: currentUser?.uid || 'guest_admin',
    };

    setCategories((prev) => [...prev, newCat]);

    if (currentUser) {
      try {
        await firestoreApi.setCategory(newCat);
      } catch (err) {
        console.error('Failed to save category to Firestore:', err);
      }
    }

    return newCat;
  };

  // Update category
  const updateCategory = async (id: string, data: Partial<Category>) => {
    if (!isAdmin) {
      openPinModal('Mode Admin diperlukan untuk mengubah kategori.');
      return;
    }

    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...data } : cat))
    );

    if (currentUser) {
      try {
        await firestoreApi.updateCategory(id, data);
      } catch (err) {
        console.error('Failed to update category in Firestore:', err);
      }
    }
  };

  // Delete category
  const deleteCategory = async (id: string): Promise<{ success: boolean; message?: string }> => {
    if (!isAdmin) {
      openPinModal('Mode Admin diperlukan untuk menghapus kategori.');
      return { success: false, message: 'Hanya Admin yang dapat menghapus kategori.' };
    }

    const count = transactions.filter((t) => t.categoryId === id).length;
    if (count > 0) {
      return {
        success: false,
        message: `Kategori ini sedang digunakan oleh ${count} transaksi kas. Harap ubah kategori transaksi tersebut terlebih dahulu sebelum menghapus.`,
      };
    }

    setCategories((prev) => prev.filter((cat) => cat.id !== id));

    if (currentUser) {
      try {
        await firestoreApi.deleteCategory(id);
      } catch (err) {
        console.error('Failed to delete category in Firestore:', err);
      }
    }

    return { success: true };
  };

  // Reset to default
  const resetToDefaultData = async () => {
    if (!isAdmin) {
      openPinModal('Mode Admin diperlukan untuk mereset data kas.');
      return;
    }

    const defaultCats = [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES];
    const defaultTxs = getInitialSampleTransactions();

    setCategories(defaultCats);
    setAccounts(DEFAULT_ACCOUNTS);
    setTransactions(defaultTxs);

    if (currentUser) {
      try {
        await firestoreApi.seedInitialData(defaultCats, DEFAULT_ACCOUNTS, defaultTxs, adminPin);
      } catch (err) {
        console.error('Failed to reset Firestore:', err);
      }
    }

    localStorage.removeItem(STORAGE_KEY_TX);
    localStorage.removeItem(STORAGE_KEY_CAT);
    localStorage.removeItem(STORAGE_KEY_ACC);
  };

  // Export JSON backup
  const exportBackupData = (): string => {
    const payload = {
      version: 3,
      appName: 'BukuKas Pro Realtime',
      database: 'Firebase Cloud Firestore',
      projectId: firebaseConfig.projectId,
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
      exportDate: new Date().toISOString(),
      categories,
      accounts,
      transactions,
    };
    return JSON.stringify(payload, null, 2);
  };

  // Import JSON backup
  const importBackupData = async (jsonStr: string): Promise<boolean> => {
    if (!isAdmin) {
      openPinModal('Mode Admin diperlukan untuk mengimpor cadangan data.');
      return false;
    }

    try {
      const parsed = JSON.parse(jsonStr);

      if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
        throw new Error('Format data transaksi tidak valid');
      }

      const importedTransactions: Transaction[] = parsed.transactions;
      const importedCategories: Category[] =
        Array.isArray(parsed.categories) && parsed.categories.length > 0
          ? parsed.categories
          : categories;
      const importedAccounts: AccountWallet[] =
        Array.isArray(parsed.accounts) && parsed.accounts.length > 0
          ? parsed.accounts
          : accounts;

      setTransactions(importedTransactions);
      setCategories(importedCategories);
      setAccounts(importedAccounts);

      if (currentUser) {
        await firestoreApi.seedInitialData(
          importedCategories,
          importedAccounts,
          importedTransactions,
          adminPin
        );
      }

      return true;
    } catch (err) {
      console.error('Import backup error:', err);
      return false;
    }
  };

  // Calculation for monthly report
  const getMonthlyReport = useCallback(
    (month: number, year: number): MonthlyReportData => {
      const filtered = transactions.filter((t) => {
        if (!t.date) return false;
        const [yStr, mStr] = t.date.split('-');
        return parseInt(yStr, 10) === year && parseInt(mStr, 10) === month;
      });

      let totalIncome = 0;
      let totalExpense = 0;

      const incomeMap: Record<string, { total: number; count: number }> = {};
      const expenseMap: Record<string, { total: number; count: number }> = {};

      filtered.forEach((tx) => {
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'pemasukan') {
          totalIncome += amt;
          if (!incomeMap[tx.categoryId]) {
            incomeMap[tx.categoryId] = { total: 0, count: 0 };
          }
          incomeMap[tx.categoryId].total += amt;
          incomeMap[tx.categoryId].count += 1;
        } else {
          totalExpense += amt;
          if (!expenseMap[tx.categoryId]) {
            expenseMap[tx.categoryId] = { total: 0, count: 0 };
          }
          expenseMap[tx.categoryId].total += amt;
          expenseMap[tx.categoryId].count += 1;
        }
      });

      const netSavings = totalIncome - totalExpense;
      const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

      const incomeBreakdown: CategoryBreakdown[] = Object.keys(incomeMap).map((catId) => {
        const cat =
          categories.find((c) => c.id === catId) || {
            id: catId,
            name: 'Kategori Lain',
            type: 'pemasukan' as TransactionType,
            icon: 'CircleDollarSign',
            color: 'text-emerald-600 bg-emerald-50',
          };
        const totalAmount = incomeMap[catId].total;
        return {
          category: cat,
          totalAmount,
          transactionCount: incomeMap[catId].count,
          percentage: totalIncome > 0 ? (totalAmount / totalIncome) * 100 : 0,
        };
      });

      const expenseBreakdown: CategoryBreakdown[] = Object.keys(expenseMap).map((catId) => {
        const cat =
          categories.find((c) => c.id === catId) || {
            id: catId,
            name: 'Kategori Lain',
            type: 'pengeluaran' as TransactionType,
            icon: 'Receipt',
            color: 'text-rose-600 bg-rose-50',
          };
        const totalAmount = expenseMap[catId].total;
        return {
          category: cat,
          totalAmount,
          transactionCount: expenseMap[catId].count,
          percentage: totalExpense > 0 ? (totalAmount / totalExpense) * 100 : 0,
        };
      });

      incomeBreakdown.sort((a, b) => b.totalAmount - a.totalAmount);
      expenseBreakdown.sort((a, b) => b.totalAmount - a.totalAmount);

      return {
        month,
        year,
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
        incomeBreakdown,
        expenseBreakdown,
        transactions: filtered,
      };
    },
    [transactions, categories]
  );

  const activeReport = useMemo(() => {
    return getMonthlyReport(currentMonth, currentYear);
  }, [getMonthlyReport, currentMonth, currentYear]);

  const firebaseInfo: FirebaseStatusInfo = useMemo(() => {
    return {
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
      connected: isFirebaseConnected,
      userEmail: currentUser?.email || null,
      realtimeActive: isRealtimeActive,
      lastSyncTime,
      latencyMs,
    };
  }, [isFirebaseConnected, currentUser, isRealtimeActive, lastSyncTime, latencyMs]);

  return (
    <FinanceContext.Provider
      value={{
        isFirebaseConnected,
        isRealtimeActive,
        firebaseInfo,
        currentUser,
        isAuthLoading,
        loginWithGoogle,
        logoutUser,
        testConnection,
        transactions,
        categories,
        incomeCategories,
        expenseCategories,
        accounts,
        currentMonth,
        currentYear,
        setCurrentMonth,
        setCurrentYear,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        resetToDefaultData,
        importBackupData,
        exportBackupData,
        getMonthlyReport,
        activeReport,
        isAdmin,
        adminPin,
        unlockAdmin,
        lockToUserMode,
        updateAdminPin,
        pinModalOpen,
        pinModalReason,
        openPinModal,
        closePinModal,
        pinSettingsModalOpen,
        openPinSettingsModal,
        closePinSettingsModal,
        firebaseModalOpen,
        openFirebaseModal,
        closeFirebaseModal,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
