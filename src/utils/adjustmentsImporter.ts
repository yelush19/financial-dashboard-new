// src/utils/adjustmentsImporter.ts
// ייבוא התאמות מקובץ CSV

import Papa from 'papaparse';
import { supabase } from '../lib/supabaseClient';

interface AdjustmentCSVRow {
  'כרטיס הוצאה': string;
  'קוד מיון': string;
  'תקופה': string;
  'נרשם ב': string;
  'ספק': string;
  'סכום הוצאה נטו': string;
}

interface ParsedAdjustment {
  sortCode: number;
  month: number;
  year: number;
  amount: number;
}

// מיפוי חודשים עבריים למספרים
const MONTH_MAP: { [key: string]: number } = {
  'ינו': 1, 'ינואר': 1,
  'פבר': 2, 'פברואר': 2,
  'מרץ': 3,
  'אפר': 4, 'אפריל': 4,
  'מאי': 5,
  'יונ': 6, 'יוני': 6,
  'יול': 7, 'יולי': 7,
  'אוג': 8, 'אוגוסט': 8,
  'ספט': 9, 'ספטמבר': 9,
  'אוק': 10, 'אוקטובר': 10,
  'נוב': 11, 'נובמבר': 11,
  'דצמ': 12, 'דצמבר': 12
};

/**
 * המרת תאריך עברי לחודש ושנה
 * @param period - למשל: "נוב-24", "דצמ-24", "ינו-25"
 * @returns { month: number, year: number } או null אם לא תקין
 */
function parsePeriod(period: string): { month: number; year: number } | null {
  if (!period || period.trim() === '') return null;
  
  const parts = period.trim().split('-');
  if (parts.length !== 2) return null;
  
  const monthStr = parts[0];
  const yearStr = parts[1];
  
  const month = MONTH_MAP[monthStr];
  if (!month) return null;
  
  // המרת שנה: "24" → 2024, "25" → 2025
  const yearNum = parseInt(yearStr);
  const year = yearNum < 100 ? 2000 + yearNum : yearNum;
  
  return { month, year };
}

/**
 * ניקוי וניתוח סכום
 * @param amountStr - למשל: " ₪ -102,515.70 ", " ₪ 2,637.51 "
 * @returns number או null
 */
function parseAmount(amountStr: string): number | null {
  if (!amountStr || amountStr.trim() === '') return null;
  
  // הסרת ₪, רווחים, פסיקים
  const cleaned = amountStr
    .replace(/₪/g, '')
    .replace(/,/g, '')
    .replace(/\s/g, '')
    .trim();
  
  if (cleaned === '') return null;
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * ניתוח קובץ CSV והמרה לרשומות Supabase
 * @param csvText - תוכן הקובץ
 * @returns מערך של התאמות מנותחות
 */
export function parseAdjustmentsCSV(csvText: string): ParsedAdjustment[] {
  const results: ParsedAdjustment[] = [];
  
  const parsed = Papa.parse<AdjustmentCSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    encoding: 'UTF-8'
  });
  
  parsed.data.forEach((row, index) => {
    try {
      // דלג על שורות ריקות או סיכום
      const sortCodeStr = row['קוד מיון']?.trim();
      if (!sortCodeStr || sortCodeStr === '') return;
      
      const sortCode = parseInt(sortCodeStr);
      if (isNaN(sortCode)) return;
      
      // המרת תקופה
      const periodStr = row['תקופה']?.trim();
      const period = parsePeriod(periodStr);
      if (!period) {
        console.warn(`שורה ${index + 2}: תקופה לא תקינה: "${periodStr}"`);
        return;
      }
      
      // המרת סכום
      const amountStr = row['סכום הוצאה נטו'];
      const amount = parseAmount(amountStr);
      if (amount === null) {
        console.warn(`שורה ${index + 2}: סכום לא תקין: "${amountStr}"`);
        return;
      }
      
      results.push({
        sortCode,
        month: period.month,
        year: period.year,
        amount
      });
    } catch (error) {
      console.error(`שגיאה בניתוח שורה ${index + 2}:`, error);
    }
  });
  
  return results;
}

/**
 * צבירת התאמות לפי sort_code, year, month
 * @param adjustments - מערך התאמות
 * @returns מערך מצובר
 */
function aggregateAdjustments(adjustments: ParsedAdjustment[]): ParsedAdjustment[] {
  const map = new Map<string, ParsedAdjustment>();
  
  adjustments.forEach(adj => {
    const key = `${adj.sortCode}-${adj.year}-${adj.month}`;
    
    if (map.has(key)) {
      const existing = map.get(key)!;
      existing.amount += adj.amount;
    } else {
      map.set(key, { ...adj });
    }
  });
  
  return Array.from(map.values());
}

/**
 * העלאת התאמות ל-Supabase
 * @param adjustments - מערך התאמות מנותחות
 * @returns Promise עם תוצאות
 */
export async function uploadAdjustmentsToSupabase(
  adjustments: ParsedAdjustment[]
): Promise<{ success: boolean; count: number; errors: any[] }> {
  const errors: any[] = [];
  let successCount = 0;
  
  // צבירה - סכום כל ההתאמות לאותו קוד מיון/חודש/שנה
  const aggregated = aggregateAdjustments(adjustments);
  
  // העלאה ל-Supabase
  for (const adj of aggregated) {
    try {
      const { error } = await supabase
        .from('adjustments')
        .upsert({
          sort_code: adj.sortCode,
          year: adj.year,
          month: adj.month,
          adjustment_type: 'category_adjustment',
          amount: adj.amount
        }, {
          onConflict: 'sort_code,year,month,adjustment_type'
        });
      
      if (error) {
        console.error('Error uploading adjustment:', error);
        errors.push({ adjustment: adj, error });
      } else {
        successCount++;
      }
    } catch (err) {
      console.error('Exception uploading adjustment:', err);
      errors.push({ adjustment: adj, error: err });
    }
  }
  
  return {
    success: errors.length === 0,
    count: successCount,
    errors
  };
}

/**
 * טעינת קובץ CSV מ-public/ והעלאה ל-Supabase
 * @param filename - שם הקובץ (ברירת מחדל: AdjustmentsModi.csv)
 * @returns Promise עם תוצאות
 */
export async function importAdjustmentsFromPublic(
  filename: string = 'AdjustmentsModi.csv'
): Promise<{ success: boolean; count: number; errors: any[]; message: string }> {
  try {
    // טעינת הקובץ
    const response = await fetch(`/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    // ניתוח
    const adjustments = parseAdjustmentsCSV(csvText);
    
    if (adjustments.length === 0) {
      return {
        success: false,
        count: 0,
        errors: [],
        message: 'לא נמצאו התאמות תקינות בקובץ'
      };
    }
    
    // העלאה
    const result = await uploadAdjustmentsToSupabase(adjustments);
    
    return {
      ...result,
      message: result.success 
        ? `נטענו בהצלחה ${result.count} התאמות`
        : `נטענו ${result.count} התאמות עם ${result.errors.length} שגיאות`
    };
  } catch (error) {
    console.error('Error importing adjustments:', error);
    return {
      success: false,
      count: 0,
      errors: [error],
      message: `שגיאה בטעינת הקובץ: ${error}`
    };
  }
}
