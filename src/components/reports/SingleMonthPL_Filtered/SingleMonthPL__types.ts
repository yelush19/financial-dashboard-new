// types.ts - הגדרות TypeScript למערכת דוח חודש בודד
// 🔥 מעודכן עם koteret - 27/11/2025

export interface Transaction {
  koteret: number;  // 🆕 מספר כותרת לסינון
  title: string;    // כותרת התנועה (לתאימות אחורה)
  sortCode: number | null;
  sortCodeName: string;
  accountKey: number;
  accountName: string;
  amount: number;
  details: string;
  date: string;
  counterAccountName: string;
  counterAccountNumber: number;
}

export interface MonthlyData {
  [month: number]: number;
  total: number;
}

export interface VendorData {
  counterAccountNumber: number;
  counterAccountName: string;
  amount: number;
  transactions: Transaction[];
}

export interface AccountData {
  accountKey: number;
  accountName: string;
  amount: number;
  vendors: VendorData[];
  transactions: Transaction[];
}

export interface CategoryData {
  code: number | string;
  name: string;
  type: 'income' | 'cogs' | 'operating' | 'financial';
  amount: number;
  accounts: AccountData[];
  transactions: Transaction[];
}

export interface BiurData {
  title: string;
  transactions: Transaction[];
}

export interface SingleMonthSummary {
  revenue: number;
  cogs: number;
  grossProfit: number;
  operating: number;
  operatingProfit: number;
  financial: number;
  netProfit: number;
}
