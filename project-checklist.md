# LITAY Finance - Project Refactoring Checklist

## 📅 תאריך התחלה: 27/05/2025

- [x] יצירת src/components/ui
- [x] יצירת src/components/financial
- [ ] יצירת src/components/layout
- [ ] יצירת src/components/shared
- [ ] יצירת src/styles/base
- [ ] יצירת src/styles/components
- [ ] יצירת src/styles/themes
- [ ] יצירת src/hooks
- [ ] יצירת src/utils
- [ ] יצירת src/types
- [ ] יצירת src/constants

## 🔄 קומפוננטות קיימות למיקום מחדש
- [ ] HierarchicalReport.tsx → src/components/financial/
- [ ] PivotReportWithPopup.tsx → src/components/financial/
- [ ] QuarterlyReport.tsx → src/components/financial/
- [ ] RawData.tsx → src/components/financial/

- [x] יצירת תיקיית HierarchicalReport
- [x] חילוץ SectionAccordion.tsx
- [x] חילוץ CategoryAccordion.tsx
- [x] חילוץ AccountRow.tsx
- [x] חילוץ AccountDetails.tsx
- [x] חילוץ MonthlyBreakdown.tsx (משולב ב-AccountRow)
- [x] חילוץ SummaryCard.tsx
- [x] חילוץ Toolbar.tsx (נוסף)
- [x] יצירת types.ts
- [x] יצירת utils.ts
- [x] יצירת index.tsx (נוסף)
- [x] עדכון App.tsx (נוסף)

## 🔧 שלב 3: פיצול PivotReport
-- [ ] יצירת תיקיית PivotReport
- [ ] חילוץ PivotTable.tsx
- [ ] חילוץ PivotControls.tsx
- [ ] חילוץ FilterMenu.tsx
- [ ] חילוץ DataRow.tsx
- [ ] חילוץ TotalsRow.tsx

## 📚 מסמכים קשורים
- [מפת דרכים](./ROADMAP.md)
- [ארכיטקטורה](./docs/ARCHITECTURE.md)

## 📝 הערות:
- תיקיית OLD-GOOD-CHECK שמורה לרפרנס
- כל הקומפוננטות הקיימות עובדות - רק צריך לארגן מחדש