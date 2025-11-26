// index.tsx - דוח P&L לחודש בודד - גרסה משודרגת
// ✅ צבעי LITAY
// ✅ הכנסות ללא drill-down
// ✅ מלאי + התאמות 2024
// ✅ כותרת מעודכנת

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Download, ChevronDown, ChevronLeft, Edit, Save, Calculator } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';
import { 
  Transaction, 
  CategoryData, 
  AccountData, 
  VendorData, 
  SingleMonthSummary,
  BiurData,
  Inventory,
  Adjustments2024
} from './types';
import { LITAY_COLORS, MONTH_NAMES, REPORT_CONFIG, STORAGE_KEYS } from './constants';
import { StatsCards } from './StatsCards';
import { CategoryRow } from './CategoryRow';
import { BiurModal } from './BiurModal';
import { InventoryRow } from './InventoryRow';
import { AdjustmentRow } from './AdjustmentRow';
import { InventoryEditorModal } from './InventoryEditorModal';
import { AdjustmentsEditorModal } from './AdjustmentsEditorModal';
import { InventoryBackupControls } from './InventoryBackupControls';

declare global {
  interface Window {
    wixWindow?: {
      backend?: {
        saveInventory: (opening: string, closing: string) => Promise<any>;
        loadInventory: () => Promise<any>;
        saveAdjustments: (adjustments: string) => Promise<any>;
        loadAdjustments: () => Promise<any>;
      };
    };
  }
}

