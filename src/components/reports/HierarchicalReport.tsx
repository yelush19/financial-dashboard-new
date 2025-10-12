import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, TrendingUp, Package2, Building2, Landmark, Save, Edit3, BarChart3, TrendingDown } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Transaction {
  sortCode: number | null;
  sortCodeName: string;
  accountKey: number;
  accountName: string;
  amount: number;
  details: string;
  date: string;
  counterAccountName: string;
}

interface AccountData {
  accountKey: number;
  accountName: string;
  total: number;
  transactions: Transaction[];
}

interface SubCategoryData {
  name: string;
  total: number;
  accounts: AccountData[];
}

interface CategoryData {
  code: number | string;
  name: string;
  total: number;
  type: 'income' | 'cogs' | 'operating' | 'financial';
  subCategories?: SubCategoryData[];
  accounts?: AccountData[];
}

interface MonthlyData {
  month: string;
  revenue: number;
  cogs: number;
  operating: number;
  financial: number;
  marketing: number;
  grossProfit: number;
  operatingProfit: number;
  netProfit: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

const HierarchicalReport: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  
  const [openingInventory, setOpeningInventory] = useState<number>(
    parseFloat(localStorage.getItem('openingInventory') || '0')
  );
  const [closingInventory, setClosingInventory] = useState<number>(
    parseFloat(localStorage.getItem('closingInventory') || '0')
  );

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const response = await fetch('/TransactionMonthlyModi.csv');
        const text = await response.text();
        
