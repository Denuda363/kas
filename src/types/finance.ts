export type TransactionType = 'pemasukan' | 'pengeluaran';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isCustom?: boolean;
  description?: string;
  userId?: string;
}

export interface AccountWallet {
  id: string;
  name: string;
  icon: string;
  type: 'tunai' | 'bank' | 'ewallet';
  userId?: string;
}

export interface Transaction {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: TransactionType;
  amount: number;
  categoryId: string;
  accountId: string;
  note: string;
  recipientOrPayer?: string;
  receiptUrl?: string;
  createdAt: number;
}

export interface CategoryBreakdown {
  category: Category;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface MonthlyReportData {
  month: number; // 1 - 12
  year: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number; // in percentage
  incomeBreakdown: CategoryBreakdown[];
  expenseBreakdown: CategoryBreakdown[];
  transactions: Transaction[];
}
