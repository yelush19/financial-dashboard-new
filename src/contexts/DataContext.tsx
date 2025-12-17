// src/contexts/DataContext.tsx
// Context לניהול קבצי נתונים מועלים - TransactionMonthlyModi.csv & BalanceMonthlyModi.csv

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DataContextType {
  transactionsData: string | null;
  balanceData: string | null;
  setTransactionsData: (data: string) => void;
  setBalanceData: (data: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactionsData, setTransactionsData] = useState<string | null>(null);
  const [balanceData, setBalanceData] = useState<string | null>(null);

  return (
    <DataContext.Provider
      value={{
        transactionsData,
        balanceData,
        setTransactionsData,
        setBalanceData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};
