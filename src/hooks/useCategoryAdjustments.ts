// src/hooks/useCategoryAdjustments.ts
// Hook לטעינת והזנת התאמות לפי קוד מיון (sort code)

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

interface CategoryAdjustmentsData {
  [month: number]: number;
}

interface UseCategoryAdjustmentsReturn {
  adjustments: CategoryAdjustmentsData;
  loading: boolean;
  error: any;
  saveAdjustment: (month: number, amount: number) => Promise<void>;
  deleteAdjustment: (month: number) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook לניהול התאמות קטגוריות (category adjustments)
 * @param sortCode - קוד המיון (למשל: 800, 801, 802)
 * @param year - שנה
 * @returns אובייקט עם adjustments, loading, error, ופונקציות שמירה/מחיקה
 */
export function useCategoryAdjustments(
  sortCode: number,
  year: number
): UseCategoryAdjustmentsReturn {
  const [adjustments, setAdjustments] = useState<CategoryAdjustmentsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // טעינת נתונים מ-Supabase
  const fetchAdjustments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('adjustments')
        .select('*')
        .eq('sort_code', sortCode)
        .eq('year', year)
        .in('adjustment_type', ['category_adjustment', 'prior_year_adjustment']);

      if (fetchError) {
        console.warn('Warning fetching category adjustments:', fetchError.message);
        setAdjustments({});
        return;
      }

      // המרה למבנה נוח: { 1: -1000, 2: -500, ... }
      const adjustmentsMap: CategoryAdjustmentsData = {};
      data?.forEach((record: any) => {
        if (record.month !== null && record.amount !== null) {
          adjustmentsMap[record.month] = (adjustmentsMap[record.month] || 0) + record.amount;
        }
      });

      setAdjustments(adjustmentsMap);
    } catch (err) {
      console.warn('Exception fetching category adjustments:', err);
      setError(err);
      setAdjustments({});
    } finally {
      setLoading(false);
    }
  }, [sortCode, year]);

  useEffect(() => {
    fetchAdjustments();
  }, [fetchAdjustments]);

  // שמירת התאמה בודדת
  const saveAdjustment = async (month: number, amount: number) => {
    try {
      const { error: upsertError } = await supabase
        .from('adjustments')
        .upsert({
          sort_code: sortCode,
          account_key: sortCode, // לתאימות
          year,
          month,
          adjustment_type: 'category_adjustment',
          amount,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'sort_code,year,month,adjustment_type'
        });

      if (upsertError) {
        console.error('Error saving adjustment:', upsertError);
        throw upsertError;
      }

      // עדכון local state
      setAdjustments(prev => ({
        ...prev,
        [month]: amount
      }));
    } catch (err) {
      console.error('Exception saving adjustment:', err);
      throw err;
    }
  };

  // מחיקת התאמה בודדת
  const deleteAdjustment = async (month: number) => {
    try {
      const { error: deleteError } = await supabase
        .from('adjustments')
        .delete()
        .eq('sort_code', sortCode)
        .eq('year', year)
        .eq('month', month)
        .eq('adjustment_type', 'category_adjustment');

      if (deleteError) {
        console.error('Error deleting adjustment:', deleteError);
        throw deleteError;
      }

      // עדכון local state
      setAdjustments(prev => {
        const newAdj = { ...prev };
        delete newAdj[month];
        return newAdj;
      });
    } catch (err) {
      console.error('Exception deleting adjustment:', err);
      throw err;
    }
  };

  return {
    adjustments,
    loading,
    error,
    saveAdjustment,
    deleteAdjustment,
    refresh: fetchAdjustments
  };
}

/**
 * Hook לשמירה מרובה של התאמות (batch save)
 * שימושי למודל עריכה שמאפשר עריכת כל החודשים בבת אחת
 */
export function useBatchCategoryAdjustments(year: number) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  /**
   * שמירת כל ההתאמות בבת אחת
   * @param adjustmentsData - { '800': { 1: -1000, 2: -500 }, '801': { 1: -200 } }
   */
  const saveBatchAdjustments = async (adjustmentsData: {
    [sortCode: string]: { [month: number]: number | string };
  }) => {
    try {
      setLoading(true);
      setError(null);

      // המרה למערך של records
      const records: any[] = [];
      Object.entries(adjustmentsData).forEach(([sortCode, months]) => {
        Object.entries(months).forEach(([month, amount]) => {
          const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
          
          // שמור רק אם הסכום לא 0
          if (numAmount !== 0) {
            records.push({
              sort_code: parseInt(sortCode),
              account_key: parseInt(sortCode), // לתאימות
              year,
              month: parseInt(month),
              adjustment_type: 'category_adjustment',
              amount: numAmount,
              updated_at: new Date().toISOString()
            });
          }
        });
      });

      // מחיקת כל ההתאמות הישנות לשנה זו
      const sortCodes = Object.keys(adjustmentsData).map(Number);
      
      if (sortCodes.length > 0) {
        const { error: deleteError } = await supabase
          .from('adjustments')
          .delete()
          .eq('year', year)
          .eq('adjustment_type', 'category_adjustment')
          .in('sort_code', sortCodes);

        if (deleteError) {
          console.warn('Warning deleting old adjustments:', deleteError.message);
          // ממשיכים בכל זאת
        }
      }

      // הוספת הרשומות החדשות
      if (records.length > 0) {
        const { error: insertError } = await supabase
          .from('adjustments')
          .insert(records);

        if (insertError) {
          console.error('Error inserting adjustments:', insertError);
          throw insertError;
        }
      }

      console.log(`✅ Saved ${records.length} category adjustments`);
      return { success: true, count: records.length };
    } catch (err) {
      console.error('Exception saving batch adjustments:', err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    saveBatchAdjustments,
    loading,
    error
  };
}

/**
 * Hook לטעינת כל ההתאמות לשנה (לכל קודי המיון)
 */
export function useAllCategoryAdjustments(year: number) {
  const [adjustments, setAdjustments] = useState<{
    [sortCode: number]: { [month: number]: number };
  }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchAllAdjustments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('adjustments')
        .select('*')
        .eq('year', year)
        .in('adjustment_type', ['category_adjustment', 'prior_year_adjustment']);

      if (fetchError) {
        console.warn('Warning fetching all adjustments:', fetchError.message);
        setAdjustments({});
        return;
      }

      // המרה למבנה: { 800: { 1: -1000, 2: -500 }, 801: { 1: -200 } }
      const result: { [sortCode: number]: { [month: number]: number } } = {};
      
      data?.forEach((record: any) => {
        const sortCode = record.sort_code;
        const month = record.month;
        const amount = record.amount;
        
        if (sortCode && month !== null && amount !== null) {
          if (!result[sortCode]) {
            result[sortCode] = {};
          }
          result[sortCode][month] = (result[sortCode][month] || 0) + amount;
        }
      });

      setAdjustments(result);
    } catch (err) {
      console.warn('Exception fetching all adjustments:', err);
      setError(err);
      setAdjustments({});
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchAllAdjustments();
  }, [fetchAllAdjustments]);

  return {
    adjustments,
    loading,
    error,
    refresh: fetchAllAdjustments
  };
}