        console.log('🔍 דוח היררכי - מתחיל לטעון...');
        console.log('גודל הקובץ:', text.length, 'תווים');
        
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results: Papa.ParseResult<any>) => {
            const parsed: Transaction[] = results.data.map((row: any) => ({
              sortCode: row['קוד מיון'] ? parseInt(row['קוד מיון']) : null,
              sortCodeName: row['שם קוד מיון'] || '',
              accountKey: parseInt(row['מפתח חשבון']) || 0,
              accountName: row['שם חשבון'] || '',
              amount: parseFloat(row['חובה / זכות (שקל)']?.replace(/,/g, '') || '0'),
              details: row['פרטים'] || '',
              date: row['ת.אסמכ'] || '',
              counterAccountName: row['שם חשבון נגדי'] || '',
            }));
            const filtered = parsed.filter(tx => tx.accountKey !== 0);
            
            console.log('✅ סה"כ שורות:', results.data.length);
            console.log('✅ תנועות תקינות:', filtered.length);
            console.log('✅ דוגמת תאריכים:', filtered.slice(0, 5).map(tx => tx.date));
            console.log('✅ דוגמת סכומים:', filtered.slice(0, 5).map(tx => tx.amount));
            
            setTransactions(filtered);
            setLoading(false);
          },
        });
      } catch (error: any) {
        console.error('❌ Error loading transactions:', error);
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  const saveInventory = () => {
    localStorage.setItem('openingInventory', openingInventory.toString());
    localStorage.setItem('closingInventory', closingInventory.toString());
    alert('המלאי נשמר בהצלחה!');
  };

  // חישוב נתונים חודשיים
  const monthlyData = useMemo((): MonthlyData[] => {
    if (!transactions.length) return [];

    console.log('📊 דוח היררכי - מחשב נתונים חודשיים...');

    // מציאת כל החודשים הייחודיים בפועל מהנתונים
    const uniqueMonths = Array.from(new Set(
      transactions
        .filter(tx => tx.date && tx.date.split('/').length === 3)
        .map(tx => parseInt(tx.date.split('/')[1]))
    )).sort((a, b) => a - b);
    
    console.log('📅 חודשים שנמצאו:', uniqueMonths);
    console.log('📈 סה"כ תנועות עם תאריכים תקינים:', 
      transactions.filter(tx => tx.date && tx.date.split('/').length === 3).length
    );
    
    return uniqueMonths.map(month => {
      const monthTxs = transactions.filter(tx => {
        if (!tx.date) return false;
        try {
          const parts = tx.date.split('/');
          if (parts.length === 3) {
            return parseInt(parts[1]) === month;
          }
        } catch (e: any) {
          return false;
        }
        return false;
      });

      const revenue = _.sumBy(monthTxs.filter(tx => tx.sortCode === 600), 'amount');
      const cogs = _.sumBy(monthTxs.filter(tx => tx.sortCode === 800), 'amount');
      const operating = _.sumBy(monthTxs.filter(tx => [801, 806, 802, 805, 804, 811].includes(tx.sortCode || 0)), 'amount');
      const financial = _.sumBy(monthTxs.filter(tx => [813, 990, 991].includes(tx.sortCode || 0)), 'amount');
      
      // חישוב הוצאות שיווק (805 + 804)
      const marketing = _.sumBy(monthTxs.filter(tx => [805, 804].includes(tx.sortCode || 0)), 'amount');

      return {
        month: MONTH_NAMES[month - 1],
        revenue,
        cogs,
        operating,
        financial,
        marketing,
        grossProfit: revenue + cogs,
        operatingProfit: revenue + cogs + operating,
        netProfit: revenue + cogs + operating + financial,
      };
    });
  }, [transactions]);

  const hierarchicalData = useMemo(() => {
    if (!transactions.length) return { 
      categories: [], 
      totals: { revenue: 0, cogs: 0, operating: 0, financial: 0, grossProfit: 0, operatingProfit: 0, netProfit: 0 },
      dateRange: '01-12.25'
    };

    console.log('🏗️ דוח היררכי - בונה מבנה היררכי...');

    // משתמש בכל התנועות ללא סינון
    const filteredTransactions = transactions;
    
    console.log('📋 סה"כ תנועות לעיבוד:', filteredTransactions.length);

    // חישוב טווח תאריכים בפועל
    const validDates = filteredTransactions
      .map(tx => tx.date)
      .filter(d => d && d.split('/').length === 3)
      .map(dateStr => {
        const parts = dateStr.split('/');
        return {
          str: dateStr,
          day: parseInt(parts[0]),
          month: parseInt(parts[1]),
          year: parseInt(parts[2])
        };
      })
      .sort((a, b) => {
        // מיון לפי שנה, אחר כך חודש, אחר כך יום
        if (a.year !== b.year) return a.year - b.year;
        if (a.month !== b.month) return a.month - b.month;
        return a.day - b.day;
      });
    
    let formattedDateRange = '01-12.25';
    
    if (validDates.length > 0) {
      try {
        const firstDate = validDates[0];
        const lastDate = validDates[validDates.length - 1];
        
        const firstMonth = firstDate.month;
        const lastMonth = lastDate.month;
        const year = lastDate.year.toString().substring(2); // 2 ספרות אחרונות
        
        formattedDateRange = `${String(firstMonth).padStart(2, '0')}-${String(lastMonth).padStart(2, '0')}.${year}`;
      } catch (error: any) {
        console.error('Error formatting date range:', error);
      }
    }

    // הכנסות
    const revenue600 = filteredTransactions.filter(tx => tx.sortCode === 600);
    const revenueWebsite = revenue600.filter(tx => tx.accountKey < 40020);
    const revenueSuperpharm = revenue600.filter(tx => tx.accountKey >= 40020);

    const revenueCategory: CategoryData = {
      code: 600,
      name: 'הכנסות',
      type: 'income',
      total: _.sumBy(revenue600, 'amount'),
      subCategories: [
        {
          name: 'הכנסות מאתר ולקוחות',
          total: _.sumBy(revenueWebsite, 'amount'),
          accounts: Object.entries(_.groupBy(revenueWebsite, 'accountKey')).map(([key, txs]) => ({
            accountKey: parseInt(key),
            accountName: (txs as Transaction[])[0].accountName,
            total: _.sumBy(txs as Transaction[], 'amount'),
            transactions: txs as Transaction[],
          })),
        },
        {
          name: 'הכנסות מסופרפארם',
          total: _.sumBy(revenueSuperpharm, 'amount'),
          accounts: Object.entries(_.groupBy(revenueSuperpharm, 'accountKey')).map(([key, txs]) => ({
            accountKey: parseInt(key),
            accountName: (txs as Transaction[])[0].accountName,
            total: _.sumBy(txs as Transaction[], 'amount'),
            transactions: txs as Transaction[],
          })),
        },
      ],
    };

    // עלות המכר
    const cogs800 = filteredTransactions.filter(tx => tx.sortCode === 800);
    const purchases = _.sumBy(cogs800, 'amount');
    const actualCOGS = openingInventory + purchases - closingInventory;

    const cogsCategory: CategoryData = {
      code: 800,
      name: 'עלות המכר',
      type: 'cogs',
      total: actualCOGS,
      accounts: Object.entries(_.groupBy(cogs800, 'accountKey')).map(([key, txs]) => ({
        accountKey: parseInt(key),
        accountName: (txs as Transaction[])[0].accountName,
        total: _.sumBy(txs as Transaction[], 'amount'),
        transactions: txs as Transaction[],
      })),
    };

    // הוצאות תפעול
    const operatingCodes = [801, 806, 802, 805, 804, 811];
    const operatingCategories: CategoryData[] = operatingCodes.map(code => {
      const txs = filteredTransactions.filter(tx => tx.sortCode === code);
      return {
        code,
        name: txs[0]?.sortCodeName || `קוד ${code}`,
        type: 'operating',
        total: _.sumBy(txs, 'amount'),
        accounts: Object.entries(_.groupBy(txs, 'accountKey')).map(([key, accounts]) => ({
          accountKey: parseInt(key),
          accountName: (accounts as Transaction[])[0].accountName,
          total: _.sumBy(accounts as Transaction[], 'amount'),
          transactions: accounts as Transaction[],
        })),
      };
    });

    // הוצאות מימון
    const financial813 = filteredTransactions.filter(tx => tx.sortCode === 813);
    const financial990 = filteredTransactions.filter(tx => tx.sortCode === 990);
    const financialBankFees = [...financial813, ...financial990];
    const financial991 = filteredTransactions.filter(tx => tx.sortCode === 991);

    const financialCategories: CategoryData[] = [
      {
        code: '813+990',
        name: 'עמלות בנקים וסליקה',
        type: 'financial',
        total: _.sumBy(financialBankFees, 'amount'),
        accounts: Object.entries(_.groupBy(financialBankFees, 'accountKey')).map(([key, txs]) => ({
          accountKey: parseInt(key),
          accountName: (txs as Transaction[])[0].accountName,
          total: _.sumBy(txs as Transaction[], 'amount'),
          transactions: txs as Transaction[],
        })),
      },
      {
        code: 991,
        name: 'ריבית החזר הלוואה',
        type: 'financial',
        total: _.sumBy(financial991, 'amount'),
        accounts: Object.entries(_.groupBy(financial991, 'accountKey')).map(([key, txs]) => ({
          accountKey: parseInt(key),
          accountName: (txs as Transaction[])[0].accountName,
          total: _.sumBy(txs as Transaction[], 'amount'),
          transactions: txs as Transaction[],
        })),
      },
    ];

    const totalRevenue = revenueCategory.total;
    const totalCOGS = cogsCategory.total;
    const totalOperating = _.sumBy(operatingCategories, 'total');
    const totalFinancial = _.sumBy(financialCategories, 'total');

    console.log('💰 סיכומים:');
    console.log('  הכנסות:', totalRevenue);
    console.log('  עלות מכר:', totalCOGS);
    console.log('  הוצאות תפעול:', totalOperating);
    console.log('  הוצאות מימון:', totalFinancial);
    console.log('  רווח נקי:', totalRevenue + totalCOGS + totalOperating + totalFinancial);

    return {
      categories: [revenueCategory, cogsCategory, ...operatingCategories, ...financialCategories],
      totals: {
        revenue: totalRevenue,
        cogs: totalCOGS,
        operating: totalOperating,
        financial: totalFinancial,
        grossProfit: totalRevenue + totalCOGS,
        operatingProfit: totalRevenue + totalCOGS + totalOperating,
        netProfit: totalRevenue + totalCOGS + totalOperating + totalFinancial,
      },
      dateRange: formattedDateRange
    };
  }, [transactions, openingInventory, closingInventory]);

  const toggleCategory = (code: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      newSet.has(code) ? newSet.delete(code) : newSet.add(code);
      return newSet;
    });
  };

  const toggleSubCategory = (key: string) => {
    setExpandedSubCategories(prev => {
      const newSet = new Set(prev);
      newSet.has(key) ? newSet.delete(key) : newSet.add(key);
      return newSet;
    });
  };

  const toggleAccount = (accountKey: number) => {
    setExpandedAccounts(prev => {
      const newSet = new Set(prev);
      const key = accountKey.toString();
      newSet.has(key) ? newSet.delete(key) : newSet.add(key);
      return newSet;
    });
  };

  const formatCurrency = (amount: number) => {
    const isNegative = amount < 0;
    const absoluteAmount = Math.abs(amount);
    
    const formatted = new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(absoluteAmount);
    
    // אם המספר שלילי, נציג אותו בסוגריים
    return isNegative ? `(${formatted})` : formatted;
  };

  const formatPercent = (value: number, total: number) => {
    if (total === 0) return '0.0%';
    return ((value / total) * 100).toFixed(1) + '%';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">טוען נתונים...</div>
      </div>
    );
  }

  const { categories, totals, dateRange } = hierarchicalData;

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-4 mb-6">
      {/* כותרת */}
      <div className="mb-3 border-b border-gray-200 pb-2">
        <h1 className="text-2xl font-bold text-gray-800">דוח רווח והפסד מצטבר</h1>
        <p className="text-sm text-gray-600 mt-1">תקופה: {dateRange}</p>
      </div>

      {/* כרטיסי סיכום - קומפקטיים */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {/* כרטיס הכנסות */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-300 rounded-lg p-2.5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="bg-green-500 rounded-full p-1">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">סך הכנסות</span>
          </div>
          <div className="text-lg font-bold text-green-700 mb-0.5">
            {formatCurrency(totals.revenue)}
          </div>
          <div className="text-xs text-green-600">
            <span className="bg-green-100 px-1.5 py-0.5 rounded text-xs">100%</span>
          </div>
        </div>

        {/* כרטיס הוצאות - אפור */}
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-300 rounded-lg p-2.5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="bg-gray-500 rounded-full p-1">
              <TrendingDown className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-700">סך הוצאות</span>
          </div>
          <div className="text-lg font-bold text-gray-700 mb-0.5">
            {formatCurrency(totals.cogs + totals.operating + totals.financial)}
          </div>
          <div className="text-xs text-gray-600">
            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
              {formatPercent(Math.abs(totals.cogs + totals.operating + totals.financial), totals.revenue)}
            </span>
          </div>
        </div>

        {/* כרטיס רווח נקי */}
        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-400 rounded-lg p-2.5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="bg-teal-500 rounded-full p-1">
              <span className="text-white text-sm font-bold">💰</span>
            </div>
            <span className="text-xs font-medium text-gray-700">רווח נקי</span>
          </div>
          <div className="text-lg font-bold text-teal-700 mb-0.5">
            {formatCurrency(totals.netProfit)}
          </div>
          <div className="text-xs text-teal-600">
            <span className="bg-teal-100 px-1.5 py-0.5 rounded text-xs">
              {formatPercent(totals.netProfit, totals.revenue)}
            </span>
          </div>
        </div>

        {/* כרטיס אחוז רווחיות */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-400 rounded-lg p-2.5 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="bg-orange-500 rounded-full p-1">
              <span className="text-white text-sm font-bold">%</span>
            </div>
            <span className="text-xs font-medium text-gray-700">% רווחיות</span>
          </div>
          <div className="text-2xl font-bold text-orange-700 mb-0.5">
            {formatPercent(totals.netProfit, totals.revenue)}
          </div>
          <div className="text-xs text-orange-600">
            מסך ההכנסות
          </div>
        </div>
      </div>

      {/* תצוגה דו-עמודתית */}
      <div className="grid grid-cols-[55%_45%] gap-4" style={{ maxHeight: '70vh' }}>
        {/* עמודה שמאל - הדוח ההיררכי */}
        <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: '55vh' }}>
          {/* הכנסות */}
          {categories.filter(c => c.type === 'income').map((category) => (
            <div key={category.code} className="border border-gray-200 rounded-md overflow-hidden bg-white">
              <button
                onClick={() => toggleCategory(category.code.toString())}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedCategories.has(category.code.toString()) ? (
                    <Minus className="w-5 h-5 text-gray-700" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-700" />
                  )}
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-gray-800">{category.name}</span>
                </div>
                <span className="font-semibold text-green-600">{formatCurrency(category.total)}</span>
              </button>

              {expandedCategories.has(category.code.toString()) && category.subCategories && (
                <div className="bg-gray-50">
                  {category.subCategories.map((sub, idx) => (
                    <div key={idx} className="border-t border-gray-200">
                      <button
                        onClick={() => toggleSubCategory(`${category.code}-${idx}`)}
                        className="w-full flex items-center justify-between p-3 pl-12 hover:bg-white transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {expandedSubCategories.has(`${category.code}-${idx}`) ? (
                            <Minus className="w-4 h-4 text-gray-600" />
                          ) : (
                            <Plus className="w-4 h-4 text-gray-600" />
                          )}
                          <span className="text-gray-700">{sub.name}</span>
                        </div>
                        <span className="text-gray-700">{formatCurrency(sub.total)}</span>
                      </button>

                      {expandedSubCategories.has(`${category.code}-${idx}`) && (
                        <div className="bg-white">
                          {sub.accounts.filter(account => account.total !== 0).map((account) => (
                            <div key={account.accountKey} className="border-t border-gray-100">
                              <button
                                onClick={() => toggleAccount(account.accountKey)}
                                className="w-full flex items-center justify-between p-2 pl-20 hover:bg-gray-50 transition-colors text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  {expandedAccounts.has(account.accountKey.toString()) ? (
                                    <Minus className="w-3 h-3 text-gray-500" />
                                  ) : (
                                    <Plus className="w-3 h-3 text-gray-500" />
                                  )}
                                  <span className="text-gray-600">{account.accountKey} - {account.accountName}</span>
                                </div>
                                <span className="text-gray-700">{formatCurrency(account.total)}</span>
                              </button>

                              {expandedAccounts.has(account.accountKey.toString()) && (
                                <div className="bg-gray-50 p-2 pl-24">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="p-1 text-right text-gray-700">תאריך</th>
                                        <th className="p-1 text-right text-gray-700">פרטים</th>
                                        <th className="p-1 text-left text-gray-700">סכום</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {account.transactions.map((tx, i) => (
                                        <tr key={i} className="border-t border-gray-100 hover:bg-white">
                                          <td className="p-1 text-right text-gray-600 text-xs">{tx.date}</td>
                                          <td className="p-1 text-right text-gray-700 text-xs truncate max-w-[200px]">{tx.details}</td>
                                          <td className="p-1 text-left text-xs">{formatCurrency(tx.amount)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="bg-gray-100 px-4 py-2 flex justify-between">
                            <span className="font-semibold text-gray-700">סה"כ {sub.name}</span>
                            <span className="font-semibold text-gray-800">{formatCurrency(sub.total)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="bg-gray-200 px-4 py-3 flex justify-between">
                    <span className="font-bold text-gray-800">סה"כ {category.name}</span>
                    <span className="font-bold text-green-700 text-lg">{formatCurrency(category.total)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* עלות המכר */}
          {categories.filter(c => c.type === 'cogs').map((category) => (
            <div key={category.code} className="border border-gray-200 rounded-md overflow-hidden bg-white">
              <button
                onClick={() => toggleCategory(category.code.toString())}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedCategories.has(category.code.toString()) ? (
                    <Minus className="w-5 h-5 text-gray-700" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-700" />
                  )}
                  <Package2 className="w-5 h-5 text-orange-600" />
                  <span className="font-semibold text-gray-800">{category.name}</span>
                </div>
                <span className="font-semibold text-gray-600">{formatCurrency(category.total)}</span>
              </button>

              {expandedCategories.has(category.code.toString()) && (
                <div className="bg-gray-50 p-4">
                  <div className="bg-white border border-gray-300 rounded-md p-3 mb-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700 font-medium">מלאי פתיחה</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={openingInventory}
                        onChange={(e) => setOpeningInventory(parseFloat(e.target.value) || 0)}
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                      />
                      <span className="text-gray-700">{formatCurrency(openingInventory)}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-md border border-gray-200 mb-2">
                    {(category.accounts || []).filter(account => account.total !== 0).map((account) => (
                      <div key={account.accountKey} className="border-b border-gray-100 last:border-b-0 p-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{account.accountKey} - {account.accountName}</span>
                          <span className="text-gray-700 font-medium">{formatCurrency(account.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white border border-gray-300 rounded-md p-3 mb-2 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700 font-medium">מלאי סגירה</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={closingInventory}
                        onChange={(e) => setClosingInventory(parseFloat(e.target.value) || 0)}
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                      />
                      <span className="text-gray-700">{formatCurrency(closingInventory)}</span>
                    </div>
                  </div>

                  <button
                    onClick={saveInventory}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors text-sm mb-3"
                  >
                    <Save className="w-4 h-4" />
                    שמור מלאי
                  </button>

                  <div className="bg-gray-200 px-4 py-3 flex justify-between rounded-md">
                    <span className="font-bold text-gray-800">סה"כ עלות המכר</span>
                    <span className="font-bold text-gray-700 text-lg">{formatCurrency(category.total)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* רווח גולמי */}
          <div className="bg-green-50 border border-green-300 rounded-md p-2">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
              <span className="font-bold text-sm">💰 רווח גולמי</span>
              <span className="font-bold text-green-700 text-base">{formatCurrency(totals.grossProfit)}</span>
              <span className="font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded text-xs">
                {formatPercent(totals.grossProfit, totals.revenue)}
              </span>
            </div>
          </div>

          {/* הוצאות תפעול */}
          {categories.filter(c => c.type === 'operating').map((category) => (
            <div key={category.code} className="border border-gray-200 rounded-md overflow-hidden bg-white">
              <button
                onClick={() => toggleCategory(category.code.toString())}
                className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedCategories.has(category.code.toString()) ? (
                    <Minus className="w-4 h-4 text-gray-700" />
                  ) : (
                    <Plus className="w-4 h-4 text-gray-700" />
                  )}
                  <Building2 className="w-4 h-4 text-slate-600" />
                  <span className="font-medium text-gray-800 text-sm">{category.name}</span>
                </div>
                <span className="font-semibold text-gray-600 text-sm">{formatCurrency(category.total)}</span>
              </button>

              {expandedCategories.has(category.code.toString()) && (
                <div className="bg-gray-50">
                  {(category.accounts || []).filter(account => account.total !== 0).map((account) => (
                    <div key={account.accountKey} className="border-t border-gray-200">
                      <button
                        onClick={() => toggleAccount(account.accountKey)}
                        className="w-full flex items-center justify-between p-2 pl-8 hover:bg-white transition-colors text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {expandedAccounts.has(account.accountKey.toString()) ? (
                            <Minus className="w-3 h-3 text-gray-500" />
                          ) : (
                            <Plus className="w-3 h-3 text-gray-500" />
                          )}
                          <span className="text-gray-600">{account.accountKey} - {account.accountName}</span>
                        </div>
                        <span className="text-gray-700">{formatCurrency(account.total)}</span>
                      </button>

                      {expandedAccounts.has(account.accountKey.toString()) && (
                        <div className="bg-gray-50 p-2 pl-12">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="p-1 text-right text-gray-700">תאריך</th>
                                <th className="p-1 text-right text-gray-700">פרטים</th>
                                <th className="p-1 text-left text-gray-700">סכום</th>
                              </tr>
                            </thead>
                            <tbody>
                              {account.transactions.map((tx, i) => (
                                <tr key={i} className="border-t border-gray-100 hover:bg-white">
                                  <td className="p-1 text-right text-gray-600 text-xs">{tx.date}</td>
                                  <td className="p-1 text-right text-gray-700 text-xs truncate max-w-[200px]">{tx.details}</td>
                                  <td className="p-1 text-left text-xs">{formatCurrency(tx.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="bg-gray-200 px-4 py-2 flex justify-between">
                    <span className="font-bold text-gray-800 text-sm">סה"כ {category.name}</span>
                    <span className="font-bold text-gray-700">{formatCurrency(category.total)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* רווח תפעולי */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-md p-2">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
              <span className="font-bold text-sm">💼 רווח תפעולי</span>
              <span className="font-bold text-emerald-700 text-base">{formatCurrency(totals.operatingProfit)}</span>
              <span className="font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-xs">
                {formatPercent(totals.operatingProfit, totals.revenue)}
              </span>
            </div>
          </div>

          {/* הוצאות מימון */}
          {categories.filter(c => c.type === 'financial').map((category) => (
            <div key={category.code} className="border border-gray-200 rounded-md overflow-hidden bg-white">
              <button
                onClick={() => toggleCategory(category.code.toString())}
                className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {expandedCategories.has(category.code.toString()) ? (
                    <Minus className="w-4 h-4 text-gray-700" />
                  ) : (
                    <Plus className="w-4 h-4 text-gray-700" />
                  )}
                  <Landmark className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-800 text-sm">{category.name}</span>
                </div>
                <span className="font-semibold text-gray-600 text-sm">{formatCurrency(category.total)}</span>
              </button>

              {expandedCategories.has(category.code.toString()) && (
                <div className="bg-gray-50">
                  {(category.accounts || []).filter(account => account.total !== 0).map((account) => (
                    <div key={account.accountKey} className="border-t border-gray-200">
                      <button
                        onClick={() => toggleAccount(account.accountKey)}
                        className="w-full flex items-center justify-between p-2 pl-8 hover:bg-white transition-colors text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {expandedAccounts.has(account.accountKey.toString()) ? (
                            <Minus className="w-3 h-3 text-gray-500" />
                          ) : (
                            <Plus className="w-3 h-3 text-gray-500" />
                          )}
                          <span className="text-gray-600">{account.accountKey} - {account.accountName}</span>
                        </div>
                        <span className="text-gray-700">{formatCurrency(account.total)}</span>
                      </button>

                      {expandedAccounts.has(account.accountKey.toString()) && (
                        <div className="bg-gray-50 p-2 pl-12">
                          <table className="w-full text-xs">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="p-1 text-right text-gray-700">תאריך</th>
                                <th className="p-1 text-right text-gray-700">פרטים</th>
                                <th className="p-1 text-left text-gray-700">סכום</th>
                              </tr>
                            </thead>
                            <tbody>
                              {account.transactions.map((tx, i) => (
                                <tr key={i} className="border-t border-gray-100 hover:bg-white">
                                  <td className="p-1 text-right text-gray-600 text-xs">{tx.date}</td>
                                  <td className="p-1 text-right text-gray-700 text-xs truncate max-w-[200px]">{tx.details}</td>
                                  <td className="p-1 text-left text-xs">{formatCurrency(tx.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="bg-gray-200 px-4 py-2 flex justify-between">
                    <span className="font-bold text-gray-800 text-sm">סה"כ {category.name}</span>
                    <span className="font-bold text-gray-700">{formatCurrency(category.total)}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* רווח נקי */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-400 rounded-md p-2.5">
            <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
              <span className="font-bold text-base">💰💰 רווח נקי</span>
              <span className="font-bold text-teal-700 text-lg">{formatCurrency(totals.netProfit)}</span>
              <span className="font-bold text-teal-700 bg-teal-100 px-3 py-1 rounded-lg text-sm">
                {formatPercent(totals.netProfit, totals.revenue)}
              </span>
            </div>
          </div>
        </div>

        {/* עמודה ימין - גרפים בלבד */}
        <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '55vh' }}>
          {/* גרף עמודות חודשי */}
          <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
              <h3 className="font-bold text-gray-800 text-xs">הכנסות vs הוצאות</h3>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 8 }} />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{ fontSize: '10px' }}
                />
                <Legend wrapperStyle={{ fontSize: '9px' }} />
                <Bar dataKey="revenue" name="הכנסות" fill="#10b981" />
                <Bar dataKey="operating" name="הוצאות" fill="#6b7280" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* גרף קו - מגמת רווחיות */}
          <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <h3 className="font-bold text-gray-800 text-xs">מגמת רווחיות</h3>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 8 }} />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{ fontSize: '10px' }}
                />
                <Legend wrapperStyle={{ fontSize: '9px' }} />
                <Line type="monotone" dataKey="grossProfit" name="רווח גולמי" stroke="#10b981" strokeWidth={1.5} />
                <Line type="monotone" dataKey="operatingProfit" name="רווח תפעולי" stroke="#0ea5e9" strokeWidth={1.5} />
                <Line type="monotone" dataKey="netProfit" name="רווח נקי" stroke="#14b8a6" strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* גרף חדש - הכנסות vs הוצאות שיווק */}
          <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
              <h3 className="font-bold text-gray-800 text-xs">הכנסות vs הוצאות שיווק</h3>
            </div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 8 }} />
                <Tooltip 
                  formatter={(value: any) => formatCurrency(value)}
                  contentStyle={{ fontSize: '10px' }}
                />
                <Legend wrapperStyle={{ fontSize: '9px' }} />
                <Bar dataKey="revenue" name="הכנסות" fill="#10b981" />
                <Bar dataKey="marketing" name="שיווק" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HierarchicalReport;