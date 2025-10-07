// src/utils/exporters.ts
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { Transaction } from '../types';

/**
 * מייצא נתונים לקובץ Excel
 * @param data הנתונים לייצוא
 * @param filename שם הקובץ (כולל סיומת .xlsx)
 */
export const exportToExcel = (data: any[], filename: string) => {
  // וודא שיש סיומת נכונה לקובץ
  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  
  // התאמה לעברית - כיוון RTL לגיליון
  if(!ws['!cols']) ws['!cols'] = [];
  ws['!cols'].forEach(() => {
    if (!ws['!cols']) ws['!cols'] = [];
    ws['!cols'].push({ style: { alignment: { horizontal: 'right' } } });
  });
  
  XLSX.writeFile(wb, safeFilename);
};

/**
 * מייצא נתונים לקובץ CSV
 * @param data הנתונים לייצוא
 * @param filename שם הקובץ (כולל סיומת .csv)
 */
export const exportToCSV = (data: any[], filename: string) => {
  // וודא שיש סיומת נכונה לקובץ
  const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  
  const csv = Papa.unparse(data, {
    quotes: true,
    delimiter: ",",
    header: true
  });
  
  // הוספת BOM לתמיכה בעברית ב-Excel
  const bomPrefix = '\uFEFF';
  const csvContent = bomPrefix + csv;
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, safeFilename);
};

/**
 * מייצא נתונים לפי סוג הקובץ
 * @param data הנתונים לייצוא
 * @param filename שם הקובץ
 * @param type סוג הקובץ ('csv' או 'excel')
 */
export const exportData = (data: any[], filename: string, type: 'csv' | 'excel' = 'excel') => {
  if (!data || data.length === 0) {
    console.warn('אין נתונים לייצוא');
    return;
  }
  
  try {
    if (type === 'csv') {
      exportToCSV(data, filename);
    } else {
      exportToExcel(data, filename);
    }
  } catch (error) {
    console.error('שגיאה בייצוא קובץ:', error);
    alert('אירעה שגיאה בייצוא הקובץ');
  }
};