const SingleMonthPLReport: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [showBiurModal, setShowBiurModal] = useState(false);
  const [biurData, setBiurData] = useState<BiurData>({ title: '', transactions: [] });
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  
  // מלאי והתאמות
  const [openingInventory, setOpeningInventory] = useState<Inventory>({});
  const [closingInventory, setClosingInventory] = useState<Inventory>({});
  const [adjustments2024, setAdjustments2024] = useState<Adjustments2024>({});
  const [showInventoryEditor, setShowInventoryEditor] = useState(false);
  const [showAdjustmentsEditor, setShowAdjustmentsEditor] = useState(false);

  // טעינת נתונים
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(REPORT_CONFIG.CSV_FILE_PATH);
        if (!response.ok) {
          throw new Error(`שגיאה בטעינת הקובץ: ${response.status}`);
        }

        const text = await response.text();
        
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            try {
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

    const loadInventoryData = async () => {
      try {
        const wixData = await window.wixWindow?.backend?.loadInventory();
        if (wixData?.opening) setOpeningInventory(JSON.parse(wixData.opening));
        if (wixData?.closing) setClosingInventory(JSON.parse(wixData.closing));
        
        const wixAdj = await window.wixWindow?.backend?.loadAdjustments();
        if (wixAdj?.adjustments) setAdjustments2024(JSON.parse(wixAdj.adjustments));
      } catch (error) {
        console.log('Wix load failed, using localStorage:', error);
        
        const savedOpeningInv = localStorage.getItem(STORAGE_KEYS.OPENING_INVENTORY);
        const savedClosingInv = localStorage.getItem(STORAGE_KEYS.CLOSING_INVENTORY);
        const savedAdjustments = localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS_2024);
        
        if (savedOpeningInv) setOpeningInventory(JSON.parse(savedOpeningInv));
        if (savedClosingInv) setClosingInventory(JSON.parse(savedClosingInv));
        if (savedAdjustments) setAdjustments2024(JSON.parse(savedAdjustments));
      }
    };

    loadTransactions();
    loadInventoryData();
  }, []);

  // זיהוי חודשים זמינים
  const availableMonths = useMemo(() => {
    if (!transactions.length) return [];
    
    const months = Array.from(new Set(
      transactions
        .filter(tx => tx.date && tx.date.split('/').length === 3)
        .map(tx => parseInt(tx.date.split('/')[1]))
    )).sort((a, b) => a - b);

    // בחירה אוטומטית של החודש הראשון
    if (selectedMonth === null && months.length > 0) {
      setSelectedMonth(months[0]);
    }

    return months;
  }, [transactions, selectedMonth]);

  // פונקציה לקבלת ערך התאמה
  const getAdjustmentValue = (categoryCode: string, month: number): number => {
    const val = adjustments2024[categoryCode]?.[month];
    if (val === undefined || val === '') return 0;
    return typeof val === 'number' ? val : parseFloat(String(val)) || 0;
  };

  // עיבוד נתונים לחודש הנבחר
  const monthData = useMemo((): {
    categories: CategoryData[];
    summary: SingleMonthSummary;
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
        }
      };
    }

    // סינון תנועות לחודש הנבחר
    const monthTransactions = transactions.filter(tx => {
      const txMonth = parseInt(tx.date.split('/')[1]);
      return txMonth === selectedMonth;
    });

    // פונקציה לעיבוד קטגוריה
    const processCategory = (
      code: number | string,
      type: 'income' | 'cogs' | 'operating' | 'financial',
      filterFn: (tx: Transaction) => boolean
    ): CategoryData => {
      const categoryTxs = monthTransactions.filter(filterFn);
      const sortCodeName = categoryTxs.length > 0 ? categoryTxs[0].sortCodeName : 
                          (typeof code === 'string' ? code : `קוד ${code}`);

      // הכנסות: ללא drill-down, שאר הקטגוריות: עם drill-down
      let accounts: AccountData[] = [];
      
      if (type !== 'income') {
        // קיבוץ לפי חשבון (accountKey) - רמה 2
        const accountGroups = _.groupBy(categoryTxs, tx => 
          `${tx.accountKey}|||${tx.accountName}`
        );

        accounts = Object.entries(accountGroups)
          .map(([key, txs]) => {
            const [accountKey, accountName] = key.split('|||');
            
            // קיבוץ לפי ספק (counterAccountNumber) - רמה 3
            const vendorGroups = _.groupBy(txs, tx =>
              `${tx.counterAccountNumber}|||${tx.counterAccountName}`
            );

            const vendors: VendorData[] = Object.entries(vendorGroups)
              .map(([vKey, vTxs]) => {
                const [counterNum, counterName] = vKey.split('|||');
                const vendorAmount = (vTxs as Transaction[]).reduce((sum, tx) => sum + tx.amount, 0);
                
                return {
                  counterAccountNumber: parseInt(counterNum) || 0,
                  counterAccountName: counterName || 'לא ידוע',
                  amount: vendorAmount,
                  transactions: vTxs as Transaction[]
                };
              })
              .filter(v => v.amount !== 0)
              .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

            const accountAmount = (txs as Transaction[]).reduce((sum, tx) => sum + tx.amount, 0);

            return {
              accountKey: parseInt(accountKey) || 0,
              accountName: accountName || 'לא ידוע',
              amount: accountAmount,
              vendors,
              transactions: txs as Transaction[]
            };
          })
          .filter(a => a.amount !== 0)
          .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
      }

      const totalAmount = categoryTxs.reduce((sum, tx) => sum + tx.amount, 0);

      return {
        code,
        name: sortCodeName,
        type,
        amount: totalAmount,
        accounts,
        transactions: categoryTxs
      };
    };

    // עיבוד כל הקטגוריות
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
      income_site,
      income_superpharm,
      cogs800,
      cogs806,
      op801,
      op802,
      op804,
      op805,
      op811,
      fin813,
      fin990,
      fin991
    ].filter(c => c.amount !== 0 || c.type === 'income'); // השאר הכנסות גם אם 0

    // חישוב סיכומים
    const revenue = income_site.amount + income_superpharm.amount;
    const cogs = cogs800.amount + cogs806.amount;
    const grossProfit = revenue + cogs; // cogs is negative
    const operating = op801.amount + op802.amount + op804.amount + op805.amount + op811.amount;
    const operatingProfit = grossProfit + operating;
    const financial = fin813.amount + fin990.amount + fin991.amount;
    const netProfit = operatingProfit + financial;

    return {
      categories,
      summary: {
        revenue,
        cogs,
        grossProfit,
        operating,
        operatingProfit,
        financial,
        netProfit
      }
    };
  }, [transactions, selectedMonth]);

  // המשך בחלק הבא...
  // פורמט מטבע
  const formatCurrency = (amount: number): string => {
    const formatted = new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));

    return amount < 0 ? `(${formatted})` : formatted;
  };

  // הצגת ביאור
  const showBiur = (data: BiurData) => {
    setBiurData(data);
    setShowBiurModal(true);
  };

  // טוגל סקציות
  const toggleSection = (section: string) => {
    const newSet = new Set(collapsedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setCollapsedSections(newSet);
  };

  // שמירת מלאי
  const saveInventory = async () => {
    try {
      const openingStr = JSON.stringify(openingInventory);
      const closingStr = JSON.stringify(closingInventory);
      
      await window.wixWindow?.backend?.saveInventory(openingStr, closingStr);
      localStorage.setItem(STORAGE_KEYS.OPENING_INVENTORY, openingStr);
      localStorage.setItem(STORAGE_KEYS.CLOSING_INVENTORY, closingStr);
      
      alert('המלאי נשמר בהצלחה!');
    } catch (error) {
      console.error('Error saving inventory:', error);
      alert('שגיאה בשמירת המלאי');
    }
  };

  // שמירת התאמות
  const saveAdjustments = async (adjustments: Adjustments2024) => {
    try {
      const adjStr = JSON.stringify(adjustments);
      await window.wixWindow?.backend?.saveAdjustments(adjStr);
      localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS_2024, adjStr);
      setAdjustments2024(adjustments);
    } catch (error) {
      console.error('Error saving adjustments:', error);
    }
  };

  // ייצוא CSV
  const handleExport = () => {
    if (!selectedMonth) return;

    const monthName = MONTH_NAMES[selectedMonth - 1];
    let csvContent = `דוח רווח והפסד - ${monthName}\n\n`;
    
    csvContent += `קטגוריה,סכום\n`;
    monthData.categories.forEach(cat => {
      const displayCode = typeof cat.code === 'number' ? cat.code : 
                         cat.code === 'income_site' ? '600-אתר' :
                         cat.code === 'income_superpharm' ? '600-סופרפארם' : '600';
      csvContent += `"${displayCode} - ${cat.name}","${formatCurrency(cat.amount)}"\n`;
      
      if (cat.type !== 'income') {
        cat.accounts.forEach(acc => {
          csvContent += `"  ${acc.accountKey} - ${acc.accountName}","${formatCurrency(acc.amount)}"\n`;
          
          acc.vendors.forEach(vendor => {
            csvContent += `"    ${vendor.counterAccountName}","${formatCurrency(vendor.amount)}"\n`;
          });
        });
      }
    });

    csvContent += `\nסיכום:\n`;
    csvContent += `הכנסות,"${formatCurrency(monthData.summary.revenue)}"\n`;
    csvContent += `עלות מכר,"${formatCurrency(monthData.summary.cogs)}"\n`;
    csvContent += `רווח גולמי,"${formatCurrency(monthData.summary.grossProfit)}"\n`;
    csvContent += `הוצאות תפעול,"${formatCurrency(monthData.summary.operating)}"\n`;
    csvContent += `רווח תפעולי,"${formatCurrency(monthData.summary.operatingProfit)}"\n`;
    csvContent += `הוצאות מימון,"${formatCurrency(monthData.summary.financial)}"\n`;
    csvContent += `רווח נקי,"${formatCurrency(monthData.summary.netProfit)}"\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `PL_Report_${monthName}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
               style={{ borderColor: LITAY_COLORS.primary }}></div>
          <p className="text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 font-semibold mb-2">שגיאה בטעינת הנתונים</p>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (availableMonths.length === 0) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-700 font-semibold">לא נמצאו נתונים</p>
      </div>
    );
  }

  const monthName = selectedMonth ? MONTH_NAMES[selectedMonth - 1] : '';

  return (
    <div className="space-y-6" dir="rtl">
      {/* כותרת + כפתורים */}
      <div 
        className="rounded-lg p-4 shadow-lg" 
        style={{ 
          background: `linear-gradient(135deg, ${LITAY_COLORS.primary} 0%, ${LITAY_COLORS.primaryDark} 100%)`
        }}
      >
        <div className="flex items-center justify-between">
          {/* כותרת + בורר חודש */}
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">דוח רווח והפסד - חודש</h2>
            <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <Calendar className="w-5 h-5 text-white" />
              <select
                value={selectedMonth || ''}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-transparent border-none outline-none font-medium text-white cursor-pointer"
                style={{ color: 'white', fontWeight: 'bold' }}
              >
                {availableMonths.map(m => (
                  <option key={m} value={m} style={{ color: '#000' }}>{MONTH_NAMES[m - 1]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* כפתורים */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInventoryEditor(true)}
              className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 flex items-center gap-2 transition-all"
            >
              <Edit className="w-4 h-4" />
              ערוך מלאי
            </button>
            <button
              onClick={() => setShowAdjustmentsEditor(true)}
              className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 flex items-center gap-2 transition-all"
            >
              <Calculator className="w-4 h-4" />
              עדכוני 2024
            </button>
            <button
              onClick={saveInventory}
              className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              שמור מלאי
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              ייצא CSV
            </button>
          </div>
        </div>
      </div>

      {/* גיבוי מלאי */}
      <InventoryBackupControls
        openingInventory={openingInventory}
        closingInventory={closingInventory}
        onImport={(opening, closing) => {
          setOpeningInventory(opening);
          setClosingInventory(closing);
        }}
      />

      {/* כרטיסי סיכום */}
      <StatsCards 
        summary={monthData.summary}
        selectedMonth={selectedMonth!}
        openingInventory={openingInventory}
        closingInventory={closingInventory}
        adjustments2024={adjustments2024}
        formatCurrency={formatCurrency}
        getAdjustmentValue={getAdjustmentValue}
      />

      {/* המשך בחלק הבא... */}
      {/* טבלה ראשית */}
      <div className="bg-white rounded-lg shadow-lg border-2 overflow-hidden" style={{ borderColor: LITAY_COLORS.primary }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-emerald-50 to-teal-50">
              <tr>
                <th className="border border-gray-300 px-4 py-3 text-right font-semibold min-w-[400px]">
                  קטגוריה
                </th>
                <th className="border border-gray-300 px-3 py-3 text-center font-semibold min-w-[150px]">
                  {monthName}
                </th>
                <th className="border border-gray-300 px-2 py-3 w-12">🔎</th>
              </tr>
            </thead>
            <tbody>
              {/* הכנסות */}
              <tr 
                className="bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
                onClick={() => toggleSection('income')}
              >
                <td colSpan={3} className="border border-gray-300 px-4 py-3 font-bold text-green-800">
                  <div className="flex items-center gap-2">
                    {collapsedSections.has('income') ? 
                      <ChevronLeft className="w-5 h-5" /> : 
                      <ChevronDown className="w-5 h-5" />
                    }
                    <span>הכנסות</span>
                    <span className="text-sm font-normal text-green-600">
                      ({monthData.categories.filter(c => c.type === 'income').length} קטגוריות)
                    </span>
                  </div>
                </td>
              </tr>

              {!collapsedSections.has('income') && monthData.categories
                .filter(c => c.type === 'income')
                .map(cat => (
                  <CategoryRow
                    key={String(cat.code)}
                    category={cat}
                    onShowBiur={showBiur}
                    formatCurrency={formatCurrency}
                    monthName={monthName}
                  />
                ))
              }

              {!collapsedSections.has('income') && (
                <tr className="bg-green-100 border-2 border-green-400">
                  <td className="border border-gray-300 px-4 py-3 font-bold text-green-800 sticky right-0 bg-green-100">
                    סה"כ הכנסות
                  </td>
                  <td className="border border-gray-300 px-3 py-3 text-center font-bold text-green-700 text-base">
                    {formatCurrency(monthData.summary.revenue)}
                  </td>
                  <td className="border border-gray-300"></td>
                </tr>
              )}

              <tr><td colSpan={3} className="h-3 bg-gray-50"></td></tr>

              {/* עלות מכר */}
              <tr 
                className="bg-orange-100 cursor-pointer hover:bg-orange-200 transition-colors"
                onClick={() => toggleSection('cogs')}
              >
                <td colSpan={3} className="border border-gray-300 px-4 py-3 font-bold text-orange-800">
                  <div className="flex items-center gap-2">
                    {collapsedSections.has('cogs') ? 
                      <ChevronLeft className="w-5 h-5" /> : 
                      <ChevronDown className="w-5 h-5" />
                    }
                    <span>עלות המכר</span>
                    <span className="text-sm font-normal text-orange-600">
                      ({monthData.categories.filter(c => c.type === 'cogs').length} קטגוריות)
                    </span>
                  </div>
                </td>
              </tr>

              {!collapsedSections.has('cogs') && monthData.categories
                .filter(c => c.type === 'cogs')
                .map(cat => (
                  <React.Fragment key={String(cat.code)}>
                    <CategoryRow
                      category={cat}
                      onShowBiur={showBiur}
                      formatCurrency={formatCurrency}
                      monthName={monthName}
                    />
                    <AdjustmentRow
                      categoryCode={String(cat.code)}
                      months={[selectedMonth!]}
                      adjustments={adjustments2024}
                      onChange={(code, month, value) => {
                        const newAdj = { ...adjustments2024 };
                        if (!newAdj[code]) newAdj[code] = {};
                        newAdj[code][month] = value;
                        setAdjustments2024(newAdj);
                      }}
                      getAdjustmentValue={getAdjustmentValue}
                      formatCurrency={formatCurrency}
                      indented={true}
                    />
                  </React.Fragment>
                ))
              }

              {!collapsedSections.has('cogs') && (
                <>
                  <InventoryRow
                    type="opening"
                    months={[selectedMonth!]}
                    inventory={openingInventory}
                    onChange={(month, value) => setOpeningInventory({...openingInventory, [month]: value})}
                    formatCurrency={formatCurrency}
                    indented={true}
                  />
                  <InventoryRow
                    type="closing"
                    months={[selectedMonth!]}
                    inventory={closingInventory}
                    onChange={(month, value) => setClosingInventory({...closingInventory, [month]: value})}
                    formatCurrency={formatCurrency}
                    indented={true}
                  />

                  <tr className="bg-orange-100 border-2 border-orange-400">
                    <td className="border border-gray-300 px-4 py-3 font-bold text-orange-800 sticky right-0 bg-orange-100">
                      סה"כ עלות המכר
                    </td>
                    <td className="border border-gray-300 px-3 py-3 text-center font-bold text-orange-700 text-base">
                      {formatCurrency(Math.abs(monthData.summary.cogs) + 
                                     (openingInventory[selectedMonth!] || 0) - 
                                     (closingInventory[selectedMonth!] || 0) +
                                     getAdjustmentValue('800', selectedMonth!) + 
                                     getAdjustmentValue('806', selectedMonth!))}
                    </td>
                    <td className="border border-gray-300"></td>
                  </tr>

                  <tr className="bg-emerald-100 border-2 border-emerald-400">
                    <td className="border border-gray-300 px-4 py-3 font-bold text-emerald-800 sticky right-0 bg-emerald-100">
                      💰 רווח גולמי
                    </td>
                    <td className="border border-gray-300 px-3 py-3 text-center font-bold text-emerald-700 text-base">
                      {formatCurrency(monthData.summary.revenue - 
                                     (Math.abs(monthData.summary.cogs) + 
                                      (openingInventory[selectedMonth!] || 0) - 
                                      (closingInventory[selectedMonth!] || 0) +
                                      getAdjustmentValue('800', selectedMonth!) + 
                                      getAdjustmentValue('806', selectedMonth!)))}
                    </td>
                    <td className="border border-gray-300"></td>
                  </tr>
                </>
              )}

              <tr><td colSpan={3} className="h-3 bg-gray-50"></td></tr>

              {/* הוצאות תפעול */}
              <tr 
                className="bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => toggleSection('operating')}
              >
                <td colSpan={3} className="border border-gray-300 px-4 py-3 font-bold text-gray-800">
                  <div className="flex items-center gap-2">
                    {collapsedSections.has('operating') ? 
                      <ChevronLeft className="w-5 h-5" /> : 
                      <ChevronDown className="w-5 h-5" />
                    }
                    <span>הוצאות תפעול</span>
                    <span className="text-sm font-normal text-gray-600">
                      ({monthData.categories.filter(c => c.type === 'operating').length} קטגוריות)
                    </span>
                  </div>
                </td>
              </tr>

              {!collapsedSections.has('operating') && monthData.categories
                .filter(c => c.type === 'operating')
                .map(cat => (
                  <React.Fragment key={String(cat.code)}>
                    <CategoryRow
                      category={cat}
                      onShowBiur={showBiur}
                      formatCurrency={formatCurrency}
                      monthName={monthName}
                    />
                    <AdjustmentRow
                      categoryCode={String(cat.code)}
                      months={[selectedMonth!]}
                      adjustments={adjustments2024}
                      onChange={(code, month, value) => {
                        const newAdj = { ...adjustments2024 };
                        if (!newAdj[code]) newAdj[code] = {};
                        newAdj[code][month] = value;
                        setAdjustments2024(newAdj);
                      }}
                      getAdjustmentValue={getAdjustmentValue}
                      formatCurrency={formatCurrency}
                      indented={true}
                    />
                  </React.Fragment>
                ))
              }

              {!collapsedSections.has('operating') && (
                <tr className="bg-teal-100 border-2 border-teal-400">
                  <td className="border border-gray-300 px-4 py-3 font-bold text-teal-800 sticky right-0 bg-teal-100">
                    💼 רווח תפעולי
                  </td>
                  <td className="border border-gray-300 px-3 py-3 text-center font-bold text-teal-700 text-base">
                    {formatCurrency(monthData.summary.revenue - 
                                   (Math.abs(monthData.summary.cogs) + 
                                    (openingInventory[selectedMonth!] || 0) - 
                                    (closingInventory[selectedMonth!] || 0) +
                                    getAdjustmentValue('800', selectedMonth!) + 
                                    getAdjustmentValue('806', selectedMonth!)) -
                                   (Math.abs(monthData.summary.operating) +
                                    getAdjustmentValue('801', selectedMonth!) +
                                    getAdjustmentValue('802', selectedMonth!) +
                                    getAdjustmentValue('804', selectedMonth!) +
                                    getAdjustmentValue('805', selectedMonth!) +
                                    getAdjustmentValue('811', selectedMonth!)))}
                  </td>
                  <td className="border border-gray-300"></td>
                </tr>
              )}

              <tr><td colSpan={3} className="h-3 bg-gray-50"></td></tr>

              {/* הוצאות מימון */}
              <tr 
                className="bg-slate-100 cursor-pointer hover:bg-slate-200 transition-colors"
                onClick={() => toggleSection('financial')}
              >
                <td colSpan={3} className="border border-gray-300 px-4 py-3 font-bold text-slate-800">
                  <div className="flex items-center gap-2">
                    {collapsedSections.has('financial') ? 
                      <ChevronLeft className="w-5 h-5" /> : 
                      <ChevronDown className="w-5 h-5" />
                    }
                    <span>הוצאות מימון</span>
                    <span className="text-sm font-normal text-slate-600">
                      ({monthData.categories.filter(c => c.type === 'financial').length} קטגוריות)
                    </span>
                  </div>
                </td>
              </tr>

              {!collapsedSections.has('financial') && monthData.categories
                .filter(c => c.type === 'financial')
                .map(cat => (
                  <React.Fragment key={String(cat.code)}>
                    <CategoryRow
                      category={cat}
                      onShowBiur={showBiur}
                      formatCurrency={formatCurrency}
                      monthName={monthName}
                    />
                    <AdjustmentRow
                      categoryCode={String(cat.code)}
                      months={[selectedMonth!]}
                      adjustments={adjustments2024}
                      onChange={(code, month, value) => {
                        const newAdj = { ...adjustments2024 };
                        if (!newAdj[code]) newAdj[code] = {};
                        newAdj[code][month] = value;
                        setAdjustments2024(newAdj);
                      }}
                      getAdjustmentValue={getAdjustmentValue}
                      formatCurrency={formatCurrency}
                      indented={true}
                    />
                  </React.Fragment>
                ))
              }

              {!collapsedSections.has('financial') && (
                <tr className="bg-cyan-100 border-2 border-cyan-400">
                  <td className="border border-gray-300 px-4 py-3 font-bold text-cyan-800 sticky right-0 bg-cyan-100">
                    🎯 רווח נקי
                  </td>
                  <td className="border border-gray-300 px-3 py-3 text-center font-bold text-cyan-700 text-lg">
                    {formatCurrency(monthData.summary.revenue - 
                                   (Math.abs(monthData.summary.cogs) + 
                                    (openingInventory[selectedMonth!] || 0) - 
                                    (closingInventory[selectedMonth!] || 0) +
                                    getAdjustmentValue('800', selectedMonth!) + 
                                    getAdjustmentValue('806', selectedMonth!)) -
                                   (Math.abs(monthData.summary.operating) +
                                    getAdjustmentValue('801', selectedMonth!) +
                                    getAdjustmentValue('802', selectedMonth!) +
                                    getAdjustmentValue('804', selectedMonth!) +
                                    getAdjustmentValue('805', selectedMonth!) +
                                    getAdjustmentValue('811', selectedMonth!)) -
                                   (Math.abs(monthData.summary.financial) +
                                    getAdjustmentValue('813', selectedMonth!) +
                                    getAdjustmentValue('990', selectedMonth!) +
                                    getAdjustmentValue('991', selectedMonth!)))}
                  </td>
                  <td className="border border-gray-300"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* מודלים */}
      <BiurModal
        isOpen={showBiurModal}
        data={biurData}
        onClose={() => setShowBiurModal(false)}
        formatCurrency={formatCurrency}
      />

      <InventoryEditorModal
        isOpen={showInventoryEditor}
        onClose={() => setShowInventoryEditor(false)}
        openingInventory={openingInventory}
        closingInventory={closingInventory}
        onSave={(opening, closing) => {
          setOpeningInventory(opening);
          setClosingInventory(closing);
          setShowInventoryEditor(false);
        }}
        formatCurrency={formatCurrency}
      />

      <AdjustmentsEditorModal
        isOpen={showAdjustmentsEditor}
        onClose={() => setShowAdjustmentsEditor(false)}
        adjustments={adjustments2024}
        onSave={(adj) => {
          saveAdjustments(adj);
          setShowAdjustmentsEditor(false);
        }}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default SingleMonthPLReport;
