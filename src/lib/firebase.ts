import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  writeBatch,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Transaction, Category, AccountWallet } from '../types/finance';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// CRITICAL: Initialize Firestore using the designated databaseId from config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Standard Error Handling for Firestore Security & Permissions
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CRITICAL CONSTRAINT: Test connection on app boot
export async function testFirestoreConnection(): Promise<{
  success: boolean;
  latencyMs?: number;
  message?: string;
}> {
  const start = performance.now();
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    const latencyMs = Math.round(performance.now() - start);
    return { success: true, latencyMs };
  } catch (error) {
    const latencyMs = Math.round(performance.now() - start);
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection: Client is offline.');
      return { success: false, latencyMs, message: 'Klien saat ini offline atau koneksi internet terputus.' };
    }
    // Document might not exist or permission denied for test doc, but connection reached server
    return { success: true, latencyMs };
  }
}

// Execute initial connection check
testFirestoreConnection().catch((err) => {
  console.warn('Initial Firebase ping:', err);
});

// Authentication helper
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
}

// Realtime Firestore CRUD Helpers
export const firestoreApi = {
  // Transactions
  subscribeTransactions(
    onData: (txs: Transaction[]) => void,
    onError?: (err: any) => void
  ) {
    const colRef = collection(db, 'transactions');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const txs: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          txs.push(docSnap.data() as Transaction);
        });
        // Sort descending by date and time/createdAt
        txs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        onData(txs);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, 'transactions');
      }
    );
  },

  async setTransaction(tx: Transaction): Promise<void> {
    const path = `transactions/${tx.id}`;
    try {
      await setDoc(doc(db, 'transactions', tx.id), tx);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateTransaction(id: string, partialTx: Partial<Transaction>): Promise<void> {
    const path = `transactions/${id}`;
    try {
      await updateDoc(doc(db, 'transactions', id), partialTx as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteTransaction(id: string): Promise<void> {
    const path = `transactions/${id}`;
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Categories
  subscribeCategories(
    onData: (cats: Category[]) => void,
    onError?: (err: any) => void
  ) {
    const colRef = collection(db, 'categories');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const cats: Category[] = [];
        snapshot.forEach((docSnap) => {
          cats.push(docSnap.data() as Category);
        });
        onData(cats);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, 'categories');
      }
    );
  },

  async setCategory(cat: Category): Promise<void> {
    const path = `categories/${cat.id}`;
    try {
      await setDoc(doc(db, 'categories', cat.id), cat);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateCategory(id: string, partialCat: Partial<Category>): Promise<void> {
    const path = `categories/${id}`;
    try {
      await updateDoc(doc(db, 'categories', id), partialCat as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async deleteCategory(id: string): Promise<void> {
    const path = `categories/${id}`;
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Accounts
  subscribeAccounts(
    onData: (accs: AccountWallet[]) => void,
    onError?: (err: any) => void
  ) {
    const colRef = collection(db, 'accounts');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const accs: AccountWallet[] = [];
        snapshot.forEach((docSnap) => {
          accs.push(docSnap.data() as AccountWallet);
        });
        onData(accs);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, 'accounts');
      }
    );
  },

  async setAccount(acc: AccountWallet): Promise<void> {
    const path = `accounts/${acc.id}`;
    try {
      await setDoc(doc(db, 'accounts', acc.id), acc);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Settings (PIN Admin)
  subscribeAdminPin(
    onData: (pin: string) => void,
    onError?: (err: any) => void
  ) {
    const docRef = doc(db, 'settings', 'adminPin');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const val = docSnap.data()?.value;
          if (val) onData(val);
        }
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, 'settings/adminPin');
      }
    );
  },

  async setAdminPin(newPin: string): Promise<void> {
    const path = 'settings/adminPin';
    try {
      await setDoc(doc(db, 'settings', 'adminPin'), {
        key: 'adminPin',
        value: newPin,
        updatedAt: Date.now(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Seed default data if database is empty
  async seedInitialData(
    categories: Category[],
    accounts: AccountWallet[],
    transactions: Transaction[],
    adminPin: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Save initial PIN
      batch.set(doc(db, 'settings', 'adminPin'), {
        key: 'adminPin',
        value: adminPin,
        updatedAt: Date.now(),
      });

      // Categories
      categories.forEach((cat) => {
        batch.set(doc(db, 'categories', cat.id), cat);
      });

      // Accounts
      accounts.forEach((acc) => {
        batch.set(doc(db, 'accounts', acc.id), acc);
      });

      // Transactions
      transactions.forEach((tx) => {
        batch.set(doc(db, 'transactions', tx.id), tx);
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'batch-seed');
    }
  },
};
