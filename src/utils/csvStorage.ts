// src/utils/csvStorage.ts
// פונקציות לניהול אחסון קבצי CSV ב-localStorage

export async function saveCSVFile(
  fileName: 'transactions' | 'balance',
  content: string
): Promise<boolean> {
  try {
    const key = fileName === 'transactions' ? 'transactionsData' : 'balanceData';
    localStorage.setItem(key, content);
    localStorage.setItem(`${key}_timestamp`, new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Error saving CSV to localStorage:', error);
    return false;
  }
}

export async function loadCSVFile(
  fileName: 'transactions' | 'balance'
): Promise<string | null> {
  try {
    const key = fileName === 'transactions' ? 'transactionsData' : 'balanceData';
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Error loading CSV from localStorage:', error);
    return null;
  }
}
