import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import BiurimTab from './BiurimTab';
import BalancesTab from './BalancesTab';
import ComparisonTab from './ComparisonTab';
import AnalyticsTab from './AnalyticsTab';
import AlertsSystem from './AlertsSystem';
import DataValidationModal from './DataValidationModal';

// ==========================================
// קבועים
// ==========================================
const RELEVANT_CODES = ['600', '800', '801', '802', '804', '805', '806', '811', '813', '990', '991'];

const SORT_CODE_NAMES: { [key: string]: string } = {
  '600': 'הכנסות',
  '800': 'עלות המכר',
  '801': 'הוצאות מכירות',
  '802': 'הוצאות משרדיות והנהלה',
  '804': 'הוצאות שיווק סופרפארם',
  '805': 'הוצאות שיווק ופרסום',
  '806': 'הוצאות לוגיסטיקה',
  '811': 'הוצאות שכר ונלוות',
  '813': 'עמלות סליקה',
  '990': 'עמלות בנק',
  '991': 'ריבית החזר הלוואה',
};

// ==========================================
// ממשקים
// ==========================================
interface Transaction {
  title: string;
  movement: number;
  valueDate: string;
  details: string;
  accountKey: number;
  accountName: string;
  sortCode: number;
  sortCodeName: string;
  counterAccountName: string;
  amount: number;
  month: number;
}

interface TrialBalanceRecord {
  accountKey: number;
  accountName: string;
  sortCode: number;
  sortCodeName: string;
  months: { [month: number]: number };
}

interface CodeGroup {
  code: string;
  name: string;
  accounts: {
    accountKey: number;
    accountName: string;
    transactions: Transaction[];
    total: number;
  }[];
  total?: number;
}

interface RejectedSample {
  rowNumber: number;
  reason: string;
  accountKey?: number;
  accountName?: string;
  date?: string;
}

interface ValidationResult {
  totalRowsInFile: number;
  totalLoaded: number;
  totalRejected: number;
  rejectedNoMonth: number;
  rejectedNoAccount: number;
  rejectedWrongCode: number;
  canceledTransactions: number;
  expectedSum: number;
  actualSum: number;
  rejectedSamples: RejectedSample[];
  summaryBlock?: {
    found: boolean;
    startRow: number;
    expectedTransactions: number;
    expectedSum: number;
  };
  summaryValidation?: {
    summaryFound: boolean;
    expectedTransactions: number;
    actualTransactions: number;
    expectedSum: number;
    actualSum: number;
    transactionsMatch: boolean;
    sumMatch: boolean;
  };
}

// 🆕 ממשק לבדיקת עקביות
interface ComparisonResult {
  isMatch: boolean;
  biurimTotal: number;
  balanceTotal: number;
  totalDiff: number;
  codeIssues: Array<{
    code: string;
    name: string;
    diff: number;
    biurimTotal: number;
    balanceTotal: number;
    severity: 'high' | 'medium' | 'low';
  }>;
}

