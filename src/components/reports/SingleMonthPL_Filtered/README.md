# 🔍 דוח P&L חודש בודד - עם סינון תנועות מבטלות

## ✨ תכונות חדשות

### 🆕 סינון תנועות מבטלות (350 תנועות)
- כפתור Toggle "הצג/הסתר מבוטלות"
- זיהוי אוטומטי של זוגות מבטלים מחשבון 37999
- אזהרה כאשר תנועות מבוטלות מוצגות

### 📊 עמודת אחוזים
- % מהכנסות לכל קטגוריה
- תצוגה גם בשורות סיכום

## 📁 קבצים (10)
- index.tsx (700 שורות)
- cancelled_ids.ts (350 כותרות)
- CategoryRow.tsx (עם עמודת %)
- AccountRow.tsx, VendorRow.tsx, BiurModal.tsx
- StatsCards.tsx, types.ts, README.md

## 🚀 התקנה
1. פרסי ZIP ל: src/components/reports/
2. עדכן App.tsx: import from './components/reports/SingleMonthPL_Filtered'
3. Restart TS Server + רענן דפדפן

## 🎯 שימוש
- **כפתור Toggle**: 🔘/👁️ הצג/הסתר מבוטלות (350)
- **עמודת %**: מחושב אוטומטית מהכנסות
- **ייצוא CSV**: כולל סטטוס סינון בשם הקובץ

תהני! 🚀
