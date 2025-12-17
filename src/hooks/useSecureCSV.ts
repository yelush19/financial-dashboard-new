// src/hooks/useSecureCSV.ts
// Hook לטעינת CSV מ-Supabase Storage עם authentication

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useSecureCSV = (fileName: 'TransactionMonthlyModi.csv' | 'BalanceMonthlyModi.csv') => {
  const [csvData, setCsvData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // קבלת session כדי לוודא שהמשתמש מחובר
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('User not authenticated');
        }

        // טעינת הקובץ מ-Supabase Storage
        const { data, error: downloadError } = await supabase.storage
          .from('csv-files')
          .download(fileName);

        if (downloadError) {
          throw new Error(`Failed to load ${fileName}: ${downloadError.message}`);
        }

        // המרת Blob לטקסט
        const text = await data.text();
        setCsvData(text);
        setLoading(false);
      } catch (err) {
        console.error('Error loading CSV:', err);
        setError(err instanceof Error ? err.message : 'Error loading file');
        setLoading(false);
      }
    };

    loadData();
  }, [fileName]);

  return { csvData, loading, error };
};