// ==========================================
// קומפוננטה ראשית
// ==========================================
const BiurimSystem: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'biurim' | 'balances' | 'comparison' | 'analytics' | 'alerts'>('biurim');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  
  // 🆕 State לבדיקת עקביות
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [showConsistencyDetails, setShowConsistencyDetails] = useState(false);

  // ==========================================
  // 🔧 פונקציית עיצוב מטבע - מעודכנת להצגת סוגריים
  // ==========================================
  const formatCurrency = (amount: number): string => {
    const formatted = new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
    
    // אם המספר שלילי, הצג בסוגריים
    return amount < 0 ? `(${formatted})` : formatted;
  };

  // ==========================================
  // טעינת נתונים
  // ==========================================
  useEffect(() => {
    const loadData = async () => {
      await loadTransactions();
      await loadTrialBalance();
    };
    loadData();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await fetch('/TransactionMonthlyModi.csv');
      const text = await response.text();

      console.log('📦 מתחיל לטעון קובץ TransactionMonthlyModi.csv...');

      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const allRows = results.data as any[];
          console.log('📊 סה"כ שורות בקובץ:', allRows.length);

          // ==========================================
          // זיהוי בלוק סיכום - מותאם למבנה האמיתי
          // ==========================================
          let summaryBlock = {
            found: false,
            startRow: -1,
            expectedTransactions: 0,
            expectedSum: 0
          };

          const summaryStartIndex = allRows.findIndex(row => {
            const title = (row['כותרת'] || '').toString();
            return title.includes('סה"כ לדו"ח') || title.includes('סה״כ לדו״ח');
          });

          if (summaryStartIndex > 0) {
            // מחלצים את הסכום מהשורה הבאה
            if (summaryStartIndex + 1 < allRows.length) {
              const sumRow = allRows[summaryStartIndex + 1];
              const sumStr = (sumRow['חובה / זכות (שקל)'] || '').toString();
              const cleanSum = sumStr.replace(/,/g, '');
              summaryBlock.expectedSum = parseFloat(cleanSum) || 0;
            }

            // מחלצים את מספר התנועות מהשורה השלישית
            if (summaryStartIndex + 2 < allRows.length) {
              const countRow = allRows[summaryStartIndex + 2];
              const countTitle = (countRow['כותרת'] || '').toString();
              const match = countTitle.match(/(\d+)/);
              if (match) {
                summaryBlock.expectedTransactions = parseInt(match[1]);
              }
            }

            summaryBlock.found = true;
            summaryBlock.startRow = summaryStartIndex;

            console.log('📊 נמצא בלוק סיכום:');
            console.log(`   שורת התחלה: ${summaryStartIndex + 1}`);
            console.log(`   תנועות צפויות: ${summaryBlock.expectedTransactions}`);
            console.log(`   סכום צפוי: ${formatCurrency(summaryBlock.expectedSum)}`);
          }

          // מעקב אחר דחיות
          const validation: ValidationResult = {
            totalRowsInFile: allRows.length,
            totalLoaded: 0,
            totalRejected: 0,
            rejectedNoMonth: 0,
            rejectedNoAccount: 0,
            rejectedWrongCode: 0,
            canceledTransactions: 0,
            expectedSum: summaryBlock.expectedSum,
            actualSum: 0,
            rejectedSamples: []
          };

          // ==========================================
          // סינון שורות - כולל שורות סיכום
          // ==========================================
          const dataRowsEnd = summaryBlock.found ? summaryBlock.startRow : allRows.length;
          const dataRows = allRows.slice(0, dataRowsEnd);
          
          console.log(`📊 שורות נתונים לעיבוד: ${dataRows.length} (ללא ${allRows.length - dataRows.length} שורות סיכום)`);
          
          validation.totalRejected = allRows.length - dataRows.length; // שורות הסיכום

          const accountToSortCodeMap = new Map<number, {code: number, name: string}>();

          const parsed = dataRows
            .map((row: any, index: number) => {
              // ✅ תיקון קריטי: שימוש ב-ת.אסמכ (תאריך אסמכתא) ולא ת.ערך!
              const dateStr = row['ת.אסמכ'] || '';
              const parts = dateStr.split('/');
              const month = parts.length >= 2 ? parseInt(parts[1]) : 0;

              // בדיקת חודש
              if (!month || month < 1 || month > 12) {
                validation.rejectedNoMonth++;
                validation.totalRejected++;
                if (validation.rejectedSamples.length < 10) {
                  validation.rejectedSamples.push({
                    rowNumber: index + 1,
                    reason: 'חסר חודש תקין',
                    date: dateStr
                  });
                }
                return null;
              }

              const accountKey = parseInt(row['מפתח חשבון'] || '0');
              if (!accountKey || accountKey === 0) {
                validation.rejectedNoAccount++;
                validation.totalRejected++;
                if (validation.rejectedSamples.length < 10) {
                  validation.rejectedSamples.push({
                    rowNumber: index + 1,
                    reason: 'חסר מפתח חשבון',
                    accountKey: accountKey
                  });
                }
                return null;
              }

              const sortCode = parseInt(row['קוד מיון'] || '0');
              const sortCodeStr = sortCode.toString();
              
              if (!RELEVANT_CODES.includes(sortCodeStr)) {
                validation.rejectedWrongCode++;
                validation.totalRejected++;
                return null;
              }

              // תיקון: amount צריך לבוא מעמודת "חובה / זכות (שקל)" ולא מ"תנועה"!
              const amount = parseFloat((row['חובה / זכות (שקל)'] || '0').toString().replace(/,/g, ''));
              const movementNumber = parseFloat(row['תנועה'] || '0'); // מספר תנועה סידורי

              // מיפוי sortCode
              if (accountKey && sortCode) {
                accountToSortCodeMap.set(accountKey, {
                  code: sortCode,
                  name: row['שם קוד מיון'] || SORT_CODE_NAMES[sortCodeStr] || `קוד ${sortCode}`
                });
              }

              return {
                title: row['כותרת'] || '',
                movement: movementNumber,  // מספר תנועה סידורי
                valueDate: row['ת.אסמכ'] || '',  // ✅ תאריך אסמכתא
                details: row['פרטים'] || '',
                accountKey,
                accountName: row['שם חשבון'] || '',
                sortCode,
                sortCodeName: row['שם קוד מיון'] || SORT_CODE_NAMES[sortCodeStr] || '',
                counterAccountName: row['שם חשבון נגדי'] || '',
                amount,  // הסכום האמיתי מעמודת חובה/זכות
                month
              } as Transaction;
            })
            .filter((item): item is Transaction => item !== null);

          // ==========================================
          // חישוב וסיכום ASIS
          // ==========================================
          validation.totalLoaded = parsed.length;
          validation.actualSum = parsed.reduce((sum, tx) => sum + tx.amount, 0);
          validation.summaryBlock = summaryBlock;
          
          // אימות מול נתוני הסיכום
          if (summaryBlock.found) {
            validation.summaryValidation = {
              summaryFound: true,
              expectedTransactions: summaryBlock.expectedTransactions,
              actualTransactions: parsed.length,
              expectedSum: summaryBlock.expectedSum,
              actualSum: validation.actualSum,
              transactionsMatch: Math.abs(summaryBlock.expectedTransactions - parsed.length) <= 3,
              sumMatch: Math.abs(summaryBlock.expectedSum - validation.actualSum) < 10
            };

            console.log('📊 אימות מול שורות סיכום:');
            console.log(`   תנועות: צפוי ${summaryBlock.expectedTransactions}, בפועל ${parsed.length}`);
            console.log(`   סכום: צפוי ${formatCurrency(summaryBlock.expectedSum)}, בפועל ${formatCurrency(validation.actualSum)}`);
            console.log(`   תוצאה: ${validation.summaryValidation.transactionsMatch && validation.summaryValidation.sumMatch ? '✅ תקין' : '❌ לא תואם'}`);
          }

          console.log('✅ טעינת תנועות הושלמה:', parsed.length);
          
          setTransactions(parsed);
          setValidationResult(validation);
          setShowValidationModal(true);

          // שמירת מיפוי במשתנה גלובלי זמני
          (window as any).__accountToSortCodeMap = accountToSortCodeMap;
          
          setLoading(false);
        },
      });
    } catch (error) {
      console.error('שגיאה בטעינת תנועות:', error);
      setLoading(false);
    }
  };

