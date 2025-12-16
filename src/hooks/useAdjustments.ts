import { useState, useEffect, useCallback } from 'react';
import {
  getInventoryOpening,
  getInventoryClosing,
  saveInventoryOpening,
  saveInventoryClosing,
  getYearlyInventory,
  saveYearlyInventory,
  getPriorYearAdjustment,
  savePriorYearAdjustment,
  getAccountInventoryMap,
  type Adjustment
} from '../lib/supabaseClient';

// ===============================
// Hook למלאי חודשי
// ===============================

export function useMonthlyInventory(
  accountKey: number,
  year: number,
  month: number
) {
  const [opening, setOpening] = useState<number>(0);
  const [closing, setClosing] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // טעינת מלאי
  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const [openingAmount, closingAmount] = await Promise.all([
        getInventoryOpening(accountKey, year, month),
        getInventoryClosing(accountKey, year, month)
      ]);
      setOpening(openingAmount);
      setClosing(closingAmount);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  }, [accountKey, year, month]);

  // שמירת מלאי פתיחה
  const updateOpening = useCallback(async (amount: number, note?: string) => {
    setSaving(true);
    try {
      const success = await saveInventoryOpening(accountKey, year, month, amount, note);
      if (success) {
        setOpening(amount);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving opening inventory:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [accountKey, year, month]);

  // שמירת מלאי סגירה + יצירת פתיחה אוטומטית
  const updateClosing = useCallback(async (amount: number, note?: string) => {
    setSaving(true);
    try {
      const success = await saveInventoryClosing(accountKey, year, month, amount, note);
      if (success) {
        setClosing(amount);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving closing inventory:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [accountKey, year, month]);

  // טעינה ראשונית
  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  return {
    opening,
    closing,
    loading,
    saving,
    updateOpening,
    updateClosing,
    reload: loadInventory
  };
}

// ===============================
// Hook למלאי שנתי (2024)
// ===============================

export function useYearlyInventory(
  accountKey: number,
  year: number
) {
  const [opening, setOpening] = useState<number>(0);
  const [closing, setClosing] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // טעינת מלאי שנתי
  const loadInventory = useCallback(async () => {
    setLoading(true);
    try {
      const [openingAmount, closingAmount] = await Promise.all([
        getYearlyInventory(accountKey, year, 'opening'),
        getYearlyInventory(accountKey, year, 'closing')
      ]);
      setOpening(openingAmount);
      setClosing(closingAmount);
    } catch (error) {
      console.error('Error loading yearly inventory:', error);
    } finally {
      setLoading(false);
    }
  }, [accountKey, year]);

  // שמירת מלאי פתיחה שנתי
  const updateOpening = useCallback(async (amount: number, note?: string) => {
    setSaving(true);
    try {
      const success = await saveYearlyInventory(accountKey, year, 'opening', amount, note);
      if (success) {
        setOpening(amount);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving yearly opening:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [accountKey, year]);

  // שמירת מלאי סגירה שנתי
  const updateClosing = useCallback(async (amount: number, note?: string) => {
    setSaving(true);
    try {
      const success = await saveYearlyInventory(accountKey, year, 'closing', amount, note);
      if (success) {
        setClosing(amount);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving yearly closing:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [accountKey, year]);

  // טעינה ראשונית
  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  return {
    opening,
    closing,
    loading,
    saving,
    updateOpening,
    updateClosing,
    reload: loadInventory
  };
}

// ===============================
// Hook להתאמות שנה קודמת
// ===============================

export function usePriorYearAdjustment(
  accountKey: number,
  currentYear: number
) {
  const [adjustment, setAdjustment] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const priorYear = currentYear - 1;

  // טעינת התאמה
  const loadAdjustment = useCallback(async () => {
    setLoading(true);
    try {
      const amount = await getPriorYearAdjustment(accountKey, currentYear);
      setAdjustment(amount);
    } catch (error) {
      console.error('Error loading prior year adjustment:', error);
    } finally {
      setLoading(false);
    }
  }, [accountKey, currentYear]);

  // שמירת התאמה
  const updateAdjustment = useCallback(async (amount: number) => {
    setSaving(true);
    try {
      const success = await savePriorYearAdjustment(
        accountKey,
        currentYear,
        priorYear,
        amount
      );
      if (success) {
        setAdjustment(amount);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving prior year adjustment:', error);
      return false;
    } finally {
      setSaving(false);
    }
  }, [accountKey, currentYear, priorYear]);

  // טעינה ראשונית
  useEffect(() => {
    loadAdjustment();
  }, [loadAdjustment]);

  return {
    adjustment,
    priorYear,
    loading,
    saving,
    updateAdjustment,
    reload: loadAdjustment
  };
}

// ===============================
// Hook למפת מלאי שנתית (כל החודשים)
// ===============================

export function useAccountYearInventory(
  accountKey: number,
  year: number
) {
  const [inventoryMap, setInventoryMap] = useState<Map<number, { opening: number; closing: number }>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);

  // טעינת כל המלאי של השנה
  const loadInventoryMap = useCallback(async () => {
    setLoading(true);
    try {
      const map = await getAccountInventoryMap(accountKey, year);
      setInventoryMap(map);
    } catch (error) {
      console.error('Error loading inventory map:', error);
    } finally {
      setLoading(false);
    }
  }, [accountKey, year]);

  // קבלת מלאי לחודש מסוים
  const getMonthInventory = useCallback((month: number) => {
    return inventoryMap.get(month) || { opening: 0, closing: 0 };
  }, [inventoryMap]);

  // טעינה ראשונית
  useEffect(() => {
    loadInventoryMap();
  }, [loadInventoryMap]);

  return {
    inventoryMap,
    loading,
    getMonthInventory,
    reload: loadInventoryMap
  };
}

// ===============================
// Hook משולב - כל הנתונים לחשבון
// ===============================

export function useAccountAdjustments(
  accountKey: number,
  year: number,
  month?: number
) {
  // מלאי חודשי (אם יש חודש)
  const monthlyInventory = useMonthlyInventory(
    accountKey,
    year,
    month || 1
  );

  // מלאי שנתי (לשנים לפני 2025)
  const yearlyInventory = useYearlyInventory(accountKey, year);

  // התאמות שנה קודמת
  const priorYearAdj = usePriorYearAdjustment(accountKey, year);

  // טעינה מחדש של הכל
  const reloadAll = useCallback(() => {
    monthlyInventory.reload();
    yearlyInventory.reload();
    priorYearAdj.reload();
  }, [monthlyInventory, yearlyInventory, priorYearAdj]);

  // בדיקה אם עדיין טוען
  const loading = monthlyInventory.loading || yearlyInventory.loading || priorYearAdj.loading;

  // בדיקה אם שומר
  const saving = monthlyInventory.saving || yearlyInventory.saving || priorYearAdj.saving;

  return {
    // מלאי חודשי
    monthly: {
      opening: monthlyInventory.opening,
      closing: monthlyInventory.closing,
      updateOpening: monthlyInventory.updateOpening,
      updateClosing: monthlyInventory.updateClosing
    },
    // מלאי שנתי
    yearly: {
      opening: yearlyInventory.opening,
      closing: yearlyInventory.closing,
      updateOpening: yearlyInventory.updateOpening,
      updateClosing: yearlyInventory.updateClosing
    },
    // התאמות
    priorYear: {
      amount: priorYearAdj.adjustment,
      year: priorYearAdj.priorYear,
      update: priorYearAdj.updateAdjustment
    },
    // מצב
    loading,
    saving,
    reloadAll
  };
}