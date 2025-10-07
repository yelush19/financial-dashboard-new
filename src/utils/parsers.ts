import Papa from 'papaparse';

// ממשק לשורה מה-CSV
export interface CSVRow {
  'כותרת': string;
  'תנועה': number;
  'מנה': number;
  'ס"ת': string;
  'ח-ן נגדי': number;
  'שם חשבון נגדי': string;
  'ת.אסמכ': string;
  'ת.ערך': string;
  'תאריך 3': string;
  'אסמ\'': number;
  'אסמ\'2': number;
  'פרטים': string;
  'תמחיר': string;
  'חובה / זכות (שקל)': string;
  'מפתח חשבון': number;
  'שם חשבון': string;
  'קוד מיון': number;
  'שם קוד מיון': string;
  'טקסט קבוע': string;
}

// ממשק לתנועה במערכת
export interface Transaction {
  id: string;
  date: string;
  account: string;
  accountName: string;
  categoryCode: string;
  amount: number;
  details: string;
}

// פונקציה להמרת סכום מטקסט למספר
function parseAmount(amountStr: string): number {
  if (!amountStr) return 0;
  
  // הסר פסיקים ורווחים
  const cleaned = amountStr.replace(/,/g, '').replace(/\s/g, '').trim();
  
  // המר למספר
  const num = parseFloat(cleaned);
  
  return isNaN(num) ? 0 : num;
}

// פונקציה להמרת תאריך לפורמט אחיד
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // נניח שהתאריך בפורמט DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return dateStr; // כבר בפורמט הנכון
  }
  
  return dateStr;
}

// פונקציה להמרת שורה מ-CSV לטרנזקציה
function csvRowToTransaction(row: CSVRow, index: number): Transaction {
  return {
    id: `tx_${index}_${Date.now()}`,
    date: formatDate(row['ת.ערך'] || row['תאריך 3'] || ''),
    account: String(row['מפתח חשבון'] || ''),
    accountName: row['שם חשבון'] || '',
    categoryCode: String(row['קוד מיון'] || ''),
    amount: parseAmount(row['חובה / זכות (שקל)'] || '0'),
    details: row['פרטים'] || ''
  };
}

// פונקציה לטעינת קובץ CSV מה-public
export async function loadTransactionsFromPublic(): Promise<Transaction[]> {
  try {
    const response = await fetch('/TRANSACTION.csv');
    const text = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        dynamicTyping: false, // נשמור הכל כ-string ונמיר ידנית
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('שגיאות בפענוח CSV:', results.errors);
          }
          
          const transactions = results.data
            .map((row: any, index: number) => csvRowToTransaction(row as CSVRow, index))
            .filter(tx => tx.date && tx.account && tx.categoryCode); // סנן רק תנועות תקינות
          
          console.log(`נטענו ${transactions.length} תנועות מתוך ${results.data.length} שורות`);
          resolve(transactions);
        },
        error: (error: any) => {
          console.error('שגיאה בפענוח CSV:', error);
          reject(error);
        }
      });
    });
  } catch (error: any) {
    console.error('שגיאה בטעינת קובץ CSV:', error);
    throw error;
  }
}

// פונקציה לפענוח קובץ CSV שהועלה
export async function parseCSVFile(file: File): Promise<Transaction[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('שגיאות בפענוח CSV:', results.errors);
        }
        
        const transactions = results.data
          .map((row: any, index: number) => csvRowToTransaction(row as CSVRow, index))
          .filter(tx => tx.date && tx.account && tx.categoryCode);
        
        console.log(`נטענו ${transactions.length} תנועות מתוך ${results.data.length} שורות`);
        resolve(transactions);
      },
      error: (error: any) => {
        console.error('שגיאה בפענוח CSV:', error);
        reject(error);
      }
    });
  });
}