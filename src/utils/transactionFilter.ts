// src/utils/transactionFilter.ts
// 🔥 סינון דינמי של תנועות מתאפסות - עובד עם כל קובץ!

import { Transaction } from '../types/reportTypes';

/**
 * מזהה ומסנן תנועות מתאפסות בתוך אותו חשבון+חודש
 * 
 * לוגיקה:
 * - קבוצה של 2-5 תנועות באותו חודש + קוד מיון + מפתח חשבון
 * - שמתאפסות עד 0.5 ש"ח
 * - לפחות אחת מהן מול חשבון נגדי 37999
 */
export function filterCancellingTransactions(transactions: Transaction[]): Transaction[] {
  console.log('🚀 filterCancellingTransactions called with', transactions.length, 'transactions');
  
  const cancelledKoterot = getCancelledKoterot(transactions);

  console.log(`🔥 סינון דינמי: נמצאו ${cancelledKoterot.size} תנועות מתאפסות`);
  
  // DEBUG: הצגת כמה קבוצות נמצאו
  console.log('🔍 DEBUG cancelledKoterot:', Array.from(cancelledKoterot).slice(0, 20));

  // סינון התנועות
  return transactions.filter(tx => !cancelledKoterot.has(tx.koteret));
}

/**
 * מחזיר Set של כותרות מבוטלות (לשימוש בקומפוננטות אחרות)
 */
export function getCancelledKoterot(transactions: Transaction[]): Set<number> {
  // שלב 1: קיבוץ לפי חודש + קוד מיון + מפתח חשבון
  const groups = new Map<string, Transaction[]>();
  
  transactions.forEach(tx => {
    if (!tx.date || !tx.date.includes('/')) return;
    
    const month = tx.date.split('/')[1];
    const key = `${month}_${tx.sortCode}_${tx.accountKey}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(tx);
  });

  // שלב 2: זיהוי כותרות לסינון
  const cancelledKoterot = new Set<number>();

  groups.forEach((txs, groupKey) => {
    if (txs.length < 2) return;
    
    // בדיקה אם יש תנועה מול 37999
    const has37999 = txs.some(tx => tx.counterAccountNumber === 37999);
    if (!has37999) return;

    // סימון תנועות שכבר נמצאו בקבוצה מתאפסת
    const usedKoterot = new Set<number>();

    // חיפוש קבוצות מתאפסות - מהקטנות לגדולות (2, 3, 4, 5)
    for (let size = 2; size <= Math.min(5, txs.length); size++) {
      const availableTxs = txs.filter(tx => !usedKoterot.has(tx.koteret));
      if (availableTxs.length < size) continue;

      // בדיקת כל הקומבינציות בגודל הנוכחי
      const combinations = getCombinations(availableTxs, size);
      
      for (const combo of combinations) {
        // בדיקה שאף תנועה לא כבר בשימוש
        if (combo.some(tx => usedKoterot.has(tx.koteret))) continue;
        
        // בדיקה שיש 37999 בקומבינציה
        if (!combo.some(tx => tx.counterAccountNumber === 37999)) continue;
        
        // בדיקה אם מתאפסת (עד 0.5 ש"ח - קשיח!)
        const total = combo.reduce((sum, tx) => sum + tx.amount, 0);
        if (Math.abs(total) <= 0.5) {
          // מצאנו קבוצה מתאפסת!
          combo.forEach(tx => {
            usedKoterot.add(tx.koteret);
            cancelledKoterot.add(tx.koteret);
          });
        }
      }
    }
  });

  return cancelledKoterot;
}

/**
 * פונקציית עזר ליצירת קומבינציות
 */
function getCombinations<T>(arr: T[], size: number): T[][] {
  if (size === 1) return arr.map(x => [x]);
  if (size === arr.length) return [arr];
  if (size > arr.length) return [];

  const result: T[][] = [];
  
  for (let i = 0; i <= arr.length - size; i++) {
    const head = arr[i];
    const tailCombinations = getCombinations(arr.slice(i + 1), size - 1);
    for (const tail of tailCombinations) {
      result.push([head, ...tail]);
    }
  }
  
  return result;
}

/**
 * חשבונות נגדיים טכניים שלא צריכים להופיע כספקים
 */
export const EXCLUDED_COUNTER_ACCOUNTS = new Set([
  37999,  // ספקים לשלם + לקבל חשבונית
]);

/**
 * סינון ספקים טכניים מתצוגה
 */
export function filterTechnicalSuppliers<T extends { counterAccountNumber?: number }>(
  items: T[]
): T[] {
  return items.filter(item => 
    !EXCLUDED_COUNTER_ACCOUNTS.has(item.counterAccountNumber || 0)
  );
}