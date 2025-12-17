// index.tsx - דוח P&L לחודש בודד עם סינון דינמי
// גרסה: 27/11/2025 - סינון דינמי של תנועות מתאפסות
// 🔧 תיקון: דפולט ללא מבוטלות (בלי localStorage)

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Download, ChevronDown, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';
import { 
  Transaction, 
  CategoryData, 
  AccountData, 
  VendorData, 
  SingleMonthSummary,
  BiurData
} from './SingleMonthPL__types';
import { filterCancellingTransactions, getCancelledKoterot } from '../../../utils/transactionFilter';
import { StatsCards } from './StatsCards';
import { CategoryRow } from './CategoryRow';
import { BiurModal } from './SingleMonthPL__BiurModal';
import { useMonthlyInventory } from '../../../hooks/useAdjustments';
import { useAllCategoryAdjustments } from '../../../hooks/useCategoryAdjustments';
import { InventoryInput } from '../../InventoryInput';
import { useSecureCSV } from '../../../hooks/useSecureCSV';

console.log('🟢 SingleMonthPL INDEX.TSX LOADED!');

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

const SingleMonthPLReport: React.FC = () => {
  const { csvData, loading: csvLoading, error: csvError } = useSecureCSV('TransactionMonthlyModi.csv');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [showBiurModal, setShowBiurModal] = useState(false);
  const [biurData, setBiurData] = useState<BiurData>({ title: '', transactions: [] });
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // 🔧 דפולט: ללא מבוטלות (false = מסונן) - בלי localStorage!
  const [showCancelled, setShowCancelled] = useState(false);

  // שנה נוכחית
  const selectedYear = 2025;

  // Hook למלאי חשבון 800
  const inventory800 = useMonthlyInventory(800, selectedYear, selectedMonth || 1);

  // טעינת התאמות מ-Supabase
  const { adjustments: adjustmentsFromSupabase, loading: adjLoading } = useAllCategoryAdjustments(selectedYear);

  // טעינת נתונים
  useEffect(() => {
    if (!csvData) return;

    const loadTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            try {
              const parsed: Transaction[] = (results as any).data
                .map((row: any) => ({
                  koteret: parseInt(row['כותרת']) || 0,
                  title: row['כותרת'] || '',
                  sortCode: row['קוד מיון'] ? parseInt(row['קוד מיון']) : null,
                  sortCodeName: row['שם קוד מיון'] || '',
                  accountKey: parseInt(row['מפתח חשבון']) || 0,
                  accountName: row['שם חשבון'] || '',
                  amount: parseFloat(row['חובה / זכות (שקל)']?.replace(/,/g, '') || '0'),
                  details: row['פרטים'] || '',
                  date: row['ת.אסמכ'] || '',
                  counterAccountName: row['שם חשבון נגדי'] || '',
                  counterAccountNumber: parseInt(row['ח-ן נגדי']) || 0,
                  // עמודות ספק ממופות
                  vendorKey: parseInt(row['ספק_מפתח']) || parseInt(row['ח-ן נגדי']) || 0,
                  vendorName: row['ספק_שם'] || row['שם חשבון נגדי'] || '',
                }))
                .filter((tx: Transaction) => tx.accountKey !== 0 && tx.date);
              
              setTransactions(parsed);
              setLoading(false);
            } catch (err) {
              console.error('Error parsing data:', err);
              setError('שגיאה בעיבוד הנתונים');
              setLoading(false);
            }
          },
          error: (err: any) => {
            console.error('Error parsing CSV:', err);
            setError('שגיאה בקריאת קובץ ה-CSV');
            setLoading(false);
          }
        });
      } catch (error: any) {
        console.error('Error loading transactions:', error);
        setError(error.message || 'שגיאה בטעינת הנתונים');
        setLoading(false);
      }
    };

    loadTransactions();
  }, [csvData]);

  // 🔥 סינון דינמי - מחשב פעם אחת את כל הכותרות המבוטלות
  const cancelledKoterot = useMemo(() => {
    if (!transactions.length) return new Set<number>();
    return getCancelledKoterot(transactions);
  }, [transactions]);

  // זיהוי חודשים זמינים
  const availableMonths = useMemo(() => {
    if (!transactions.length) return [];
    
    const months = Array.from(new Set(
      transactions
        .filter(tx => tx.date && tx.date.split('/').length === 3)
        .map(tx => parseInt(tx.date.split('/')[1]))
    )).sort((a, b) => a - b);

    if (selectedMonth === null && months.length > 0) {
      setSelectedMonth(months[0]);
    }

    return months;
  }, [transactions, selectedMonth]);

  // ספירת תנועות מבוטלות בחודש
  const cancelledCount = useMemo(() => {
    if (!transactions.length || selectedMonth === null) return 0;
    
    return transactions.filter(tx => {
      const txMonth = parseInt(tx.date.split('/')[1]);
      return txMonth === selectedMonth && cancelledKoterot.has(tx.koteret);
    }).length;
  }, [transactions, selectedMonth, cancelledKoterot]);

  // עיבוד נתונים לחודש הנבחר עם סינון
  const monthData = useMemo((): {
    categories: CategoryData[];
    summary: SingleMonthSummary;
    cancelledTransactions: Transaction[];
  } => {
    if (!transactions.length || selectedMonth === null) {
      return {
        categories: [],
        summary: {
          revenue: 0,
          cogs: 0,
          grossProfit: 0,
          operating: 0,
          operatingProfit: 0,
          financial: 0,
          netProfit: 0
        },
        cancelledTransactions: []
      };
    }

    // סינון תנועות לחודש הנבחר
    let monthTransactions = transactions.filter(tx => {
      const txMonth = parseInt(tx.date.split('/')[1]);
      return txMonth === selectedMonth;
    });

    // הפרדת תנועות מבוטלות (דינמי!)
    const cancelledTxs = monthTransactions.filter(tx => 
      cancelledKoterot.has(tx.koteret)
    );

    // 🔧 סינון תנועות מבוטלות אם showCancelled=false (דפולט)
    if (!showCancelled) {
      monthTransactions = monthTransactions.filter(tx => 
        !cancelledKoterot.has(tx.koteret)
      );
    }

    // פונקציה לעיבוד קטגוריה
    const processCategory = (
      code: number | string,
      type: 'income' | 'cogs' | 'operating' | 'financial',
      filterFn: (tx: Transaction) => boolean
    ): CategoryData => {
      const categoryTxs = monthTransactions.filter(filterFn);
      const sortCodeName = categoryTxs.length > 0 ? categoryTxs[0].sortCodeName : 
                          (typeof code === 'string' ? code : `קוד ${code}`);

      // קיבוץ לפי חשבון
      const accountGroups = _.groupBy(categoryTxs, tx => tx.accountKey);
      
      const accounts: AccountData[] = Object.entries(accountGroups).map(([accKey, accTxs]) => {
        // קיבוץ לפי ספק (משתמש בעמודות ממופות אם קיימות)
        const vendorGroups = _.groupBy(accTxs, tx => {
          const vKey = (tx as any).vendorKey || tx.counterAccountNumber || 0;
          const vName = (tx as any).vendorName || tx.counterAccountName || '';
          return `${vKey}|||${vName}`;
        });

        const vendors: VendorData[] = Object.entries(vendorGroups).map(([key, vendorTxs]) => {
          const [vKey, vName] = key.split('|||');
          const firstTx = vendorTxs[0] as Transaction;
          return {
            counterAccountNumber: firstTx?.counterAccountNumber || 0,
            counterAccountName: firstTx?.counterAccountName || '',
            vendorKey: parseInt(vKey) || 0,
            vendorName: vName || '',
            amount: _.sumBy(vendorTxs, 'amount'),
            transactions: vendorTxs
          };
        }).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

        return {
          accountKey: parseInt(accKey),
          accountName: accTxs[0]?.accountName || '',
          amount: _.sumBy(accTxs, 'amount'),
          vendors,
          transactions: accTxs
        };
      }).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

      return {
        code,
        name: sortCodeName,
        type,
        amount: _.sumBy(categoryTxs, 'amount'),
        accounts,
        transactions: categoryTxs
      };
    };

    // עיבוד קטגוריות
    const categories: CategoryData[] = [];

    // הכנסות (600)
    const income = processCategory(600, 'income', tx => tx.sortCode === 600);
    if (income.transactions.length > 0) categories.push(income);

    // עלות המכר (800)
    const cogs = processCategory(800, 'cogs', tx => tx.sortCode === 800);
    if (cogs.transactions.length > 0) categories.push(cogs);

    // הוצאות תפעול (801-899, לא כולל 800)
    const operatingSortCodes = [801, 802, 804, 805, 806, 811];
    operatingSortCodes.forEach(code => {
      const cat = processCategory(code, 'operating', tx => tx.sortCode === code);
      if (cat.transactions.length > 0) categories.push(cat);
    });

    // הוצאות מימון (813, 990, 991)
    const financialSortCodes = [813, 990, 991];
    financialSortCodes.forEach(code => {
      const cat = processCategory(code, 'financial', tx => tx.sortCode === code);
      if (cat.transactions.length > 0) categories.push(cat);
    });

    // חישוב סיכומים
    const revenue = categories.filter(c => c.type === 'income').reduce((sum, c) => sum + c.amount, 0);
    const cogsAmount = Math.abs(categories.filter(c => c.type === 'cogs').reduce((sum, c) => sum + c.amount, 0));
    const operatingAmount = Math.abs(categories.filter(c => c.type === 'operating').reduce((sum, c) => sum + c.amount, 0));
    const financialAmount = Math.abs(categories.filter(c => c.type === 'financial').reduce((sum, c) => sum + c.amount, 0));

    const grossProfit = revenue - cogsAmount;
    const operatingProfit = grossProfit - operatingAmount;
    const netProfit = operatingProfit - financialAmount;

    return {
      categories,
      summary: {
        revenue,
        cogs: cogsAmount,
        grossProfit,
        operating: operatingAmount,
        operatingProfit,
        financial: financialAmount,
        netProfit
      },
      cancelledTransactions: cancelledTxs
    };
  }, [transactions, selectedMonth, showCancelled, cancelledKoterot]);

  // קבלת התאמה לקטגוריה וחודש
  const getAdjustment = (sortCode: number): number => {
    if (!selectedMonth || !adjustmentsFromSupabase) return 0;
    return adjustmentsFromSupabase[sortCode]?.[selectedMonth] || 0;
  };

  // פונקציות עזר
  const formatCurrency = (amount: number): string => {
    const formatted = new Intl.NumberFormat('he-IL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
    
    if (amount < 0) {
      return `(${formatted}) ₪`;
    }
    return `${formatted} ₪`;
  };

  const handleShowBiur = (data: BiurData) => {
    setBiurData(data);
    setShowBiurModal(true);
  };

  const exportToCSV = () => {
    const rows = monthData.categories.flatMap(cat => 
      cat.accounts.flatMap(acc => 
        acc.transactions.map(tx => ({
          'קטגוריה': cat.name,
          'חשבון': acc.accountKey,
          'שם חשבון': acc.accountName,
          'תאריך': tx.date,
          'פרטים': tx.details,
          'סכום': tx.amount,
          'ח-ן נגדי': tx.counterAccountNumber,
          'שם ח-ן נגדי': tx.counterAccountName
        }))
      )
    );

    const csv = Papa.unparse(rows);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const monthName = selectedMonth ? MONTH_NAMES[selectedMonth - 1] : '';
    const filterStatus = showCancelled ? 'כולל_מבוטלות' : 'ללא_מבוטלות';
    link.download = `דוח_PL_${monthName}_2025_${filterStatus}.csv`;
    link.click();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        <p className="font-medium">שגיאה</p>
        <p>{error}</p>
      </div>
    );
  }

  const monthName = selectedMonth ? MONTH_NAMES[selectedMonth - 1] : '';

  return (
    <div className="p-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">
            דוח רווח והפסד - {monthName} 2025
          </h2>
          
          {/* Month Selector */}
          <div className="relative">
            <select
              value={selectedMonth || ''}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {MONTH_NAMES[month - 1]}
                </option>
              ))}
            </select>
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 🔧 Toggle מבוטלות - דפולט: ללא (ירוק) */}
          <button
            onClick={() => setShowCancelled(!showCancelled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
              showCancelled 
                ? 'bg-orange-100 border-orange-300 text-orange-700' 
                : 'bg-emerald-100 border-emerald-300 text-emerald-700'
            }`}
            title={showCancelled ? 'הסתר תנועות מבוטלות' : 'הצג תנועות מבוטלות'}
          >
            {showCancelled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {showCancelled ? 'כולל מבוטלות' : 'ללא מבוטלות'}
            </span>
            <span className="bg-white px-2 py-0.5 rounded text-xs font-bold">
              {cancelledCount}
            </span>
          </button>

          {/* Export */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>ייצוא CSV</span>
          </button>
        </div>
      </div>

      {/* Warning when showing cancelled */}
      {showCancelled && cancelledCount > 0 && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
          ⚠️ מוצגות {cancelledCount} תנועות מבוטלות. הסכומים כוללים תנועות שמבטלות זו את זו.
        </div>
      )}

      {/* Stats Cards */}
      <StatsCards summary={monthData.summary} formatCurrency={formatCurrency} />

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-3 text-right font-bold sticky right-0 bg-gray-100">
                קטגוריה / פריט
              </th>
              <th className="border border-gray-300 px-4 py-3 text-center font-bold w-40">
                סכום
              </th>
              <th className="border border-gray-300 px-4 py-3 text-center font-bold w-24">
                % מהכנסות
              </th>
              <th className="border border-gray-300 px-4 py-3 text-center font-bold w-16">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody>
            {/* הכנסות */}
            {monthData.categories.filter(c => c.type === 'income').map(cat => (
              <CategoryRow
                key={cat.code}
                category={cat}
                onShowBiur={handleShowBiur}
                formatCurrency={formatCurrency}
                monthName={monthName}
                totalRevenue={monthData.summary.revenue}
              />
            ))}
            
            {/* סה"כ הכנסות */}
            <tr className="bg-green-100 font-bold">
              <td className="border border-gray-300 px-4 py-2 sticky right-0 bg-green-100">
                סה"כ הכנסות
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center text-green-700">
                {formatCurrency(monthData.summary.revenue)}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">100%</td>
              <td className="border border-gray-300"></td>
            </tr>

            {/* עלות המכר */}
            {monthData.categories.filter(c => c.type === 'cogs').map(cat => {
              const adjustment = getAdjustment(Number(cat.code));
              const adjustedAmount = Math.abs(cat.amount) - adjustment;
              return (
                <React.Fragment key={cat.code}>
                  <CategoryRow
                    category={cat}
                    onShowBiur={handleShowBiur}
                    formatCurrency={formatCurrency}
                    monthName={monthName}
                    totalRevenue={monthData.summary.revenue}
                  />
                  {adjustment !== 0 && (
                    <tr className="bg-yellow-50">
                      <td className="border border-gray-300 px-4 py-2 pr-8 text-sm text-gray-600">
                        התאמה {cat.code}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-orange-700">
                        {formatCurrency(-adjustment)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                        {monthData.summary.revenue > 0
                          ? (-adjustment / monthData.summary.revenue * 100).toFixed(1)
                          : 0}%
                      </td>
                      <td className="border border-gray-300"></td>
                    </tr>
                  )}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="border border-gray-300 px-4 py-2 pr-8">
                      סה"כ {cat.code} מעודכן
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {formatCurrency(-adjustedAmount)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {monthData.summary.revenue > 0
                        ? (adjustedAmount / monthData.summary.revenue * 100).toFixed(1)
                        : 0}%
                    </td>
                    <td className="border border-gray-300"></td>
                  </tr>
                </React.Fragment>
              );
            })}

            {/* מלאי - חשבון 800 */}
            console.log('🔵 selectedMonth:', selectedMonth, 'inventory800:', inventory800);
            {selectedMonth && (
              <tr>
                <td colSpan={4} className="border border-gray-300 px-4 py-3">
                  <InventoryInput
                    accountKey={800}
                    accountName="עלות המכר"
                    year={selectedYear}
                    month={selectedMonth}
                    openingValue={inventory800.opening}
                    closingValue={inventory800.closing}
                    onSaveOpening={inventory800.updateOpening}
                    onSaveClosing={inventory800.updateClosing}
                    saving={inventory800.saving}
                  />
                </td>
              </tr>
            )}

            {/* רווח גולמי */}
            <tr className="bg-emerald-100 font-bold">
              <td className="border border-gray-300 px-4 py-2 sticky right-0 bg-emerald-100">
                רווח גולמי
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center text-emerald-700">
                {formatCurrency(monthData.summary.grossProfit)}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                {monthData.summary.revenue > 0 
                  ? (monthData.summary.grossProfit / monthData.summary.revenue * 100).toFixed(1) 
                  : 0}%
              </td>
              <td className="border border-gray-300"></td>
            </tr>

            {/* הוצאות תפעול */}
            {monthData.categories.filter(c => c.type === 'operating').map(cat => {
              const adjustment = getAdjustment(Number(cat.code));
              const adjustedAmount = Math.abs(cat.amount) - adjustment;
              return (
                <React.Fragment key={cat.code}>
                  <CategoryRow
                    category={cat}
                    onShowBiur={handleShowBiur}
                    formatCurrency={formatCurrency}
                    monthName={monthName}
                    totalRevenue={monthData.summary.revenue}
                  />
                  {adjustment !== 0 && (
                    <tr className="bg-yellow-50">
                      <td className="border border-gray-300 px-4 py-2 pr-8 text-sm text-gray-600">
                        התאמה {cat.code}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-orange-700">
                        {formatCurrency(-adjustment)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-sm">
                        {monthData.summary.revenue > 0
                          ? (-adjustment / monthData.summary.revenue * 100).toFixed(1)
                          : 0}%
                      </td>
                      <td className="border border-gray-300"></td>
                    </tr>
                  )}
                  <tr className="bg-gray-50 font-semibold">
                    <td className="border border-gray-300 px-4 py-2 pr-8">
                      סה"כ {cat.code} מעודכן
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {formatCurrency(-adjustedAmount)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {monthData.summary.revenue > 0
                        ? (adjustedAmount / monthData.summary.revenue * 100).toFixed(1)
                        : 0}%
                    </td>
                    <td className="border border-gray-300"></td>
                  </tr>
                </React.Fragment>
              );
            })}

            {/* רווח תפעולי */}
            <tr className="bg-teal-100 font-bold">
              <td className="border border-gray-300 px-4 py-2 sticky right-0 bg-teal-100">
                רווח תפעולי
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center text-teal-700">
                {formatCurrency(monthData.summary.operatingProfit)}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                {monthData.summary.revenue > 0 
                  ? (monthData.summary.operatingProfit / monthData.summary.revenue * 100).toFixed(1) 
                  : 0}%
              </td>
              <td className="border border-gray-300"></td>
            </tr>

            {/* הוצאות מימון */}
            {monthData.categories.filter(c => c.type === 'financial').map(cat => (
              <CategoryRow
                key={cat.code}
                category={cat}
                onShowBiur={handleShowBiur}
                formatCurrency={formatCurrency}
                monthName={monthName}
                totalRevenue={monthData.summary.revenue}
              />
            ))}

            {/* רווח נקי */}
            <tr className="bg-cyan-100 font-bold text-lg">
              <td className="border border-gray-300 px-4 py-3 sticky right-0 bg-cyan-100">
                🎯 רווח נקי
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center text-cyan-700">
                {formatCurrency(monthData.summary.netProfit)}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-center">
                {monthData.summary.revenue > 0 
                  ? (monthData.summary.netProfit / monthData.summary.revenue * 100).toFixed(1) 
                  : 0}%
              </td>
              <td className="border border-gray-300"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Biur Modal */}
      <BiurModal
        isOpen={showBiurModal}
        data={biurData}
        onClose={() => setShowBiurModal(false)}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default SingleMonthPLReport;