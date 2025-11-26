// types.ts - הגדרות TypeScript למערכת דוח חודש בודד

export interface Transaction {
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

// הוספה: Inventory types
export interface Inventory {
  [month: number]: number;
  [key: string]: number; // for year-month format
}

// הוספה: Adjustments types
export interface Adjustments2024 {
  [categoryCode: string]: {
    [month: number]: number | string;
  };
}
