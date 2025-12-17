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

        // קבלת URL ציבורי לקובץ
        const { data: urlData } = supabase.storage
          .from('csv-files')
          .getPublicUrl(fileName);

        if (!urlData?.publicUrl) {
          throw new Error(`Failed to get public URL for ${fileName}`);
        }

        // הורדת הקובץ דרך fetch
        const response = await fetch(urlData.publicUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${fileName}: ${response.statusText}`);
        }

        const text = await response.text();
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
