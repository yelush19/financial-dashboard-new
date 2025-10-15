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
    loadTransactions();
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
          // 🆕 זיהוי בלוק סיכום - מותאם למבנה האמיתי
          // ==========================================
          let summaryBlock = {
            found: false,
            startRow: -1,
            expectedTransactions: 0,
            expectedSum: 0
          };

          // מחפשים את שורת "סה"כ לדו"ח"
          const summaryStartIndex = allRows.findIndex(row => {
            const title = (row['כותרת'] || '').toString();
            return title.includes('סה"כ לדו"ח') || title.includes('סה״כ לדו״ח');
          });

          if (summaryStartIndex > 0) {
            // שורה 17407: "סה"כ לדו"ח"
            // שורה 17408: הסכום (-70,211.65)
            // שורה 17409: "מספר תנועות בדו"ח 17406"
            
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
          // 🆕 סינון שורות - כולל שורות סיכום
          // ==========================================
          const dataRowsEnd = summaryBlock.found ? summaryBlock.startRow : allRows.length;
          const dataRows = allRows.slice(0, dataRowsEnd);
          
          console.log(`📊 שורות נתונים לעיבוד: ${dataRows.length} (ללא ${allRows.length - dataRows.length} שורות סיכום)`);
          
          validation.totalRejected = allRows.length - dataRows.length; // שורות הסיכום

          const parsed = dataRows
            .map((row: any, index: number) => {
              // תיקון: שימוש רק בת.ערך (לא בתאריך 3)
              const dateStr = row['ת.ערך'] || '';
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

              // 🔴 תיקון: amount צריך לבוא מעמודת "חובה / זכות (שקל)" ולא מ"תנועה"!
              const amount = parseFloat((row['חובה / זכות (שקל)'] || '0').toString().replace(/,/g, ''));
              const movementNumber = parseFloat(row['תנועה'] || '0'); // מספר תנועה סידורי

              return {
                title: row['כותרת'] || '',
                movement: movementNumber,  // מספר תנועה סידורי
                valueDate: row['ת.ערך'] || '',
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
          // 🆕 חישוב וסיכום ASIS
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
          
          console.log('🔍 לפני קריאה ל-loadTrialBalanceWithMapping - parsed.length:', parsed.length);
          console.log('🔍 דוגמה לתנועה:', parsed[0]);
          
          setTransactions(parsed);
          setValidationResult(validation);
          setShowValidationModal(true);
          
          // 🆕 טען מאזן בוחן עם המיפוי מהתנועות
          loadTrialBalanceWithMapping(parsed);
          setLoading(false);
        },
      });
    } catch (error) {
      console.error('שגיאה בטעינת תנועות:', error);
      setLoading(false);
    }
  };

  const loadTrialBalanceWithMapping = async (transactionsData: Transaction[]) => {
    try {
      const response = await fetch('/BalanceMonthlyModi.csv');
      const text = await response.text();

      Papa.parse(text, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = (results.data as any[]).slice(1);

          // 🆕 יצירת מיפוי sortCode מהתנועות (מה-state הנוכחי)
          const accountToSortCode = new Map<number, { code: number, name: string }>();
         transactionsData.forEach(tx => {
            if (!accountToSortCode.has(tx.accountKey)) {
              accountToSortCode.set(tx.accountKey, {
                code: tx.sortCode,
                name: tx.sortCodeName
              });
            }
          });

          console.log('🗺️ מיפוי sortCode נוצר:', accountToSortCode.size, 'חשבונות');

          const validRows: TrialBalanceRecord[] = [];
          
          rows.forEach((row: any) => {
            const accountKey = parseInt(row[4] || '0');
            const accountName = (row[5] || '').toString().trim();

            if (!accountKey || accountKey === 0 || !accountName) return;
            if (accountName.includes('סה"כ') || accountName.includes('סה״כ')) return;

            const parseAmount = (val: any): number => {
              if (!val || val === '') return 0;
              const cleaned = val.toString().replace(/,/g, '').trim();
              const num = parseFloat(cleaned);
              return isNaN(num) ? 0 : num;
            };

            // 🔍 לוג לבדיקה - חשבון 40000
            if (accountKey === 40000) {
              console.log('🔍 חשבון 40000 - שורה גולמית:', {
                accountKey: row[4],
                accountName: row[5],
                opening: row[6],
                jan: row[7],
                feb: row[8],
                mar: row[9],
                apr: row[10],
                may: row[11],
                jun: row[12],
                jul: row[13],
                aug: row[14]
              });
            }

            // 🆕 הוספת sortCode למאזן בוחן
            const sortCodeInfo = accountToSortCode.get(accountKey) || { code: 0, name: '' };

            validRows.push({
              accountKey: accountKey,
              accountName: accountName,
              sortCode: sortCodeInfo.code,
              sortCodeName: sortCodeInfo.name,
              months: {
                1: parseAmount(row[7]),   // ✅ ינואר
                2: parseAmount(row[8]),   // ✅ פברואר
                3: parseAmount(row[9]),   // ✅ מרץ
                4: parseAmount(row[10]),  // ✅ אפריל
                5: parseAmount(row[11]),  // ✅ מאי
                6: parseAmount(row[12]),  // ✅ יוני
                7: parseAmount(row[13]),  // ✅ יולי
                8: parseAmount(row[14]),  // ✅ אוגוסט
                9: parseAmount(row[15]),  // ✅ ספטמבר
                10: parseAmount(row[16]), // ✅ אוקטובר
                11: parseAmount(row[17]), // ✅ נובמבר
                12: parseAmount(row[18])  // ✅ דצמבר
              }
            });
          });

          console.log('✅ טעינת מאזן בוחן הושלמה:', validRows.length);
          
          // 🔍 לוג לבדיקה - הצג את חשבון 40000
          const account40000 = validRows.find(r => r.accountKey === 40000);
          if (account40000) {
            console.log('📊 חשבון 40000 (הכנסות):', {
              accountKey: account40000.accountKey,
              accountName: account40000.accountName,
              sortCode: account40000.sortCode,
              sortCodeName: account40000.sortCodeName,
              jan: account40000.months[1],
              feb: account40000.months[2],
              mar: account40000.months[3],
              apr: account40000.months[4],
              may: account40000.months[5],
              jun: account40000.months[6],
              jul: account40000.months[7],
              aug: account40000.months[8]
            });
          }
          
          setTrialBalance(validRows);
        },
      });
    } catch (error) {
      console.error('שגיאה בטעינת מאזן בוחן:', error);
    }
  };

  // ==========================================
  // סינון תנועות מבטלות
  // ==========================================
  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return [];

    const sorted = [...transactions].sort((a, b) => {
      if (a.accountKey !== b.accountKey) return a.accountKey - b.accountKey;
      const [dayA, monthA] = a.valueDate.split('/');
      const [dayB, monthB] = b.valueDate.split('/');
      const dateA = new Date(2024, parseInt(monthA) - 1, parseInt(dayA));
      const dateB = new Date(2024, parseInt(monthB) - 1, parseInt(dayB));
      return dateA.getTime() - dateB.getTime();
    });

    const getDaysFromStart = (dateStr: string) => {
      const [day, month] = dateStr.split('/');
      const date = new Date(2024, parseInt(month) - 1, parseInt(day));
      const start = new Date(2024, 0, 1);
      return Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    };

    const groups = new Map<string, { transactions: Transaction[], sum: number }>();
    
    sorted.forEach(tx => {
      const days = getDaysFromStart(tx.valueDate);
      const weekNum = Math.floor(days / 7);
      const key = `${tx.accountKey}_week${weekNum}`;
      
      if (!groups.has(key)) {
        groups.set(key, { transactions: [], sum: 0 });
      }
      
      const group = groups.get(key)!;
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
    <div className="container">
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

      {/* תוכן הטאב - תיקון כאן! */}
      <div className="tab-content">
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
      </div>

      {/* מודל אימות נתונים */}
      {showValidationModal && validationResult && (
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