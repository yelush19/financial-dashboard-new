// src/types/reportTypes.ts

export interface Transaction {
  koteret: number;
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
  name: string;
  data: MonthlyData;
  transactions: Transaction[];
}

export interface CategoryData {
  code: number | string;
  name: string;
  type: 'income' | 'cogs' | 'operating' | 'financial';
  data: MonthlyData;
  vendors?: VendorData[];
}

export interface ProcessedMonthlyData {
  months: number[];
  categories: CategoryData[];
  totals: {
    revenue: MonthlyData;
    cogs: MonthlyData;
    grossProfit: MonthlyData;
    operating: MonthlyData;
    operatingProfit: MonthlyData;
    financial: MonthlyData;
    netProfit: MonthlyData;
  };
}

export interface Inventory {
  [month: number]: number;
}

export interface Adjustments2024 {
  [categoryCode: string]: {
    [month: number]: number | string;
  };
}

export interface BiurData {
  title: string;
  transactions: Transaction[];
  month?: number;
}