const loadTrialBalance = async () => {
    try {
      const response = await fetch('/BalanceMonthlyModi.csv');
      const text = await response.text();

      console.log('📦 מתחיל לטעון מאזן בוחן...');

      Papa.parse(text, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as any[][];
          
          const validRows: TrialBalanceRecord[] = [];
          let currentSortCode = 0;
          let currentSortCodeName = '';

          rows.forEach((row, index) => {
            if (index === 0) return;
            
            const colA = (row[0] || '').toString().trim();
            const colB = (row[1] || '').toString().trim();
            const colC = (row[2] || '').toString().trim();
            
            // זיהוי שורת כותרת של קוד מיון
            if (colA === 'קוד מיון' || colA === 'קוד מיון ') {
              currentSortCode = parseInt(colB) || 0;
              currentSortCodeName = colC || '';
              console.log(`📂 קוד מיון: ${currentSortCode} - ${currentSortCodeName}`);
              return;
            }
            
            // דילוג על שורות סיכום
            if (colA.includes('סה"כ') || colA.includes('סה״כ')) return;
            
            // סינון קודי מיון מאזניים (קטנים מ-600)
            if (currentSortCode < 600) return;
            
            const accountKey = parseInt(row[4] || '0');
            if (!accountKey || accountKey === 0) return;

            const accountName = row[5] || '';

            const parseAmount = (val: any): number => {
              if (!val) return 0;
              const str = val.toString().replace(/,/g, '');
              const num = parseFloat(str);
              return isNaN(num) ? 0 : num;
            };

            validRows.push({
              accountKey: accountKey,
              accountName: accountName,
              sortCode: currentSortCode,
              sortCodeName: currentSortCodeName,
              months: {
                1: parseAmount(row[7]),
                2: parseAmount(row[8]),
                3: parseAmount(row[9]),
                4: parseAmount(row[10]),
                5: parseAmount(row[11]),
                6: parseAmount(row[12]),
                7: parseAmount(row[13]),
                8: parseAmount(row[14]),
                9: parseAmount(row[15]),
                10: parseAmount(row[16]),
                11: parseAmount(row[17]),
                12: parseAmount(row[18])
              }
            });
          });

          console.log('✅ טעינת מאזן בוחן הושלמה:', validRows.length, 'חשבונות (קוד >= 600)');
          setTrialBalance(validRows);
        },
      });
    } catch (error) {
      console.error('שגיאה בטעינת מאזן בוחן:', error);
    }
  };
  
  // ==========================================
  // סינון תנועות מבטלות (קיים)
  // ==========================================
  const filteredTransactions = useMemo(() => {
    const groups = new Map<string, { transactions: Transaction[], sum: number }>();

    transactions.forEach(tx => {
      const weekKey = `${tx.accountKey}_${tx.sortCode}_${Math.floor(tx.movement / 7)}`;
      
      if (!groups.has(weekKey)) {
        groups.set(weekKey, { transactions: [], sum: 0 });
      }

      const group = groups.get(weekKey)!;
      group.transactions.push(tx);
      group.sum += tx.amount;
    });

    let canceledCount = 0;
    const finalFiltered: Transaction[] = [];

    groups.forEach(group => {
      if (Math.abs(group.sum) < 1) {
        canceledCount += group.transactions.length;
      } else {
        finalFiltered.push(...group.transactions);
      }
    });

    console.log(`🔄 סינון תנועות מבטלות: ${canceledCount} תנועות הוסרו`);
    return finalFiltered;
  }, [transactions]);

  // ==========================================
  // חישוב חודשים פעילים
  // ==========================================
  const activeMonths = useMemo(() => {
    const months = new Set<number>();
    filteredTransactions.forEach(tx => {
      if (tx.month >= 1 && tx.month <= 12) {
        months.add(tx.month);
      }
    });
    return Array.from(months).sort((a, b) => a - b);
  }, [filteredTransactions]);

  // ==========================================
  // קיבוץ נתונים לפי קוד מיון
  // ==========================================
  const dataByCode = useMemo(() => {
    const codeMap = new Map<string, CodeGroup>();

    RELEVANT_CODES.forEach(code => {
      codeMap.set(code, {
        code,
        name: SORT_CODE_NAMES[code] || `קוד ${code}`,
        accounts: [],
        total: 0
      });
    });

    const accountMap = new Map<string, {
      accountKey: number;
      accountName: string;
      transactions: Transaction[];
      total: number;
    }>();

    filteredTransactions.forEach(tx => {
      const sortCodeStr = tx.sortCode.toString();
      if (!RELEVANT_CODES.includes(sortCodeStr)) return;

      const key = `${sortCodeStr}_${tx.accountKey}`;
      
      if (!accountMap.has(key)) {
        accountMap.set(key, {
          accountKey: tx.accountKey,
          accountName: tx.accountName,
          transactions: [],
          total: 0
        });
      }

      const account = accountMap.get(key)!;
      account.transactions.push(tx);
      account.total += tx.amount;
    });

    accountMap.forEach((account, key) => {
      const [sortCodeStr] = key.split('_');
      const codeGroup = codeMap.get(sortCodeStr)!;
      codeGroup.accounts.push(account);
      codeGroup.total = (codeGroup.total || 0) + account.total;
    });

    return Array.from(codeMap.values());
  }, [filteredTransactions]);

  // ==========================================
  // 🆕 בדיקת עקביות - חישוב השוואה
  // ==========================================
  const consistencyCheck = useMemo((): ComparisonResult => {
    // 1. סכום מביאורים (מהתנועות)
    const biurimTotal = dataByCode.reduce((sum, code) => {
      const codeTotal = code.accounts.reduce((s, acc) => s + acc.total, 0);
      return sum + codeTotal;
    }, 0);

    // 2. סכום ממאזן בוחן
    const balanceTotal = trialBalance.reduce((sum, tb) => {
      const tbTotal = activeMonths.reduce((s, month) => s + (tb.months[month] || 0), 0);
      return sum + tbTotal;
    }, 0);

    // 3. חישוב הפרש
    const totalDiff = Math.abs(biurimTotal - balanceTotal);
    const isMatch = totalDiff <= 5; // סף 5 ₪

    // 4. זיהוי בעיות לפי קוד מיון
    const codeIssues: Array<any> = [];
    
    dataByCode.forEach(code => {
      const biurimCodeTotal = code.accounts.reduce((s, acc) => s + acc.total, 0);
      
      const balanceCodeTotal = trialBalance
        .filter(tb => tb.sortCode.toString() === code.code)
        .reduce((sum, tb) => {
          return sum + activeMonths.reduce((s, m) => s + (tb.months[m] || 0), 0);
        }, 0);
      
      const diff = Math.abs(biurimCodeTotal - balanceCodeTotal);
      
      if (diff > 5) {
        codeIssues.push({
          code: code.code,
          name: code.name,
          diff: diff,
          biurimTotal: biurimCodeTotal,
          balanceTotal: balanceCodeTotal,
          severity: diff > 1000 ? 'high' : diff > 100 ? 'medium' : 'low'
        });
      }
    });

    return {
      isMatch,
      biurimTotal,
      balanceTotal,
      totalDiff,
      codeIssues
    };
  }, [dataByCode, trialBalance, activeMonths]);

  // שמירה ב-state
  useEffect(() => {
    if (consistencyCheck) {
      setComparisonResult(consistencyCheck);
    }
  }, [consistencyCheck]);

  // ==========================================
  // Loading Screen
  // ==========================================
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '24px',
        color: '#6b7280'
      }}>
        טוען נתונים...
      </div>
    );
  }

  // ==========================================
  // Render
  // ==========================================
  return (
    <div style={{ direction: 'rtl', padding: '1.5rem' }}>
      <h1 style={{ 
        fontSize: '32px', 
        fontWeight: 'bold', 
        marginBottom: '2rem',
        color: '#1f2937'
      }}>
        📊 מערכת ניהול ביאורים - דו"ח כספי
      </h1>

      {/* טאבים */}
      <div style={{
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '2rem',
        display: 'flex',
        gap: '1rem'
      }}>
        <button
          onClick={() => setActiveTab('biurim')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: '600',
            fontSize: '14px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderBottom: activeTab === 'biurim' ? '2px solid #10b981' : '2px solid transparent',
            color: activeTab === 'biurim' ? '#10b981' : '#6b7280',
            transition: 'all 0.2s'
          }}
        >
          📊 ביאורים לפי קוד מיון
        </button>
        <button
          onClick={() => setActiveTab('balances')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: '600',
            fontSize: '14px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderBottom: activeTab === 'balances' ? '2px solid #10b981' : '2px solid transparent',
            color: activeTab === 'balances' ? '#10b981' : '#6b7280',
            transition: 'all 0.2s'
          }}
        >
          💰 יתרות מאזניות
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: '600',
            fontSize: '14px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderBottom: activeTab === 'comparison' ? '2px solid #10b981' : '2px solid transparent',
            color: activeTab === 'comparison' ? '#10b981' : '#6b7280',
            transition: 'all 0.2s'
          }}
        >
          🔍 השוואה למאזן בוחן
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: '600',
            fontSize: '14px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderBottom: activeTab === 'analytics' ? '2px solid #10b981' : '2px solid transparent',
            color: activeTab === 'analytics' ? '#10b981' : '#6b7280',
            transition: 'all 0.2s'
          }}
        >
          📈 ניתוח גרפי
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          style={{
            padding: '0.75rem 1.5rem',
            fontWeight: '600',
            fontSize: '14px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderBottom: activeTab === 'alerts' ? '2px solid #10b981' : '2px solid transparent',
            color: activeTab === 'alerts' ? '#10b981' : '#6b7280',
            transition: 'all 0.2s'
          }}
        >
          ⚠️ אזהרות ובקרות
        </button>
      </div>

      {/* 🆕 כרטיס בדיקת עקביות */}
      {comparisonResult && (
        <div 
          style={{
            background: comparisonResult.isMatch ? '#f0fdf4' : '#fef2f2',
            border: `2px solid ${comparisonResult.isMatch ? '#10b981' : '#dc2626'}`,
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => {
            if (!comparisonResult.isMatch) {
              setShowConsistencyDetails(!showConsistencyDetails);
            }
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {comparisonResult.isMatch ? '✅' : '❌'} בדיקת עקביות נתונים
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                הפרש: {formatCurrency(comparisonResult.totalDiff)}
              </div>
            </div>
            {!comparisonResult.isMatch && (
              <div style={{ 
                background: '#dc2626',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {comparisonResult.codeIssues.length} בעיות
              </div>
            )}
          </div>

          {/* פירוט בעיות - נפתח בלחיצה */}
          {showConsistencyDetails && !comparisonResult.isMatch && (
            <div style={{ 
              marginTop: '1rem', 
              paddingTop: '1rem', 
              borderTop: '1px solid #fca5a5' 
            }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                📊 קודי מיון בעייתיים:
              </div>
              {comparisonResult.codeIssues.map(issue => (
                <div 
                  key={issue.code}
                  style={{ 
                    padding: '0.5rem',
                    background: 'white',
                    borderRadius: '6px',
                    marginBottom: '0.5rem',
                    fontSize: '13px'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>
                    קוד {issue.code} - {issue.name}
                  </div>
                  <div style={{ color: '#6b7280' }}>
                    הפרש: {formatCurrency(issue.diff)} | 
                    ביאורים: {formatCurrency(issue.biurimTotal)} | 
                    מאזן: {formatCurrency(issue.balanceTotal)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* תוכן הטאב */}
      {activeTab === 'biurim' && (
        <BiurimTab
          dataByCode={dataByCode}
          formatCurrency={formatCurrency}
        />
      )}
      {activeTab === 'balances' && (
        <BalancesTab
          trialBalance={trialBalance}
          activeMonths={activeMonths}
          formatCurrency={formatCurrency}
        />
      )}
      {activeTab === 'comparison' && (
        <ComparisonTab
          transactions={filteredTransactions}
          trialBalance={trialBalance}
          activeMonths={activeMonths}
          formatCurrency={formatCurrency}
        />
      )}
      {activeTab === 'analytics' && (
        <AnalyticsTab
          dataByCode={dataByCode}
          transactions={filteredTransactions}
          formatCurrency={formatCurrency}
        />
      )}
      {activeTab === 'alerts' && (
        <AlertsSystem
          transactions={filteredTransactions}
          trialBalance={trialBalance}
          formatCurrency={formatCurrency}
        />
      )}

      {/* DataValidationModal */}
      {validationResult && (
        <DataValidationModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          result={validationResult}
        />
      )}
    </div>
  );
};

export default BiurimSystem;