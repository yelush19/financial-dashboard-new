// src/hooks/useSecureCSV.ts
// Hook לטעינת CSV מ-public folder

import { useState, useEffect } from 'react';

export const useSecureCSV = (fileName: 'TransactionMonthlyModi.csv' | 'BalanceMonthlyModi.csv') => {
  const [csvData, setCsvData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/${fileName}`);
        if (!response.ok) {
          throw new Error(`Failed to load ${fileName}`);
        }

        const text = await response.text();
        setCsvData(text);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading file');
        setLoading(false);
      }
    };

    loadData();
  }, [fileName]);

  return { csvData, loading, error };
};
