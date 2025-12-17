// src/hooks/useSecureCSV.ts
// Hook לטעינת CSV מ-Context, localStorage, או Supabase

import { useState, useEffect } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { loadCSVFile } from '../lib/supabaseClient';

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

        // אם לא, נסה לטעון מ-localStorage/Supabase
        const fileType = fileName === 'TransactionMonthlyModi.csv' ? 'transactions' : 'balance';
        const storedData = await loadCSVFile(fileType);

        if (storedData) {
          setCsvData(storedData);
          setLoading(false);
          return;
        }

        // אם אין נתונים בכלל, הצג הודעה
        throw new Error(`קובץ ${fileName} לא נמצא. אנא העלה את הקובץ דרך ממשק ההעלאה.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה בטעינת הקובץ');
        setLoading(false);
      }
    };

    loadData();
  }, [fileName, transactionsData, balanceData]);

  return { csvData, loading, error };
};
