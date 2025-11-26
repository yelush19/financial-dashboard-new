// SingleMonthPLReport.tsx - דוח P&L חודשי עם 3 רמות drill-down

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Download, TrendingUp } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';
import { Transaction, CategoryData, AccountData, VendorData, MonthlyData, ProcessedMonthlyData } from './types';
import { CategoryRow } from './CategoryRow';
import { BiurModal } from './BiurModal';

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

const LITAY_COLORS = {
  primary: '#528163',
  primaryDark: '#2d5f3f',
  primaryLight: '#8dd1bb',
  darkGreen: '#17320b',
};

const SingleMonthPLReport: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [showBiurModal, setShowBiurModal] = useState(false);
  const [biurData, setBiurData] = useState<{ title: string; transactions: Transaction[] }>({
    title: '',
    transactions: []
  });

  // טעינת נתונים
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/TransactionMonthlyModi.csv');
        
        if (!response.ok) {
          throw new Error('שגיאה בטעינת הקובץ');
        }

        const text = await response.text();
        
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const parsed: Transaction[] = (results as any).data
              .map((row: any) => ({
                sortCode: row['קוד מיון'] ? parseInt(row['קוד מיון']) : null,
                sortCodeName: row['שם קוד מיון'] || '',
                accountKey: parseInt(row['מפתח חשבון']) || 0,
                accountName: row['שם חשבון'] || '',
                amount: parseFloat(row['חובה / זכות (שקל)']?.replace(/,/g, '') || '0'),
                details: row['פרטים'] || '',
                date: row['ת.אסמכ'] || '',
                counterAccountName: row['שם חשבון נגדי'] || '',
                counterAccountNumber: parseInt(row['ח-ן נגדי']) || 0,
              }))
              .filter((tx: Transaction) => tx.accountKey !== 0 && tx.date);
            
            setTransactions(parsed);
            
            // בחירה אוטומטית של החודש הראשון
            const uniqueMonths = Array.from(new Set(
              parsed.map(tx => parseInt(tx.date.split('/')[1]))
            )).sort((a, b) => a - b);
            
            if (uniqueMonths.length > 0 && !selectedMonth) {
              setSelectedMonth(uniqueMonths[0]);
            }
            
            setLoading(false);
          },
          error: () => {
            setError('שגיאה בקריאת הקובץ');
            setLoading(false);
          }
        });
      } catch (err) {
        setError('שגיאה בטעינת הנתונים');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // עיבוד נתונים לפי החודש הנבחר
  const monthlyData = useMemo((): ProcessedMonthlyData | null => {
    if (!transactions.length || !selectedMonth) return null;

    // סינון תנועות לפי החודש הנבחר
    const monthTransactions = transactions.filter(tx => {
      const txMonth = parseInt(tx.date.split('/')[1]);
      return txMonth === selectedMonth;
    });

    // פונקציה לעיבוד קטגוריה - 3 רמות היררכיה
    const processCategory = (
      code: number | string,
      type: 'income' | 'cogs' | 'operating' | 'financial',
      filterFn: (tx: Transaction) => boolean
    ): CategoryData => {
      const categoryTxs = monthTransactions.filter(filterFn);
      
      const sortCodeName = categoryTxs.length > 0 
        ? categoryTxs[0].sortCodeName 
        : (typeof code === 'string' ? code : `קוד ${code}`);

      // רמה 2: קיבוץ לפי חשבון (accountKey)
      const accountGroups = _.groupBy(categoryTxs, tx => {
        return `${tx.accountKey}|||${tx.accountName}`;
      });

      const accounts: AccountData[] = Object.entries(accountGroups)
        .map(([key, txs]) => {
          const [accountKeyStr, accountName] = key.split('|||');
          const accountKey = parseInt(accountKeyStr);

          // רמה 3: קיבוץ לפי ספק (counterAccountNumber)
          const vendorGroups = _.groupBy(txs, tx => {
            return `${tx.counterAccountNumber}|||${tx.counterAccountName}`;
          });

          const vendors: VendorData[] = Object.entries(vendorGroups)
            .map(([vendorKey, vendorTxs]) => {
              const [counterNumStr, counterName] = vendorKey.split('|||');
              const counterNum = parseInt(counterNumStr) || 0;

              const vendorData: MonthlyData = { total: 0 };
              vendorData[selectedMonth] = 0;

              (vendorTxs as Transaction[]).forEach(tx => {
                vendorData[selectedMonth] += tx.amount;
                vendorData.total += tx.amount;
              });

              return {
                counterAccountNumber: counterNum,
                counterAccountName: counterName || 'לא ידוע',
                data: vendorData,
                transactions: vendorTxs as Transaction[]
              };
            })
            .filter(v => v.data.total !== 0)
            .sort((a, b) => Math.abs(b.data.total) - Math.abs(a.data.total));

          // חישוב סכום החשבון
          const accountData: MonthlyData = { total: 0 };
          accountData[selectedMonth] = 0;
          
          (txs as Transaction[]).forEach(tx => {
            accountData[selectedMonth] += tx.amount;
            accountData.total += tx.amount;
          });

          return {
            accountKey,
            accountName: accountName || 'לא ידוע',
            data: accountData,
            vendors,
            transactions: txs as Transaction[]
          };
        })
        .filter(acc => acc.data.total !== 0)
        .sort((a, b) => Math.abs(b.data.total) - Math.abs(a.data.total));

      // חישוב סכום הקטגוריה
      const categoryData: MonthlyData = { total: 0 };
      categoryData[selectedMonth] = 0;
      
      categoryTxs.forEach(tx => {
        categoryData[selectedMonth] += tx.amount;
        categoryData.total += tx.amount;
      });

      return {
        code,
        name: sortCodeName,
        type,
        data: categoryData,
        accounts
      };
    };

    // יצירת כל הקטגוריות
    const income_site = processCategory('income_site', 'income', 
      tx => tx.sortCode === 600 && tx.accountKey >= 40000 && tx.accountKey < 40020
    );
    const income_superpharm = processCategory('income_superpharm', 'income',
      tx => tx.sortCode === 600 && tx.accountKey >= 40020
    );

    const cogs800 = processCategory(800, 'cogs', tx => tx.sortCode === 800);
    const cogs806 = processCategory(806, 'cogs', tx => tx.sortCode === 806);

    const op801 = processCategory(801, 'operating', tx => tx.sortCode === 801);
    const op802 = processCategory(802, 'operating', tx => tx.sortCode === 802);
    const op804 = processCategory(804, 'operating', tx => tx.sortCode === 804);
    const op805 = processCategory(805, 'operating', tx => tx.sortCode === 805);
    const op811 = processCategory(811, 'operating', tx => tx.sortCode === 811);

    const fin813 = processCategory(813, 'financial', tx => tx.sortCode === 813);
    const fin990 = processCategory(990, 'financial', tx => tx.sortCode === 990);
    const fin991 = processCategory(991, 'financial', tx => tx.sortCode === 991);

    const categories: CategoryData[] = [
      { ...income_site, name: income_site.name || 'הכנסות מכירות - אתר' },
      { ...income_superpharm, name: income_superpharm.name || 'הכנסות מכירות - סופרפארם' },
      cogs800,
      cogs806,
      op801,
      op802,
      op804,
      op805,
      op811,
      fin813,
      fin990,
      fin991,
    ];

    // חישוב סיכומים
    const revenue = categories
      .filter(c => c.type === 'income')
      .reduce((sum, c) => sum + (c.data[selectedMonth] || 0), 0);

    const cogs = categories
      .filter(c => c.type === 'cogs')
      .reduce((sum, c) => sum + (c.data[selectedMonth] || 0), 0);

    const operating = categories
      .filter(c => c.type === 'operating')
      .reduce((sum, c) => sum + (c.data[selectedMonth] || 0), 0);

    const financial = categories
      .filter(c => c.type === 'financial')
      .reduce((sum, c) => sum + (c.data[selectedMonth] || 0), 0);

    const grossProfit = revenue + cogs;
    const operatingProfit = grossProfit + operating;
    const netProfit = operatingProfit + financial;

    return {
      month: selectedMonth,
      categories,
      totals: {
        revenue,
        cogs: Math.abs(cogs),
        grossProfit,
        operating: Math.abs(operating),
        operatingProfit,
        financial: Math.abs(financial),
        netProfit
      }
    };
  }, [transactions, selectedMonth]);

  // פורמט מטבע
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // הצגת ביאור
  const handleShowBiur = (transactions: Transaction[], title: string) => {
    setBiurData({ title, transactions });
    setShowBiurModal(true);
  };

  // חודשים זמינים
  const availableMonths = useMemo(() => {
    return Array.from(new Set(
      transactions.map(tx => parseInt(tx.date.split('/')[1]))
    )).sort((a, b) => a - b);
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-medium">{error}</p>
      </div>
    );
  }

  if (!monthlyData) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">אין נתונים להצגה</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* כותרת + בורר חודש */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8" style={{ color: LITAY_COLORS.primary }} />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">דוח רווח והפסד - תצוגת חודש</h2>
            <p className="text-sm text-gray-600 mt-1">מבנה 3 רמות: קטגוריה → חשבון → ספק</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-gray-600" />
          <select
            value={selectedMonth || ''}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-4 py-2 border-2 rounded-lg font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            style={{ borderColor: LITAY_COLORS.primary }}
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>
                {MONTH_NAMES[m - 1]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* כרטיסי סיכום */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="text-sm text-gray-600 mb-1">💰 הכנסות</div>
          <div className="text-2xl font-bold text-green-700">
            {formatCurrency(monthlyData.totals.revenue)}
          </div>
        </div>

        <div className="p-4 rounded-lg border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <div className="text-sm text-gray-600 mb-1">📦 עלות המכר</div>
          <div className="text-2xl font-bold text-orange-700">
            {formatCurrency(monthlyData.totals.cogs)}
          </div>
        </div>

        <div className="p-4 rounded-lg border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <div className="text-sm text-gray-600 mb-1">💼 רווח תפעולי</div>
          <div className="text-2xl font-bold text-emerald-700">
            {formatCurrency(monthlyData.totals.operatingProfit)}
          </div>
        </div>

        <div className="p-4 rounded-lg border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
          <div className="text-sm text-gray-600 mb-1">✨ רווח נקי</div>
          <div className="text-2xl font-bold text-teal-700">
            {formatCurrency(monthlyData.totals.netProfit)}
          </div>
        </div>
      </div>

      {/* טבלה */}
      <div className="bg-white rounded-lg border-2 shadow-lg overflow-hidden" style={{ borderColor: LITAY_COLORS.primary }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-emerald-50 to-teal-50">
              <tr>
                <th className="border border-gray-300 px-4 py-3 text-right font-bold text-gray-800 min-w-[400px]">
                  קטגוריה / חשבון / ספק
                </th>
                <th className="border border-gray-300 px-3 py-3 text-center font-bold text-gray-800 w-40">
                  {MONTH_NAMES[(selectedMonth || 1) - 1]}
                </th>
                <th className="border border-gray-300 px-3 py-3 text-center font-bold text-gray-800 w-32">
                  פירוט
                </th>
              </tr>
            </thead>
            <tbody>
              {/* הכנסות */}
              <tr className="bg-green-100">
                <td colSpan={3} className="border border-gray-300 px-4 py-3">
                  <div className="font-bold text-lg text-green-800">💰 הכנסות</div>
                </td>
              </tr>
              {monthlyData.categories
                .filter(c => c.type === 'income')
                .map((cat, idx) => (
                  <CategoryRow
                    key={idx}
                    category={cat}
                    month={monthlyData.month}
                    onShowBiur={handleShowBiur}
                    formatCurrency={formatCurrency}
                  />
                ))}
              
              <tr className="bg-green-50 border-2 border-green-400">
                <td className="border border-gray-300 px-4 py-3 font-bold text-green-800">
                  סה"כ הכנסות
                </td>
                <td className="border border-gray-300 px-3 py-3 text-center font-bold text-green-700 text-lg">
                  {formatCurrency(monthlyData.totals.revenue)}
                </td>
                <td className="border border-gray-300"></td>
              </tr>

              {/* עלות המכר */}
              <tr className="bg-orange-100">
                <td colSpan={3} className="border border-gray-300 px-4 py-3">
                  <div className="font-bold text-lg text-orange-800">📦 עלות המכר</div>
                </td>
              </tr>
              {monthlyData.categories
                .filter(c => c.type === 'cogs')
                .map((cat, idx) => (
                  <CategoryRow
                    key={idx}
                    category={cat}
                    month={monthlyData.month}
                    onShowBiur={handleShowBiur}
                    formatCurrency={formatCurrency}
                  />
                ))}

              <tr className="bg-orange-50 border-2 border-orange-400">
                <td className="border border-gray-300 px-4 py-3 font-bold text-orange-800">
                  סה"כ עלות המכר
                </td>
                <td className="border border-gray-300 px-3 py-3 text-center font-bold text-orange-700 text-lg">
                  {formatCurrency(monthlyData.totals.cogs)}
                </td>
                <td className="border border-gray-300"></td>
              </tr>

              <tr className="bg-green-50 border-2 border-green-400">
                <td className="border border-gray-300 px-4 py-3 font-bold text-green-800">
                  💚 רווח גולמי
                </td>
                <td className="border border-gray-300 px-3 py-3 text-center font-bold text-green-700 text-lg">
                  {formatCurrency(monthlyData.totals.grossProfit)}
                </td>
                <td className="border border-gray-300"></td>
              </tr>

              {/* הוצאות תפעול */}
              <tr className="bg-gray-100">
                <td colSpan={3} className="border border-gray-300 px-4 py-3">
                  <div className="font-bold text-lg text-gray-800">🏢 הוצאות תפעול</div>
                </td>
              </tr>
              {monthlyData.categories
                .filter(c => c.type === 'operating')
                .map((cat, idx) => (
                  <CategoryRow
                    key={idx}
                    category={cat}
                    month={monthlyData.month}
                    onShowBiur={handleShowBiur}
                    formatCurrency={formatCurrency}
                  />
                ))}

              <tr className="bg-gray-50 border-2 border-gray-400">
                <td className="border border-gray-300 px-4 py-3 font-bold text-gray-800">
                  סה"כ הוצאות תפעול
                </td>
                <td className="border border-gray-300 px-3 py-3 text-center font-bold text-gray-700 text-lg">
                  {formatCurrency(monthlyData.totals.operating)}
                </td>
                <td className="border border-gray-300"></td>
              </tr>

              <tr className="bg-emerald-50 border-2 border-emerald-400">
                <td className="border border-gray-300 px-4 py-3 font-bold text-emerald-800">
                  💼 רווח תפעולי
                </td>
                <td className="border border-gray-300 px-3 py-3 text-center font-bold text-emerald-700 text-xl">
                  {formatCurrency(monthlyData.totals.operatingProfit)}
                </td>
                <td className="border border-gray-300"></td>
              </tr>

              {/* הוצאות מימון */}
              <tr className="bg-slate-100">
                <td colSpan={3} className="border border-gray-300 px-4 py-3">
                  <div className="font-bold text-lg text-slate-800">💳 הוצאות מימון</div>
                </td>
              </tr>
              {monthlyData.categories
                .filter(c => c.type === 'financial')
                .map((cat, idx) => (
                  <CategoryRow
                    key={idx}
                    category={cat}
                    month={monthlyData.month}
                    onShowBiur={handleShowBiur}
                    formatCurrency={formatCurrency}
                  />
                ))}

              <tr className="bg-slate-50 border-2 border-slate-400">
                <td className="border border-gray-300 px-4 py-3 font-bold text-slate-800">
                  סה"כ הוצאות מימון
                </td>
                <td className="border border-gray-300 px-3 py-3 text-center font-bold text-slate-700 text-lg">
                  {formatCurrency(monthlyData.totals.financial)}
                </td>
                <td className="border border-gray-300"></td>
              </tr>

              <tr className="bg-teal-100 border-4 border-teal-500">
                <td className="border border-gray-300 px-4 py-4 font-bold text-teal-900 text-xl">
                  ✨ רווח נקי
                </td>
                <td className="border border-gray-300 px-3 py-4 text-center font-bold text-teal-800 text-2xl">
                  {formatCurrency(monthlyData.totals.netProfit)}
                </td>
                <td className="border border-gray-300"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* BiurModal */}
      <BiurModal
        isOpen={showBiurModal}
        title={biurData.title}
        transactions={biurData.transactions}
        onClose={() => setShowBiurModal(false)}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default SingleMonthPLReport;
