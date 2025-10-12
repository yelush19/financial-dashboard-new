import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Minus, Download, Upload, FileSpreadsheet, X, TrendingUp, TrendingDown, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

// ========== TYPES ==========
interface Transaction {
  id: string;
  sortCode: number | null;
  sortCodeName: string;
  accountKey: number;
  accountName: string;
  amount: number;
  details: string;
  date: string;
  counterAccountName: string;
  month: number;
  asmachta: string;
  asmachta2: string;
  isCanceling: boolean;
}

interface AccountBalance {
  accountKey: number;
  accountName: string;
  months: { [month: number]: number };
  total: number;
}

// ========== CONSTANTS ==========
const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

const SORT_CODE_NAMES: { [key: string]: string } = {
  '600': 'הכנסות',
  '800': 'עלות המכר',
  '801': 'הוצאות מכירה',
  '802': 'הוצאות משרדיות והנהלה',
  '804': 'שיווק סופרפארם',
  '805': 'שיווק ופרסום',
  '806': 'הוצאות לוגיסטיקה',
  '811': 'שכר ונלוות',
  '813': 'הוצאות סליקה',
  '990': 'עמלות בנקים',
  '991': 'ריבית הלוואות',
};

// ========== MAIN COMPONENT ==========
const BiurimSystem = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trialBalanceData, setTrialBalanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('biurim');
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [showCancelingTransactions, setShowCancelingTransactions] = useState(false);

  useEffect(() => {
    loadTransactions();
    loadTrialBalance();
  }, []);

  const loadTransactions = async () => {
    try {
      const response = await fetch('/TransactionMonthlyModi.csv');
      const text = await response.text();
      
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed = (results.data as any[])
            .map((row: any, index: number) => {
              const dateStr = row['תאריך 3'] || row['ת.ערך'] || '';
              const parts = dateStr.split('/');
              const month = parts.length >= 2 ? parseInt(parts[1]) : 0;
              const date = parts.length === 3 ? `${parts[0]}/${parts[1]}/${parts[2]}` : dateStr;

              return {
                id: `tx_${index}_${Date.now()}`,
                sortCode: row['קוד מיון'] ? parseInt(row['קוד מיון']) : null,
                sortCodeName: row['שם קוד מיון'] || '',
                accountKey: parseInt(row['מפתח חשבון']) || 0,
                accountName: row['שם חשבון'] || '',
                amount: parseFloat(row['חובה / זכות (שקל)']?.replace(/,/g, '') || '0'),
                details: row['פרטים'] || '',
                date: date,
                counterAccountName: row['שם חשבון נגדי'] || '',
                month: month,
                asmachta: row['אסמ\''] || '',
                asmachta2: row['אסמ\'2'] || '',
                isCanceling: false,
              };
            })
            .filter((tx: Transaction) => tx.accountKey !== 0 && tx.month > 0);
          
          setTransactions(parsed);
          setLoading(false);
        },
      });
    } catch (error) {
      console.error('שגיאה בטעינת נתונים:', error);
      setLoading(false);
    }
  };

  const loadTrialBalance = async () => {
    try {
      const response = await fetch('/BalanceMonthlyModi.csv');
      const text = await response.text();
      
      Papa.parse(text, {
        header: false,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          const rows = (results as any).data;
          
          const cleaned: any[] = [];
          let currentSortCode = '';
          let currentSortCodeName = '';
          let accountsCount = 0;
          let summariesCount = 0;

          rows.forEach((row: any[], index: number) => {
            if (index === 0) return;

            const colA = (row[0] || '').toString().trim();
            const colB = (row[1] || '').toString().trim();
            const colC = (row[2] || '').toString().trim();
            const colE = (row[4] || '').toString().trim();
            const colF = (row[5] || '').toString().trim();

            if (colA === 'קוד מיון' || colC.includes('קוד מיון')) return;
            if (colA.includes('*') || colB.includes('*') || colC.includes('*') || colF.includes('*')) return;

            if (colA === 'סה"כ קוד מיון' || colA === 'סה״כ קוד מיון') {
              summariesCount++;
              const nextRow = rows[index + 1];
              if (nextRow) {
                const parseNum = (val: any) => {
                  if (!val || val === '') return 0;
                  const num = parseFloat(val.toString().replace(/,/g, ''));
                  return isNaN(num) ? 0 : num;
                };

                const nextColB = (nextRow[1] || '').toString().trim();
                if (nextColB.includes('*') || currentSortCode.includes('*')) return;

                cleaned.push({
                  accountKey: 999900 + summariesCount,
                  accountName: `סה"כ ${currentSortCodeName || colB}`,
                  sortCode: colB || currentSortCode,
                  sortCodeName: currentSortCodeName,
                  type: 'summary',
                  'ינואר': parseNum(nextRow[6]),
                  'פברואר': parseNum(nextRow[7]),
                  'מרץ': parseNum(nextRow[8]),
                  'אפריל': parseNum(nextRow[9]),
                  'מאי': parseNum(nextRow[10]),
                  'יוני': parseNum(nextRow[11]),
                  'יולי': parseNum(nextRow[12]),
                  'אוגוסט': parseNum(nextRow[13]),
                  'ספטמבר': parseNum(nextRow[14]),
                  'אוקטובר': parseNum(nextRow[15]),
                  'נובמבר': parseNum(nextRow[16]),
                  'דצמבר': parseNum(nextRow[17]),
                  total: parseNum(nextRow[6]) + parseNum(nextRow[7]) + parseNum(nextRow[8]) +
                         parseNum(nextRow[9]) + parseNum(nextRow[10]) + parseNum(nextRow[11]) +
                         parseNum(nextRow[12]) + parseNum(nextRow[13]) + parseNum(nextRow[14]) +
                         parseNum(nextRow[15]) + parseNum(nextRow[16]) + parseNum(nextRow[17])
                });
              }
              return;
            }

            if (index > 0) {
              const prevRow = rows[index - 1];
              const prevA = (prevRow[0] || '').toString().trim();
              if (prevA === 'סה"כ קוד מיון' || prevA === 'סה״כ קוד מיון') return;
            }

            if (colA && colA !== '0' && !colE) {
              if (!colA.includes('*')) {
                currentSortCode = colA;
                if (colC) currentSortCodeName = colC;
              }
              return;
            }

            const accountKey = parseInt(colE);
            if (accountKey && accountKey > 0 && colF) {
              accountsCount++;
              
              const parseNum = (val: any) => {
                if (!val || val === '') return 0;
                const num = parseFloat(val.toString().replace(/,/g, ''));
                return isNaN(num) ? 0 : num;
              };

              const january = parseNum(row[6]);
              const february = parseNum(row[7]);
              const march = parseNum(row[8]);
              const april = parseNum(row[9]);
              const may = parseNum(row[10]);
              const june = parseNum(row[11]);
              const july = parseNum(row[12]);
              const august = parseNum(row[13]);
              const september = parseNum(row[14]);
              const october = parseNum(row[15]);
              const november = parseNum(row[16]);
              const december = parseNum(row[17]);

              cleaned.push({
                accountKey,
                accountName: colF,
                sortCode: currentSortCode,
                sortCodeName: currentSortCodeName,
                type: 'account',
                'ינואר': january,
                'פברואר': february,
                'מרץ': march,
                'אפריל': april,
                'מאי': may,
                'יוני': june,
                'יולי': july,
                'אוגוסט': august,
                'ספטמבר': september,
                'אוקטובר': october,
                'נובמבר': november,
                'דצמבר': december,
                total: january + february + march + april + may + june +
                       july + august + september + october + november + december
              });
            }
          });

          console.log('✅ מאזן בוחן נוקה:', accountsCount, 'חשבונות +', summariesCount, 'סיכומים');
          setTrialBalanceData(cleaned);
        },
      });
    } catch (error) {
      console.error('❌ שגיאה בטעינת מאזן בוחן:', error);
    }
  };

  const transactionsWithCanceling = useMemo((): Transaction[] => {
    if (!transactions.length) return [];

    const byAccount: { [key: number]: Transaction[] } = {};
    transactions.forEach(tx => {
      if (!byAccount[tx.accountKey]) byAccount[tx.accountKey] = [];
      byAccount[tx.accountKey].push(tx);
    });

    const cancelingIds = new Set<string>();

    Object.values(byAccount).forEach(accountTxs => {
      const sorted = [...accountTxs].sort((a, b) => {
        const dateA = new Date(a.date.split('/').reverse().join('-')).getTime();
        const dateB = new Date(b.date.split('/').reverse().join('-')).getTime();
        return dateA - dateB;
      });

      for (let i = 0; i < sorted.length; i++) {
        const tx1 = sorted[i];
        const date1 = new Date(tx1.date.split('/').reverse().join('-'));

        for (let j = i + 1; j < sorted.length; j++) {
          const tx2 = sorted[j];
          const date2 = new Date(tx2.date.split('/').reverse().join('-'));

          const daysDiff = Math.abs((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff > 7) break;

          const sum = tx1.amount + tx2.amount;
          if (Math.abs(sum) <= 1) {
            cancelingIds.add(tx1.id);
            cancelingIds.add(tx2.id);
          }
        }
      }
    });

    return transactions.map(tx => ({
      ...tx,
      isCanceling: cancelingIds.has(tx.id)
    }));
  }, [transactions]);

  const filteredTransactions = useMemo((): Transaction[] => {
    if (showCancelingTransactions) return transactionsWithCanceling;
    return transactionsWithCanceling.filter(tx => !tx.isCanceling);
  }, [transactionsWithCanceling, showCancelingTransactions]);

  const stats = useMemo(() => {
    const totalCount = transactionsWithCanceling.length;
    const cancelingCount = transactionsWithCanceling.filter(tx => tx.isCanceling).length;
    const visibleCount = filteredTransactions.length;
    
    const activeAccountKeys = new Set(filteredTransactions.map(tx => tx.accountKey));
    const activeMonthsSet = new Set(filteredTransactions.map(tx => tx.month));

    return {
      total: totalCount,
      visible: visibleCount,
      hidden: cancelingCount,
      activeAccounts: activeAccountKeys.size,
      activeMonths: activeMonthsSet.size,
    };
  }, [transactionsWithCanceling, filteredTransactions]);

  const accountBalances = useMemo((): AccountBalance[] => {
    if (!filteredTransactions.length) return [];

    const balances: { [key: number]: AccountBalance } = {};

    filteredTransactions.forEach((tx: Transaction) => {
      if (!balances[tx.accountKey]) {
        balances[tx.accountKey] = {
          accountKey: tx.accountKey,
          accountName: tx.accountName,
          months: {},
          total: 0,
        };
      }

      if (!balances[tx.accountKey].months[tx.month]) {
        balances[tx.accountKey].months[tx.month] = 0;
      }

      balances[tx.accountKey].months[tx.month] += tx.amount;
      balances[tx.accountKey].total += tx.amount;
    });

    return Object.values(balances).sort((a, b) => a.accountKey - b.accountKey);
  }, [filteredTransactions]);

  const sortCodeSummaries = useMemo(() => {
    if (!filteredTransactions.length) return {};

    const summaries: any = {};

    filteredTransactions.forEach((tx: Transaction) => {
      const code = tx.sortCode?.toString() || '0';
      
      if (!summaries[code]) {
        summaries[code] = {
          sortCode: code,
          sortCodeName: tx.sortCodeName || SORT_CODE_NAMES[code] || `קוד ${code}`,
          months: {},
          total: 0
        };
      }

      if (!summaries[code].months[tx.month]) {
        summaries[code].months[tx.month] = 0;
      }

      summaries[code].months[tx.month] += tx.amount;
      summaries[code].total += tx.amount;
    });

    return summaries;
  }, [filteredTransactions]);

  const accountBalancesByCode = useMemo((): any[] => {
    if (!filteredTransactions.length) return [];

    const sortCodes: { [key: string]: any } = {};
    const relevantCodes = ['600', '800', '801', '802', '804', '805', '806', '811', '813', '990', '991'];

    filteredTransactions.forEach((tx: Transaction) => {
      const code = tx.sortCode?.toString() || '0';
      
      if (!relevantCodes.includes(code)) return;

      if (!sortCodes[code]) {
        sortCodes[code] = {
          code,
          name: tx.sortCodeName || SORT_CODE_NAMES[code] || `קוד ${code}`,
          accounts: []
        };
      }
    });

    accountBalances.forEach((acc: AccountBalance) => {
      const accountTxs = filteredTransactions.filter((tx: Transaction) => tx.accountKey === acc.accountKey);
      if (accountTxs.length > 0) {
        const sortCode = accountTxs[0].sortCode?.toString() || '0';
        if (sortCodes[sortCode]) {
          sortCodes[sortCode].accounts.push(acc);
        }
      }
    });

    return Object.entries(sortCodes)
      .filter(([_, data]: any) => data.accounts.length > 0)
      .map(([code, data]: any) => ({
        code,
        name: data.name,
        accounts: data.accounts.sort((a: any, b: any) => a.accountKey - b.accountKey),
      }));
  }, [filteredTransactions, accountBalances]);

  const activeMonths = useMemo((): number[] => {
    return Array.from(new Set(filteredTransactions.map((tx: Transaction) => tx.month))).sort((a, b) => a - b);
  }, [filteredTransactions]);

  const dataByCode = useMemo((): any[] => {
    if (!filteredTransactions.length) return [];

    const codes: any = {};
    const relevantCodes = ['600', '800', '801', '802', '804', '805', '806', '811', '813', '990', '991'];

    filteredTransactions.forEach((tx: Transaction) => {
      const code = tx.sortCode?.toString() || '0';
      
      if (!relevantCodes.includes(code)) return;

      if (!codes[code]) {
        codes[code] = {
          code,
          name: tx.sortCodeName || SORT_CODE_NAMES[code] || `קוד ${code}`,
          total: 0,
          accounts: [],
        };
      }

      codes[code].total += tx.amount;

      let account = codes[code].accounts.find((acc: any) => acc.accountKey === tx.accountKey);
      if (!account) {
        account = {
          accountKey: tx.accountKey,
          accountName: tx.accountName,
          transactions: [],
          total: 0,
        };
        codes[code].accounts.push(account);
      }

      account.transactions.push(tx);
      account.total += tx.amount;
    });

    return Object.values(codes).sort((a: any, b: any) => {
      return parseInt(a.code) - parseInt(b.code);
    });
  }, [filteredTransactions]);

  const toggleCode = (code: string) => {
    const newSet = new Set(expandedCodes);
    if (newSet.has(code)) {
      newSet.delete(code);
    } else {
      newSet.add(code);
    }
    setExpandedCodes(newSet);
  };

  const toggleAccount = (key: string) => {
    const newSet = new Set(expandedAccounts);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedAccounts(newSet);
  };

  const expandAll = () => {
    setExpandedCodes(new Set(dataByCode.map((cat: any) => cat.code.toString())));
    const allAccounts = new Set<string>();
    dataByCode.forEach((cat: any) => {
      cat.accounts.forEach((acc: any) => {
        allAccounts.add(`${cat.code}_${acc.accountKey}`);
      });
    });
    setExpandedAccounts(allAccounts);
  };

  const collapseAll = () => {
    setExpandedCodes(new Set());
    setExpandedAccounts(new Set());
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">טוען נתונים...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-white rounded-lg">
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">מערכת ביאורים והשוואות</h1>
        <p className="text-sm text-gray-600">
          ניתוח מפורט של תנועות, יתרות והשוואות למאזן בוחן - מסודר לפי קודי מיון
        </p>
        
        <div className="mt-4 grid grid-cols-6 gap-3">
          <div className="bg-blue-50 border-2 border-blue-200 px-3 py-2 rounded-lg">
            <div className="text-xs text-blue-600 mb-1">📊 סה"כ תנועות</div>
            <div className="text-xl font-bold text-blue-700">{stats.total.toLocaleString()}</div>
          </div>
          
          <div className="bg-emerald-50 border-2 border-emerald-200 px-3 py-2 rounded-lg">
            <div className="text-xs text-emerald-600 mb-1">✅ תנועות מוצגות</div>
            <div className="text-xl font-bold text-emerald-700">{stats.visible.toLocaleString()}</div>
          </div>
          
          <div className="bg-rose-50 border-2 border-rose-200 px-3 py-2 rounded-lg">
            <div className="text-xs text-rose-600 mb-1">🔴 תנועות מוסתרות</div>
            <div className="text-xl font-bold text-rose-700">{stats.hidden.toLocaleString()}</div>
            <div className="text-xs text-rose-500">{stats.total > 0 ? ((stats.hidden / stats.total) * 100).toFixed(1) : 0}%</div>
          </div>
          
          <div className="bg-violet-50 border-2 border-violet-200 px-3 py-2 rounded-lg">
            <div className="text-xs text-violet-600 mb-1">👥 חשבונות פעילים</div>
            <div className="text-xl font-bold text-violet-700">{stats.activeAccounts}</div>
          </div>
          
          <div className="bg-amber-50 border-2 border-amber-200 px-3 py-2 rounded-lg">
            <div className="text-xs text-amber-600 mb-1">📅 חודשים פעילים</div>
            <div className="text-xl font-bold text-amber-700">{stats.activeMonths}</div>
          </div>
          
          <div className="bg-gray-50 border-2 border-gray-200 px-3 py-2 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCancelingTransactions}
                onChange={(e) => setShowCancelingTransactions(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-xs text-gray-700">הצג מבטלות</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('biurim')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'biurim'
              ? 'border-b-2 border-emerald-600 text-emerald-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📝 ביאורים לפי קודי מיון
        </button>
        <button
          onClick={() => setActiveTab('balances')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'balances'
              ? 'border-b-2 border-emerald-600 text-emerald-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📊 יתרות כרטיסים
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'comparison'
              ? 'border-b-2 border-emerald-600 text-emerald-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🔍 השוואה למאזן בוחן
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-6 py-3 font-semibold transition-colors ${
            activeTab === 'analytics'
              ? 'border-b-2 border-emerald-600 text-emerald-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📈 ניתוחים וסטטיסטיקה
        </button>
      </div>

      {activeTab === 'biurim' && (
        <BiurimTab
          dataByCode={dataByCode}
          expandedCodes={expandedCodes}
          expandedAccounts={expandedAccounts}
          toggleCode={toggleCode}
          toggleAccount={toggleAccount}
          expandAll={expandAll}
          collapseAll={collapseAll}
          formatCurrency={formatCurrency}
        />
      )}

      {activeTab === 'balances' && (
        <BalancesTab
          accountBalancesByCode={accountBalancesByCode}
          activeMonths={activeMonths}
          formatCurrency={formatCurrency}
        />
      )}

      {activeTab === 'comparison' && (
        <ComparisonTab
          trialBalanceData={trialBalanceData}
          accountBalances={accountBalances}
          sortCodeSummaries={sortCodeSummaries}
          activeMonths={activeMonths}
          formatCurrency={formatCurrency}
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsTab
          dataByCode={dataByCode}
          sortCodeSummaries={sortCodeSummaries}
          stats={stats}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

// ============ BIURIM TAB ============
const BiurimTab = ({ dataByCode, expandedCodes, expandedAccounts, toggleCode, toggleAccount, expandAll, collapseAll, formatCurrency }: any) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [detailsSearch, setDetailsSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const toggleMonth = (key: string) => {
    const newSet = new Set(expandedMonths);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedMonths(newSet);
  };
  
  const filteredData = useMemo(() => {
    return dataByCode.map((sortCode: any) => {
      const filteredAccounts = sortCode.accounts.map((account: any) => {
        let filteredTransactions = account.transactions.filter((tx: any) => {
          if (selectedMonth > 0 && tx.month !== selectedMonth) return false;
          if (detailsSearch && !tx.details.toLowerCase().includes(detailsSearch.toLowerCase())) return false;
          if (supplierSearch && !tx.counterAccountName.toLowerCase().includes(supplierSearch.toLowerCase())) return false;
          if (minAmount !== '' && tx.amount < parseFloat(minAmount)) return false;
          if (maxAmount !== '' && tx.amount > parseFloat(maxAmount)) return false;
          return true;
        });

        if (sortField) {
          filteredTransactions = [...filteredTransactions].sort((a: any, b: any) => {
            let aVal: any = a[sortField];
            let bVal: any = b[sortField];

            if (sortField === 'date') {
              aVal = new Date(a.date.split('/').reverse().join('-')).getTime();
              bVal = new Date(b.date.split('/').reverse().join('-')).getTime();
            }

            if (sortField === 'amount') {
              aVal = parseFloat(aVal);
              bVal = parseFloat(bVal);
            }

            if (sortDirection === 'asc') {
              return aVal > bVal ? 1 : -1;
            } else {
              return aVal < bVal ? 1 : -1;
            }
          });
        }

        if (filteredTransactions.length === 0) return null;

        return {
          ...account,
          transactions: filteredTransactions,
          total: filteredTransactions.reduce((sum: number, tx: any) => sum + tx.amount, 0)
        };
      }).filter((acc: any) => acc !== null);

      if (filteredAccounts.length === 0) return null;

      return {
        ...sortCode,
        accounts: filteredAccounts,
        total: filteredAccounts.reduce((sum: number, acc: any) => sum + acc.total, 0)
      };
    }).filter((cat: any) => cat !== null);
  }, [dataByCode, selectedMonth, detailsSearch, supplierSearch, minAmount, maxAmount, sortField, sortDirection]);

  const totalResults = useMemo(() => {
    return filteredData.reduce((sum: number, cat: any) => {
      return sum + cat.accounts.reduce((accSum: number, acc: any) => {
        return accSum + acc.transactions.length;
      }, 0);
    }, 0);
  }, [filteredData]);

  const totalAmount = useMemo(() => {
    return filteredData.reduce((sum: number, cat: any) => {
      return sum + cat.accounts.reduce((accSum: number, acc: any) => {
        return accSum + acc.transactions.reduce((txSum: number, tx: any) => txSum + tx.amount, 0);
      }, 0);
    }, 0);
  }, [filteredData]);

  const activeMonths = useMemo(() => {
    const months = new Set<number>();
    dataByCode.forEach((cat: any) => {
      cat.accounts.forEach((acc: any) => {
        acc.transactions.forEach((tx: any) => {
          months.add(tx.month);
        });
      });
    });
    return Array.from(months).sort((a, b) => a - b);
  }, [dataByCode]);

  const clearFilters = () => {
    setSelectedMonth(0);
    setDetailsSearch('');
    setSupplierSearch('');
    setMinAmount('');
    setMaxAmount('');
  };

  const hasActiveFilters = selectedMonth > 0 || detailsSearch || supplierSearch || minAmount || maxAmount;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <span className="opacity-30">↕</span>;
    }
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>;
  };

  return (
    <div>
      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
        <div className="grid grid-cols-6 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">חודש</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value={0}>כל החודשים</option>
              {activeMonths.map(m => (
                <option key={m} value={m}>{MONTH_NAMES[m - 1]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">חיפוש בפרטים</label>
            <input
              type="text"
              value={detailsSearch}
              onChange={(e) => setDetailsSearch(e.target.value)}
              placeholder="חפש..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ספק/לקוח</label>
            <input
              type="text"
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              placeholder="חפש..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סכום מינ׳</label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סכום מקס׳</label>
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              placeholder="∞"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              נקה סינונים
            </button>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{totalResults.toLocaleString()}</span> תוצאות | 
            סה"כ: <span className="font-semibold">{formatCurrency(totalAmount)}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={expandAll} className="px-3 py-1 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700">
              פתח הכל
            </button>
            <button onClick={collapseAll} className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700">
              סגור הכל
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {filteredData.map((sortCode: any) => {
          const isCodeExpanded = expandedCodes.has(sortCode.code.toString());
          return (
            <div key={sortCode.code} className="border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCode(sortCode.code.toString())}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isCodeExpanded ? <ChevronDown className="w-5 h-5 text-emerald-600" /> : <ChevronLeft className="w-5 h-5 text-emerald-600" />}
                  <span className="font-bold text-emerald-800">{sortCode.code}</span>
                  <span className="font-bold text-gray-800">{sortCode.name}</span>
                  <span className="text-sm text-gray-600">({sortCode.accounts.length} חשבונות)</span>
                </div>
                <div className="text-lg font-bold text-emerald-700">{formatCurrency(sortCode.total)}</div>
              </button>

              {isCodeExpanded && (
                <div className="bg-white">
                  {sortCode.accounts.map((account: any) => {
                    const accountKey = `${sortCode.code}_${account.accountKey}`;
                    const isAccountExpanded = expandedAccounts.has(accountKey);
                    return (
                      <div key={accountKey} className="border-t border-gray-200">
                        <button
                          onClick={() => toggleAccount(accountKey)}
                          className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {isAccountExpanded ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronLeft className="w-4 h-4 text-gray-600" />}
                            <span className="font-semibold text-emerald-600">{account.accountKey}</span>
                            <span className="text-gray-700">{account.accountName}</span>
                            <span className="text-xs text-gray-500">({account.transactions.length} תנועות)</span>
                          </div>
                          <div className="font-semibold text-gray-700">{formatCurrency(account.total)}</div>
                        </button>

                        {isAccountExpanded && (
                          <div className="bg-gray-50 p-4">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="p-2 text-right cursor-pointer hover:bg-gray-200" onClick={() => handleSort('date')}>
                                    תאריך <SortIcon field="date" />
                                  </th>
                                  <th className="p-2 text-right">חודש</th>
                                  <th className="p-2 text-right">פרטים</th>
                                  <th className="p-2 text-right">ספק/לקוח</th>
                                  <th className="p-2 text-left cursor-pointer hover:bg-gray-200" onClick={() => handleSort('amount')}>
                                    סכום <SortIcon field="amount" />
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {account.transactions.map((tx: any, idx: number) => (
                                  <tr key={idx} className={`border-t ${tx.isCanceling ? 'bg-rose-100' : ''}`}>
                                    <td className="p-2">{tx.date}</td>
                                    <td className="p-2">{MONTH_NAMES[tx.month - 1]}</td>
                                    <td className="p-2">{tx.details}</td>
                                    <td className="p-2">{tx.counterAccountName}</td>
                                    <td className={`p-2 text-left font-medium ${tx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                      {formatCurrency(tx.amount)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============ BALANCES TAB ============
const BalancesTab = ({ accountBalancesByCode, activeMonths, formatCurrency }: any) => {
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());

  const toggleCode = (code: string) => {
    const newSet = new Set(expandedCodes);
    if (newSet.has(code)) {
      newSet.delete(code);
    } else {
      newSet.add(code);
    }
    setExpandedCodes(newSet);
  };

  const exportBalances = () => {
    let csv = '\ufeffקוד מיון,שם קוד מיון,כרטיס,שם חשבון,';
    activeMonths.forEach((m: number) => {
      csv += `${MONTH_NAMES[m - 1]},`;
    });
    csv += 'סה"כ\n';

    accountBalancesByCode.forEach((codeGroup: any) => {
      codeGroup.accounts.forEach((acc: any) => {
        csv += `${codeGroup.code},"${codeGroup.name}",${acc.accountKey},"${acc.accountName}",`;
        activeMonths.forEach((m: number) => {
          csv += `${acc.months[m] || 0},`;
        });
        csv += `${acc.total}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `יתרות_כרטיסים_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">יתרות כרטיסים לפי קוד מיון</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setExpandedCodes(new Set(accountBalancesByCode.map((c: any) => c.code)))}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            פתח הכל
          </button>
          <button
            onClick={() => setExpandedCodes(new Set())}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            <Minus className="w-4 h-4" />
            סגור הכל
          </button>
          <button
            onClick={exportBalances}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            <Download className="w-4 h-4" />
            ייצא ל-CSV
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {accountBalancesByCode.map((codeGroup: any) => {
          const isExpanded = expandedCodes.has(codeGroup.code);
          const totalByMonth: { [key: number]: number } = {};
          let grandTotal = 0;

          codeGroup.accounts.forEach((acc: any) => {
            activeMonths.forEach((m: number) => {
              totalByMonth[m] = (totalByMonth[m] || 0) + (acc.months[m] || 0);
            });
            grandTotal += acc.total;
          });

          return (
            <div key={codeGroup.code} className="border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCode(codeGroup.code)}
                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-emerald-600" /> : <ChevronLeft className="w-5 h-5 text-emerald-600" />}
                  <span className="font-bold text-emerald-800">{codeGroup.code}</span>
                  <span className="font-bold text-gray-800">{codeGroup.name}</span>
                  <span className="text-sm text-gray-600">({codeGroup.accounts.length} חשבונות)</span>
                </div>
                <div className="text-lg font-bold text-emerald-700">{formatCurrency(grandTotal)}</div>
              </button>

              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="p-3 text-right font-bold">כרטיס</th>
                        <th className="p-3 text-right font-bold">שם חשבון</th>
                        {activeMonths.map((m: number) => (
                          <th key={m} className="p-3 text-center font-bold">{MONTH_NAMES[m - 1]}</th>
                        ))}
                        <th className="p-3 text-center font-bold bg-emerald-50">סה"כ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {codeGroup.accounts.map((acc: any, idx: number) => (
                        <tr key={acc.accountKey} className={`border-t hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="p-3 font-semibold text-emerald-600">{acc.accountKey}</td>
                          <td className="p-3">{acc.accountName}</td>
                          {activeMonths.map((m: number) => (
                            <td key={m} className="p-3 text-center font-medium">
                              {formatCurrency(acc.months[m] || 0)}
                            </td>
                          ))}
                          <td className="p-3 text-center font-bold bg-emerald-50">{formatCurrency(acc.total)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-emerald-300 bg-emerald-50">
                        <td className="p-3 font-bold text-emerald-800" colSpan={2}>סה"כ {codeGroup.name}</td>
                        {activeMonths.map((m: number) => (
                          <td key={m} className="p-3 text-center font-bold text-emerald-800">
                            {formatCurrency(totalByMonth[m] || 0)}
                          </td>
                        ))}
                        <td className="p-3 text-center font-bold bg-emerald-100 text-emerald-900">{formatCurrency(grandTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============ COMPARISON TAB ============
const ComparisonTab = ({ trialBalanceData, accountBalances, sortCodeSummaries, activeMonths, formatCurrency }: any) => {
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const [showSummaries, setShowSummaries] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{ row: string; month: number } | null>(null);
  
  if (trialBalanceData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">טוען מאזן בוחן מ-BalanceMonthlyModi.csv...</p>
        <p className="text-sm text-gray-500 mt-2">אם זה לוקח זמן, ייתכן שהקובץ חסר בתיקיית public</p>
      </div>
    );
  }

  const comparisonByCode = useMemo(() => {
    const groups: any = {};
    
    trialBalanceData.forEach((tbRow: any) => {
      const sortCode = tbRow.sortCode?.toString() || '0';
      
      if (sortCode.includes('*') || tbRow.sortCodeName?.includes('*') || tbRow.accountName?.includes('*')) return;
      
      if (!groups[sortCode]) {
        groups[sortCode] = {
          code: sortCode,
          name: tbRow.sortCodeName,
          accounts: [],
          summary: null
        };
      }
      
      if (tbRow.type === 'summary') {
        const monthlyComparison: any = {};
        let totalTB = 0;
        let totalOur = 0;
        let hasAnyDiff = false;
        
        activeMonths.forEach((m: number) => {
          const monthName = MONTH_NAMES[m - 1];
          const tbAmount = tbRow[monthName] || 0;
          const ourAmount = sortCodeSummaries[sortCode]?.months?.[m] || 0;
          const diff = Math.abs(tbAmount - ourAmount);
          const diffPercent = tbAmount !== 0 ? (diff / Math.abs(tbAmount)) * 100 : 0;
          
          if (diff > 0.01) hasAnyDiff = true;
          
          monthlyComparison[m] = {
            tb: tbAmount,
            our: ourAmount,
            diff: diff,
            diffPercent: diffPercent,
            status: diffPercent < 1 ? 'good' : diffPercent < 5 ? 'warning' : 'error'
          };
          
          totalTB += tbAmount;
          totalOur += ourAmount;
        });
        
        const totalDiff = Math.abs(totalTB - totalOur);
        const totalDiffPercent = totalTB !== 0 ? (totalDiff / Math.abs(totalTB)) * 100 : 0;
        
        groups[sortCode].summary = {
          accountName: tbRow.accountName,
          monthly: monthlyComparison,
          total: {
            tb: totalTB,
            our: totalOur,
            diff: totalDiff,
            diffPercent: totalDiffPercent,
            status: totalDiffPercent < 1 ? 'good' : totalDiffPercent < 5 ? 'warning' : 'error'
          },
          hasAnyDiff
        };
      } else {
        const ourAccount = accountBalances.find((acc: any) => acc.accountKey === tbRow.accountKey);
        const monthlyComparison: any = {};
        let totalTB = 0;
        let totalOur = 0;
        let hasAnyDiff = false;
        
        activeMonths.forEach((m: number) => {
          const monthName = MONTH_NAMES[m - 1];
          const tbAmount = tbRow[monthName] || 0;
          const ourAmount = ourAccount?.months?.[m] || 0;
          const diff = Math.abs(tbAmount - ourAmount);
          const diffPercent = tbAmount !== 0 ? (diff / Math.abs(tbAmount)) * 100 : 0;
          
          if (diff > 0.01) hasAnyDiff = true;
          
          monthlyComparison[m] = {
            tb: tbAmount,
            our: ourAmount,
            diff: diff,
            diffPercent: diffPercent,
            status: diffPercent < 1 ? 'good' : diffPercent < 5 ? 'warning' : 'error'
          };
          
          totalTB += tbAmount;
          totalOur += ourAmount;
        });
        
        const totalDiff = Math.abs(totalTB - totalOur);
        const totalDiffPercent = totalTB !== 0 ? (totalDiff / Math.abs(totalTB)) * 100 : 0;
        
        groups[sortCode].accounts.push({
          accountKey: tbRow.accountKey,
          accountName: tbRow.accountName,
          monthly: monthlyComparison,
          total: {
            tb: totalTB,
            our: totalOur,
            diff: totalDiff,
            diffPercent: totalDiffPercent,
            status: totalDiffPercent < 1 ? 'good' : totalDiffPercent < 5 ? 'warning' : 'error'
          },
          hasAnyDiff
        });
      }
    });
    
    return Object.values(groups);
  }, [trialBalanceData, accountBalances, sortCodeSummaries, activeMonths]);

  const filteredGroups = useMemo(() => {
    return comparisonByCode
      .map((group: any) => {
        let accounts = group.accounts;
        
        if (showOnlyDifferences) {
          accounts = accounts.filter((acc: any) => acc.hasAnyDiff);
        }
        
        const shouldShowSummary = showSummaries && group.summary && (!showOnlyDifferences || group.summary.hasAnyDiff);
        
        if (accounts.length === 0 && !shouldShowSummary) return null;
        
        return {
          ...group,
          accounts,
          shouldShowSummary
        };
      })
      .filter((g: any) => g !== null);
  }, [comparisonByCode, showOnlyDifferences, showSummaries]);

  const stats = useMemo(() => {
    let totalAccounts = 0;
    let totalSummaries = 0;
    let good = 0;
    let warning = 0;
    let error = 0;
    let totalDiff = 0;

    filteredGroups.forEach((group: any) => {
      group.accounts.forEach((acc: any) => {
        totalAccounts++;
        if (acc.total.status === 'good') good++;
        else if (acc.total.status === 'warning') warning++;
        else if (acc.total.status === 'error') error++;
        totalDiff += acc.total.diff;
      });
      
      if (group.shouldShowSummary) {
        totalSummaries++;
        totalDiff += group.summary.total.diff;
      }
    });

    return {
      accounts: totalAccounts,
      summaries: totalSummaries,
      good,
      warning,
      error,
      totalDiff
    };
  }, [filteredGroups]);

  const toggleCode = (code: string) => {
    const newSet = new Set(expandedCodes);
    if (newSet.has(code)) {
      newSet.delete(code);
    } else {
      newSet.add(code);
    }
    setExpandedCodes(newSet);
  };

  const CellWithTooltip = ({ data, rowKey, month }: any) => {
    const isHovered = hoveredCell?.row === rowKey && hoveredCell?.month === month;
    
    return (
      <div 
        className="relative"
        onMouseEnter={() => setHoveredCell({ row: rowKey, month })}
        onMouseLeave={() => setHoveredCell(null)}
      >
        <div className={`p-2 text-center text-xs transition-colors ${
          data.status === 'good' ? 'bg-emerald-50 hover:bg-emerald-100' :
          data.status === 'warning' ? 'bg-amber-50 hover:bg-amber-100' :
          data.status === 'error' ? 'bg-rose-50 hover:bg-rose-100' : 'bg-gray-50'
        }`}>
          {data.diff > 0.01 ? (
            <div className="font-semibold">{formatCurrency(data.diff)}</div>
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
          )}
        </div>
        
        {isHovered && data.diff > 0.01 && (
          <div className="absolute z-10 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-3 text-xs" style={{
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: '4px',
            minWidth: '180px'
          }}>
            <div className="mb-2 pb-2 border-b border-gray-200">
              <div className="font-semibold text-gray-700">מאזן בוחן:</div>
              <div className="text-blue-600 font-medium">{formatCurrency(data.tb)}</div>
            </div>
            <div className="mb-2 pb-2 border-b border-gray-200">
              <div className="font-semibold text-gray-700">מתנועות:</div>
              <div className="text-emerald-600 font-medium">{formatCurrency(data.our)}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-700">הפרש:</div>
              <div className="text-rose-600 font-bold">{formatCurrency(data.diff)}</div>
              <div className="text-gray-500">({data.diffPercent.toFixed(1)}%)</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
          <div className="text-sm text-blue-600 mb-1">חשבונות + סיכומים</div>
          <div className="text-2xl font-bold text-blue-700">{stats.accounts + stats.summaries}</div>
        </div>
        <div className="bg-emerald-50 border-2 border-emerald-200 p-4 rounded-lg">
          <div className="text-sm text-emerald-600 mb-1">✅ תואמים</div>
          <div className="text-2xl font-bold text-emerald-700">{stats.good}</div>
        </div>
        <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-lg">
          <div className="text-sm text-amber-600 mb-1">⚠️ הפרש קטן</div>
          <div className="text-2xl font-bold text-amber-700">{stats.warning}</div>
        </div>
        <div className="bg-rose-50 border-2 border-rose-200 p-4 rounded-lg">
          <div className="text-sm text-rose-600 mb-1">❌ הפרש גדול</div>
          <div className="text-2xl font-bold text-rose-700">{stats.error}</div>
        </div>
        <div className="bg-violet-50 border-2 border-violet-200 p-4 rounded-lg">
          <div className="text-sm text-violet-600 mb-1">סה"כ הפרשים</div>
          <div className="text-2xl font-bold text-violet-700">{formatCurrency(stats.totalDiff)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyDifferences}
            onChange={(e) => setShowOnlyDifferences(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">הצג רק הפרשים</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showSummaries}
            onChange={(e) => setShowSummaries(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">הצג סיכומים</span>
        </label>
        <button
          onClick={() => setExpandedCodes(new Set(filteredGroups.map((g: any) => g.code)))}
          className="px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          פתח הכל
        </button>
        <button
          onClick={() => setExpandedCodes(new Set())}
          className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          סגור הכל
        </button>
      </div>

      {/* Comparison Tables */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {filteredGroups.map((group: any) => {
          const isExpanded = expandedCodes.has(group.code);
          return (
            <div key={group.code} className="border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCode(group.code)}
                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-blue-600" /> : <ChevronLeft className="w-5 h-5 text-blue-600" />}
                  <span className="font-bold text-blue-800">{group.code}</span>
                  <span className="font-bold text-gray-800">{group.name}</span>
                  <span className="text-sm text-gray-600">
                    ({group.accounts.length} חשבונות{group.shouldShowSummary ? ' + סיכום' : ''})
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="p-2 text-right font-bold border-r border-gray-300" rowSpan={2}>סוג</th>
                        <th className="p-2 text-right font-bold border-r border-gray-300" rowSpan={2}>כרטיס</th>
                        <th className="p-2 text-right font-bold border-r border-gray-300" rowSpan={2}>שם חשבון</th>
                        <th className="p-2 text-center font-bold border-b border-gray-300" colSpan={activeMonths.length}>
                          הפרשים חודשיים (מאזן בוחן - תנועות)
                        </th>
                        <th className="p-2 text-center font-bold bg-cyan-50 border-r border-gray-300" rowSpan={2}>סה"כ מצטבר</th>
                      </tr>
                      <tr>
                        {activeMonths.map((m: number) => (
                          <th key={m} className="p-2 text-center font-bold border-r border-gray-200">
                            {MONTH_NAMES[m - 1]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.accounts.map((acc: any) => (
                        <tr key={acc.accountKey} className="border-t hover:bg-gray-50">
                          <td className="p-2 border-r border-gray-300">
                            <span className="text-gray-500 text-xs">חשבון</span>
                          </td>
                          <td className="p-2 font-semibold text-emerald-600 border-r border-gray-300">
                            {acc.accountKey}
                          </td>
                          <td className="p-2 border-r border-gray-300 max-w-xs truncate">
                            {acc.accountName}
                          </td>
                          {activeMonths.map((m: number) => (
                            <td key={m} className="border-r border-gray-200">
                              <CellWithTooltip 
                                data={acc.monthly[m]} 
                                rowKey={`acc-${acc.accountKey}`}
                                month={m}
                              />
                            </td>
                          ))}
                          <td className="border-r border-gray-300">
                            <div className={`p-2 text-center text-xs font-bold ${
                              acc.total.status === 'good' ? 'bg-emerald-100' :
                              acc.total.status === 'warning' ? 'bg-amber-100' :
                              'bg-rose-100'
                            }`}>
                              {acc.total.diff > 0.01 ? formatCurrency(acc.total.diff) : <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {group.shouldShowSummary && (
                        <tr className="border-t-2 border-blue-300 bg-blue-50">
                          <td className="p-2 border-r border-gray-300">
                            <span className="text-blue-600 text-xs font-bold">סיכום</span>
                          </td>
                          <td className="p-2 font-bold text-blue-700 border-r border-gray-300">
                            {group.summary.accountName.includes('סה"כ') ? '' : 'סה"כ'}
                          </td>
                          <td className="p-2 font-bold text-blue-700 border-r border-gray-300">
                            {group.summary.accountName}
                          </td>
                          {activeMonths.map((m: number) => (
                            <td key={m} className="border-r border-gray-200">
                              <CellWithTooltip 
                                data={group.summary.monthly[m]} 
                                rowKey={`summary-${group.code}`}
                                month={m}
                              />
                            </td>
                          ))}
                          <td className="border-r border-gray-300">
                            <div className={`p-2 text-center text-xs font-bold ${
                              group.summary.total.status === 'good' ? 'bg-emerald-200' :
                              group.summary.total.status === 'warning' ? 'bg-amber-200' :
                              'bg-rose-200'
                            }`}>
                              {group.summary.total.diff > 0.01 ? (
                                <div>
                                  <div>{formatCurrency(group.summary.total.diff)}</div>
                                  <div className="text-gray-700">({group.summary.total.diffPercent.toFixed(1)}%)</div>
                                </div>
                              ) : (
                                <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" />
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-blue-800">💡 טיפ:</span>
          <span className="text-blue-700">
            העבר עכבר מעל תא עם הפרש כדי לראות את הפירוט המלא (מאזן בוחן vs תנועות)
          </span>
        </div>
      </div>
    </div>
  );
};

// ============ ANALYTICS TAB ============
const AnalyticsTab = ({ dataByCode, sortCodeSummaries, stats, formatCurrency }: any) => {
  const totalIncome = useMemo(() => {
    const code600 = dataByCode.find((cat: any) => cat.code === '600');
    return code600 ? Math.abs(code600.total) : 0;
  }, [dataByCode]);

  const totalExpenses = useMemo(() => {
    return dataByCode
      .filter((cat: any) => cat.code !== '600')
      .reduce((sum: number, cat: any) => sum + Math.abs(cat.total), 0);
  }, [dataByCode]);

  const netProfit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-gray-800">ניתוחים וסטטיסטיקה - לפי קודי מיון</h3>

      {/* Canceling Stats */}
      <div className="bg-gradient-to-r from-rose-50 to-orange-50 border-2 border-rose-200 p-6 rounded-lg">
        <h4 className="text-lg font-bold text-rose-800 mb-4 flex items-center gap-2">
          <span>🔴</span>
          סטטיסטיקת תנועות מבטלות
        </h4>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-rose-600 mb-1">תנועות כלליות</div>
            <div className="text-2xl font-bold text-rose-700">{stats.total.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-rose-600 mb-1">תנועות מבטלות</div>
            <div className="text-2xl font-bold text-rose-700">{stats.hidden.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-rose-600 mb-1">אחוז מבטלות</div>
            <div className="text-2xl font-bold text-rose-700">
              {stats.total > 0 ? ((stats.hidden / stats.total) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div>
            <div className="text-sm text-rose-600 mb-1">תנועות נותרות</div>
            <div className="text-2xl font-bold text-emerald-700">{stats.visible.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-lg border-2 border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-emerald-700">הכנסות (600)</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">{formatCurrency(totalIncome)}</div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-rose-100 p-6 rounded-lg border-2 border-rose-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-rose-700">הוצאות</span>
            <TrendingDown className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-800">{formatCurrency(totalExpenses)}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">רווח נקי</span>
            <span className="text-2xl">💰</span>
          </div>
          <div className="text-2xl font-bold text-blue-800">{formatCurrency(netProfit)}</div>
        </div>

        <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-6 rounded-lg border-2 border-violet-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-violet-700">% רווחיות</span>
            <span className="text-2xl">📊</span>
          </div>
          <div className="text-2xl font-bold text-violet-800">{profitMargin.toFixed(1)}%</div>
        </div>
      </div>

      {/* Breakdown by Sort Code */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4">פילוח לפי קודי מיון</h4>
        <div className="space-y-3">
          {dataByCode.map((cat: any) => {
            const percent = totalIncome > 0 ? (Math.abs(cat.total) / totalIncome * 100).toFixed(1) : '0.0';
            const isIncome = cat.code === '600';
            return (
              <div key={cat.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                  <span className="font-semibold text-gray-700">{cat.code}</span>
                  <span className="text-gray-600">{cat.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-gray-800">{formatCurrency(Math.abs(cat.total))}</div>
                    <div className="text-sm text-gray-500">{percent}%</div>
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(parseFloat(percent), 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BiurimSystem;