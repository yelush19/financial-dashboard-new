import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://fcrmghhjdnnnvpzsqieb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcm1naGhqZG5ubnZwenNxaWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MDEzODQsImV4cCI6MjA3NjA3NzM4NH0.wer5qFOj4ZLXuxRieEzJyzb85py4lNDMuqgCtM3-5Nw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export type AdjustmentType = 
  | 'inventory_opening'        // מלאי פתיחה
  | 'inventory_closing'        // מלאי סגירה
  | 'prior_year_adjustment'    // התאמות שנה קודמת
  | 'other_adjustment';        // התאמות אחרות

export interface Adjustment {
  id?: number;
  account_key: number;
  year: number;
  month: number | null;  // null = שנתי (כמו 2024)
  adjustment_type: AdjustmentType;
  amount: number;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

// ===============================
// 1. פונקציות כלליות
// ===============================

/**
 * טעינת כל ההתאמות לחשבון מסוים
 */
export async function getAccountAdjustments(
  accountKey: number,
  year?: number
): Promise<Adjustment[]> {
  try {
    let query = supabase
      .from('adjustments')
      .select('*')
      .eq('account_key', accountKey)
      .order('year', { ascending: false })
      .order('month', { ascending: false, nullsFirst: false });

    if (year) {
      query = query.eq('year', year);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching adjustments:', error);
    return [];
  }
}

/**
 * טעינת התאמה ספציפית
 */
export async function getAdjustment(
  accountKey: number,
  year: number,
  month: number | null,
  adjustmentType: AdjustmentType
): Promise<Adjustment | null> {
  try {
    let query = supabase
      .from('adjustments')
      .select('*')
      .eq('account_key', accountKey)
      .eq('year', year)
      .eq('adjustment_type', adjustmentType);

    if (month === null) {
      query = query.is('month', null);
    } else {
      query = query.eq('month', month);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') return null; // לא נמצא
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching adjustment:', error);
    return null;
  }
}

/**
 * שמירת/עדכון התאמה
 */
export async function saveAdjustment(adjustment: Adjustment): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('adjustments')
      .upsert(
        {
          account_key: adjustment.account_key,
          year: adjustment.year,
          month: adjustment.month,
          adjustment_type: adjustment.adjustment_type,
          amount: adjustment.amount,
          note: adjustment.note,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'account_key,year,month,adjustment_type'
        }
      );

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving adjustment:', error);
    return false;
  }
}

/**
 * מחיקת התאמה
 */
export async function deleteAdjustment(
  accountKey: number,
  year: number,
  month: number | null,
  adjustmentType: AdjustmentType
): Promise<boolean> {
  try {
    let query = supabase
      .from('adjustments')
      .delete()
      .eq('account_key', accountKey)
      .eq('year', year)
      .eq('adjustment_type', adjustmentType);

    if (month === null) {
      query = query.is('month', null);
    } else {
      query = query.eq('month', month);
    }

    const { error } = await query;

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting adjustment:', error);
    return false;
  }
}

// ===============================
// 2. פונקציות מלאי (Inventory)
// ===============================

/**
 * טעינת מלאי פתיחה לחודש
 */
export async function getInventoryOpening(
  accountKey: number,
  year: number,
  month: number
): Promise<number> {
  const adjustment = await getAdjustment(
    accountKey,
    year,
    month,
    'inventory_opening'
  );
  return adjustment?.amount || 0;
}

/**
 * טעינת מלאי סגירה לחודש
 */
export async function getInventoryClosing(
  accountKey: number,
  year: number,
  month: number
): Promise<number> {
  const adjustment = await getAdjustment(
    accountKey,
    year,
    month,
    'inventory_closing'
  );
  return adjustment?.amount || 0;
}

/**
 * שמירת מלאי פתיחה
 * מאפשרת עריכה ידנית במידת הצורך
 */
export async function saveInventoryOpening(
  accountKey: number,
  year: number,
  month: number,
  amount: number,
  note?: string
): Promise<boolean> {
  return saveAdjustment({
    account_key: accountKey,
    year,
    month,
    adjustment_type: 'inventory_opening',
    amount,
    note
  });
}

/**
 * שמירת מלאי סגירה + יצירת פתיחה אוטומטית לחודש הבא
 */
export async function saveInventoryClosing(
  accountKey: number,
  year: number,
  month: number,
  amount: number,
  note?: string
): Promise<boolean> {
  try {
    // 1. שמירת מלאי סגירה
    const closingSaved = await saveAdjustment({
      account_key: accountKey,
      year,
      month,
      adjustment_type: 'inventory_closing',
      amount,
      note
    });

    if (!closingSaved) return false;

    // 2. חישוב חודש/שנה הבאים
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    // 3. יצירת מלאי פתיחה אוטומטי לחודש הבא
    await saveAdjustment({
      account_key: accountKey,
      year: nextYear,
      month: nextMonth,
      adjustment_type: 'inventory_opening',
      amount,
      note: note || `מלאי פתיחה אוטומטי מחודש ${month}/${year}`
    });

    return true;
  } catch (error) {
    console.error('Error saving inventory closing:', error);
    return false;
  }
}

/**
 * טעינת מלאי שנתי (2024 - שנה לפני המעקב החודשי)
 */
export async function getYearlyInventory(
  accountKey: number,
  year: number,
  type: 'opening' | 'closing'
): Promise<number> {
  const adjustmentType = type === 'opening' ? 'inventory_opening' : 'inventory_closing';
  const adjustment = await getAdjustment(
    accountKey,
    year,
    null,  // חודש null = שנתי
    adjustmentType
  );
  return adjustment?.amount || 0;
}

/**
 * שמירת מלאי שנתי (2024)
 */
export async function saveYearlyInventory(
  accountKey: number,
  year: number,
  type: 'opening' | 'closing',
  amount: number,
  note?: string
): Promise<boolean> {
  const adjustmentType = type === 'opening' ? 'inventory_opening' : 'inventory_closing';
  return saveAdjustment({
    account_key: accountKey,
    year,
    month: null,  // חודש null = שנתי
    adjustment_type: adjustmentType,
    amount,
    note
  });
}

// ===============================
// 3. פונקציות התאמות שנה קודמת
// ===============================

/**
 * טעינת התאמות שנה קודמת
 * דוגמה: בשנת 2025 - התאמות 2024
 */
export async function getPriorYearAdjustment(
  accountKey: number,
  currentYear: number
): Promise<number> {
  const adjustment = await getAdjustment(
    accountKey,
    currentYear,
    null,  // שנתי
    'prior_year_adjustment'
  );
  return adjustment?.amount || 0;
}

/**
 * שמירת התאמות שנה קודמת
 */
export async function savePriorYearAdjustment(
  accountKey: number,
  currentYear: number,
  priorYear: number,
  amount: number
): Promise<boolean> {
  return saveAdjustment({
    account_key: accountKey,
    year: currentYear,
    month: null,
    adjustment_type: 'prior_year_adjustment',
    amount,
    note: `התאמות ${priorYear}`
  });
}

// ===============================
// 4. פונקציות חישוב
// ===============================

/**
 * חישוב עלות מכר לחודש
 * נוסחה: מלאי פתיחה + רכישות - מלאי סגירה
 */
export async function calculateMonthlyCOGS(
  accountKey: number,
  year: number,
  month: number,
  purchases: number
): Promise<number> {
  const opening = await getInventoryOpening(accountKey, year, month);
  const closing = await getInventoryClosing(accountKey, year, month);
  
  return opening + purchases - closing;
}

/**
 * חישוב עלות מכר שנתית
 */
export async function calculateYearlyCOGS(
  accountKey: number,
  year: number,
  totalPurchases: number
): Promise<number> {
  // מלאי פתיחה שנתי
  const opening = await getYearlyInventory(accountKey, year, 'opening');
  
  // מלאי סגירה - האם זה שנתי או מהחודש האחרון?
  let closing: number;
  
  if (year < 2025) {
    // לפני 2025 - מלאי שנתי
    closing = await getYearlyInventory(accountKey, year, 'closing');
  } else {
    // מ-2025 ואילך - מלאי סגירה מדצמבר
    closing = await getInventoryClosing(accountKey, year, 12);
  }
  
  return opening + totalPurchases - closing;
}

/**
 * טעינת כל המלאים לחשבון בשנה מסוימת
 * מחזיר מפה: חודש -> {opening, closing}
 */
export async function getAccountInventoryMap(
  accountKey: number,
  year: number
): Promise<Map<number, { opening: number; closing: number }>> {
  const inventoryMap = new Map<number, { opening: number; closing: number }>();
  
  // טעינת כל ההתאמות של החשבון לשנה
  const adjustments = await getAccountAdjustments(accountKey, year);
  
  // סינון רק מלאי
  const inventoryAdjustments = adjustments.filter(
    adj => adj.adjustment_type === 'inventory_opening' || 
           adj.adjustment_type === 'inventory_closing'
  );
  
  // מיפוי לפי חודש
  for (const adj of inventoryAdjustments) {
    if (adj.month === null) continue; // דילוג על שנתי
    
    if (!inventoryMap.has(adj.month)) {
      inventoryMap.set(adj.month, { opening: 0, closing: 0 });
    }
    
    const monthData = inventoryMap.get(adj.month)!;
    if (adj.adjustment_type === 'inventory_opening') {
      monthData.opening = adj.amount;
    } else {
      monthData.closing = adj.amount;
    }
  }
  
  return inventoryMap;
}

// ===============================
// 5. פונקציות עזר
// ===============================

/**
 * בדיקה האם חשבון שייך לעלות מכר (קוד מיון 800)
 */
export function isCOGSAccount(sortCode: number): boolean {
  return sortCode === 800;
}

/**
 * טעינת כל ההתאמות לשנה (לא כולל מלאי)
 */
export async function getYearAdjustments(year: number): Promise<Adjustment[]> {
  try {
    const { data, error } = await supabase
      .from('adjustments')
      .select('*')
      .eq('year', year)
      .neq('adjustment_type', 'inventory_opening')
      .neq('adjustment_type', 'inventory_closing')
      .order('account_key', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching year adjustments:', error);
    return [];
  }
}