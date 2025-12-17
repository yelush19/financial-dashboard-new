// RecurringExpensesPage.tsx
// דף עטיפה לכלי ניתוח הוצאות חוזרות - טוען נתונים מ-CSV
// 17/12/2025

import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { RecurringExpensesAnalysis } from './RecurringExpensesAnalysis';
import { useSecureCSV } from '../../hooks/useSecureCSV';

interface Transaction {
  koteret: number;
  vendorKey: number;
  vendorName: string;
  counterAccountNumber: number;
  counterAccountName: string;
  amount: number;
  date: string;
  sortCode: number | null;
  sortCodeName: string;
  accountKey: number;
  accountName: string;
  details: string;
}

const RecurringExpensesPage: React.FC = () => {
  const { csvData, loading: csvLoading, error: csvError } = useSecureCSV('TransactionMonthlyModi.csv');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!csvData) return;

    try {
      setLoading(true);
      setError(csvError);

      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const parsed: Transaction[] = (results as any).data
              .map((row: any) => ({
                koteret: parseInt(row['כותרת']) || 0,
                sortCode: row['קוד מיון'] ? parseInt(row['קוד מיון']) : null,
                sortCodeName: row['שם קוד מיון'] || '',
                accountKey: parseInt(row['מפתח חשבון']) || 0,
                accountName: row['שם חשבון'] || '',
                amount: parseFloat(row['חובה / זכות (שקל)']?.replace(/,/g, '') || '0'),
                details: row['פרטים'] || '',
                date: row['ת.אסמכ'] || '',
                counterAccountName: row['שם חשבון נגדי'] || '',
                counterAccountNumber: parseInt(row['ח-ן נגדי']) || 0,
                vendorKey: parseInt(row['ספק_מפתח']) || parseInt(row['ח-ן נגדי']) || 0,
                vendorName: row['ספק_שם'] || row['שם חשבון נגדי'] || '',
              }))
              .filter((tx: Transaction) => tx.accountKey !== 0 && tx.date);

            setTransactions(parsed);
            setLoading(false);
          } catch (err) {
            console.error('Error parsing data:', err);
            setError('שגיאה בעיבוד הנתונים');
            setLoading(false);
          }
        },
        error: (err: any) => {
          console.error('Error parsing CSV:', err);
          setError('שגיאה בקריאת קובץ ה-CSV');
          setLoading(false);
        }
      });
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      setError(error.message || 'שגיאה בטעינת הנתונים');
      setLoading(false);
    }
  }, [csvData, csvError]);

  // חישוב חודשים פעילים
  const months = useMemo(() => {
    if (!transactions.length) return [];
    return Array.from(new Set(
      transactions
        .filter(tx => tx.date && tx.date.split('/').length === 3)
        .map(tx => parseInt(tx.date.split('/')[1]))
    )).sort((a, b) => a - b);
  }, [transactions]);

  // פונקציית פורמט מטבע
  const formatCurrency = (amount: number): string => {
    const isNegative = amount < 0;
    const abs = Math.abs(amount);
    const formatted = new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0
    }).format(abs);
    return isNegative ? `(${formatted})` : formatted;
  };

  if (loading || csvLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-green-600 mx-auto mb-4 animate-spin" />
          <div className="text-xl text-gray-600">טוען נתונים...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-600 mb-2">שגיאה בטעינת הנתונים</p>
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  return (
    <RecurringExpensesAnalysis
      transactions={transactions}
      months={months}
      formatCurrency={formatCurrency}
    />
  );
};

export default RecurringExpensesPage;
