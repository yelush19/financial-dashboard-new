// src/constants/icons.ts
// 🎯 אייקונים שחולצו מהקוד הקיים של HierarchicalReport.tsx

import {
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Package2,
  Building2,
  Landmark,
  Save,
  Edit3,
  BarChart3,
  type LucideIcon
} from 'lucide-react';

/**
 * 🎴 אייקוני כרטיסי סיכום
 */
export const CARD_ICONS = {
  revenue: TrendingUp,        // הכנסות
  expense: TrendingDown,      // הוצאות
  netProfit: '💰',            // רווח נקי (emoji)
  profitability: '%',         // אחוז רווחיות (character)
};

/**
 * 🏢 אייקוני קטגוריות עיקריות
 */
export const CATEGORY_ICONS = {
  revenue: TrendingUp,        // 600 - הכנסות
  cogs: Package2,             // 800 - עלות המכר
  operating: Building2,       // 801-811 - הוצאות תפעול
  financial: Landmark,        // 813, 990, 991 - הוצאות מימון
};

/**
 * ⚙️ אייקוני פעולות
 */
export const ACTION_ICONS = {
  expand: Plus,               // פתיחה
  collapse: Minus,            // סגירה
  edit: Edit3,                // עריכה
  save: Save,                 // שמירה
};

/**
 * 📊 אייקוני גרפים
 */
export const CHART_ICONS = {
  bar: BarChart3,             // גרף עמודות
  trend: TrendingUp,          // גרף מגמות
};

/**
 * 💰 אימוג'ים לשורות רווח
 */
export const PROFIT_EMOJIS = {
  gross: '💰',                // רווח גולמי
  operating: '💼',            // רווח תפעולי
  net: '💰💰',                // רווח נקי
};

/**
 * 🎯 פונקציה לקבלת אייקון לפי קוד מיון
 */
export const getIconByCode = (code: number | null): LucideIcon => {
  if (!code) return Building2;
  
  if (code === 600) return TrendingUp;      // הכנסות
  if (code === 800) return Package2;        // עלות המכר
  if ([801, 802, 804, 805, 806, 811].includes(code)) return Building2;  // הוצאות תפעול
  if ([813, 990, 991].includes(code)) return Landmark;  // הוצאות מימון
  
  return Building2; // ברירת מחדל
};

/**
 * 📦 ייצוא ברירת מחדל
 */
export default {
  CARD_ICONS,
  CATEGORY_ICONS,
  ACTION_ICONS,
  CHART_ICONS,
  PROFIT_EMOJIS,
  getIconByCode,
};