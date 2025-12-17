// src/hooks/useSecureCSV.ts
// Hook לטעינת CSV מ-Context או מ-Public (fallback)

import { useState, useEffect } from 'react';
import { useDataContext } from '../contexts/DataContext';

export const useSecureCSV = (fileName: 'TransactionMonthlyModi.csv' | 'BalanceMonthlyModi.csv') => {
  const { transactionsData, balanceData } = useDataContext();
  const [csvData, setCsvData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // אם יש נתונים ב-Context, השתמש בהם
        if (fileName === 'TransactionMonthlyModi.csv' && transactionsData) {
          setCsvData(transactionsData);
          setLoading(false);
          return;
        }

        if (fileName === 'BalanceMonthlyModi.csv' && balanceData) {
          setCsvData(balanceData);
          setLoading(false);
          return;
        }

        // אם לא, נסה לטעון מ-localStorage
        const storedData = localStorage.getItem(
          fileName === 'TransactionMonthlyModi.csv' ? 'transactionsData' : 'balanceData'
        );

        if (storedData) {
          setCsvData(storedData);
          // עדכן גם את ה-Context
          if (fileName === 'TransactionMonthlyModi.csv') {
            // Context will be updated via DataProvider
          }
          setLoading(false);
          return;
        }

        // Fallback - נסה לטעון מ-public/ (לתמיכה לאחור)
        const response = await fetch(`/${fileName}`);
        if (!response.ok) {
          throw new Error(`קובץ ${fileName} לא נמצא. אנא העלה את הקובץ דרך ממשק ההעלאה.`);
        }

        const text = await response.text();
        setCsvData(text);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה בטעינת הקובץ');
        setLoading(false);
      }
    };

    loadData();
  }, [fileName, transactionsData, balanceData]);

  return { csvData, loading, error };
};
