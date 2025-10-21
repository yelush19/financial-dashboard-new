// src/components/reports/MonthlyReport/index.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft, Save, Download, TrendingUp, AlertCircle, Edit3 } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';

// Types
import { 
  Transaction, 
  MonthlyData, 
  VendorData, 
  CategoryData, 
  ProcessedMonthlyData,
  Inventory,
  Adjustments2024,
  BiurData
} from '../../../types/reportTypes';

// Constants
import { MONTH_NAMES, STORAGE_KEYS, REPORT_CONFIG } from '../../../constants/reportConstants';

// Components
import { StatsCards } from './StatsCards';
import { BiurModal } from './BiurModal';
import { TableHeader } from './TableHeader';
import { CategoryRow } from './CategoryRow';
import { VendorRow } from './VendorRow';
import { InventoryRow } from './InventoryRow';
import { AdjustmentRow } from './AdjustmentRow';
import { InventoryBackupControls } from './InventoryBackupControls';
import { InventoryEditorModal } from './InventoryEditorModal';

// ============ MAIN COMPONENT ============
const MonthlyReport: React.FC = () => {
  // ============ STATE ============
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [openingInventory, setOpeningInventory] = useState<Inventory>({});
  const [closingInventory, setClosingInventory] = useState<Inventory>({});
  const [adjustments2024, setAdjustments2024] = useState<Adjustments2024>({});
  const [showBiurModal, setShowBiurModal] = useState(false);
  const [biurData, setBiurData] = useState<BiurData>({
    title: '',
    transactions: []
  });
  const [showInventoryEditor, setShowInventoryEditor] = useState(false);

  // ============ LOAD DATA ============
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
              
              // טעינת נתונים מ-localStorage
              const savedOpeningInv = localStorage.getItem(STORAGE_KEYS.OPENING_INVENTORY);
              const savedClosingInv = localStorage.getItem(STORAGE_KEYS.CLOSING_INVENTORY);
              const savedAdjustments = localStorage.getItem(STORAGE_KEYS.ADJUSTMENTS_2024);
              
              if (savedOpeningInv) setOpeningInventory(JSON.parse(savedOpeningInv));
              if (savedClosingInv) setClosingInventory(JSON.parse(savedClosingInv));
              if (savedAdjustments) setAdjustments2024(JSON.parse(savedAdjustments));
              
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
  }, []);

  // ============ PROCESS DATA ============
  const monthlyData = useMemo((): ProcessedMonthlyData => {
    if (!transactions.length) {
      return { 
        months: [], 
        categories: [], 
        totals: {
          revenue: { total: 0 } as MonthlyData,
          cogs: { total: 0 } as MonthlyData,
          grossProfit: { total: 0 } as MonthlyData,
          operating: { total: 0 } as MonthlyData,
          operatingProfit: { total: 0 } as MonthlyData,
          financial: { total: 0 } as MonthlyData,
          netProfit: { total: 0 } as MonthlyData
        }
      };
    }

    // חילוץ חודשים ייחודיים
    const uniqueMonths = Array.from(new Set(
      transactions
        .filter(tx => tx.date && tx.date.split('/').length === 3)
        .map(tx => parseInt(tx.date.split('/')[1]))
    )).sort((a, b) => a - b);

    // פונקציה לעיבוד קטגוריה
    const processCategory = (
      code: number | string, 
      type: 'income' | 'cogs' | 'operating' | 'financial', 
      filterFn: (tx: Transaction) => boolean
    ) => {
      const categoryTxs = transactions.filter(filterFn);
      const data: MonthlyData = { total: 0 };
      
      const sortCodeName = categoryTxs.length > 0 
        ? categoryTxs[0].sortCodeName 
        : (typeof code === 'string' ? code : `קוד ${code}`);
      
      uniqueMonths.forEach(m => data[m] = 0);
      
      // קיבוץ לפי ספקים/לקוחות
      const vendorGroups = _.groupBy(categoryTxs, tx => {
        const counterNum = tx.counterAccountNumber || 0;
        const counterName = tx.counterAccountName || tx.details.split(' ')[0] || 'לא ידוע';
        return `${counterNum}|||${counterName}`;
      });
      
      const vendors: VendorData[] = Object.entries(vendorGroups)
        .map(([key, txs]) => {
          const [counterNum, counterName] = key.split('|||');
          const vendorData: MonthlyData = { total: 0 };
          uniqueMonths.forEach(m => vendorData[m] = 0);
          
          (txs as Transaction[]).forEach(tx => {
            const month = parseInt(tx.date.split('/')[1]);
            if (uniqueMonths.includes(month)) {
              vendorData[month] += tx.amount;
              vendorData.total += tx.amount;
            }
          });
          
          return {
            name: counterNum && counterNum !== '0' ? `${counterName} - ${counterNum}` : counterName || 'לא ידוע',
            data: vendorData,
            transactions: txs as Transaction[]
          };
        })
        .filter(v => v.data.total !== 0)
        .sort((a, b) => Math.abs(b.data.total) - Math.abs(a.data.total));

      // חישוב סכומים חודשיים
      categoryTxs.forEach(tx => {
        const month = parseInt(tx.date.split('/')[1]);
        if (uniqueMonths.includes(month)) {
          data[month] += tx.amount;
          data.total += tx.amount;
        }
      });

      return { data, vendors, sortCodeName };
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
      { code: 'income_site', name: income_site.sortCodeName || 'הכנסות מכירות - אתר', type: 'income', data: income_site.data, vendors: income_site.vendors },
      { code: 'income_superpharm', name: income_superpharm.sortCodeName || 'הכנסות מכירות - סופרפארם', type: 'income', data: income_superpharm.data, vendors: income_superpharm.vendors },
      { code: 800, name: cogs800.sortCodeName, type: 'cogs', data: cogs800.data, vendors: cogs800.vendors },
      { code: 806, name: cogs806.sortCodeName, type: 'cogs', data: cogs806.data, vendors: cogs806.vendors },
      { code: 801, name: op801.sortCodeName, type: 'operating', data: op801.data, vendors: op801.vendors },
      { code: 802, name: op802.sortCodeName, type: 'operating', data: op802.data, vendors: op802.vendors },
      { code: 804, name: op804.sortCodeName, type: 'operating', data: op804.data, vendors: op804.vendors },
      { code: 805, name: op805.sortCodeName, type: 'operating', data: op805.data, vendors: op805.vendors },
      { code: 811, name: op811.sortCodeName, type: 'operating', data: op811.data, vendors: op811.vendors },
      { code: 813, name: fin813.sortCodeName, type: 'financial', data: fin813.data, vendors: fin813.vendors },
      { code: 990, name: fin990.sortCodeName, type: 'financial', data: fin990.data, vendors: fin990.vendors },
      { code: 991, name: fin991.sortCodeName, type: 'financial', data: fin991.data, vendors: fin991.vendors },
    ];

    // חישוב סיכומים
    const revenue: MonthlyData = { total: 0 };
    const cogs: MonthlyData = { total: 0 };
    const operating: MonthlyData = { total: 0 };
    const financial: MonthlyData = { total: 0 };

    uniqueMonths.forEach(m => {
      revenue[m] = 0;
      cogs[m] = 0;
      operating[m] = 0;
      financial[m] = 0;
    });

    categories.forEach(cat => {
      if (cat.type === 'income') {
        uniqueMonths.forEach(m => revenue[m] += cat.data[m]);
        revenue.total += cat.data.total;
      } else if (cat.type === 'cogs') {
        uniqueMonths.forEach(m => cogs[m] += cat.data[m]);
        cogs.total += cat.data.total;
      } else if (cat.type === 'operating') {
        uniqueMonths.forEach(m => operating[m] += cat.data[m]);
        operating.total += cat.data.total;
      } else if (cat.type === 'financial') {
        uniqueMonths.forEach(m => financial[m] += cat.data[m]);
        financial.total += cat.data.total;
      }
    });

    const grossProfit: MonthlyData = { total: 0 };
    const operatingProfit: MonthlyData = { total: 0 };
    const netProfit: MonthlyData = { total: 0 };

    uniqueMonths.forEach(m => {
      const cogsCost = cogs[m] + (openingInventory[m] || 0) - (closingInventory[m] || 0);
      grossProfit[m] = revenue[m] + cogsCost;
      operatingProfit[m] = grossProfit[m] + operating[m];
      netProfit[m] = operatingProfit[m] + financial[m];
      
      grossProfit.total += grossProfit[m];
      operatingProfit.total += operatingProfit[m];
      netProfit.total += netProfit[m];
    });

    return {
      months: uniqueMonths,
      categories,
      totals: { revenue, cogs, grossProfit, operating, operatingProfit, financial, netProfit }
    };
  }, [transactions, openingInventory, closingInventory]);

  // ============ HANDLERS ============
  const toggleCategory = (code: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(code)) {
      newSet.delete(code);
    } else {
      newSet.add(code);
    }
    setExpandedCategories(newSet);
  };

  const toggleSection = (section: string) => {
    const newSet = new Set(collapsedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setCollapsedSections(newSet);
  };

  const toggleAllSections = () => {
    if (collapsedSections.size > 0) {
      setCollapsedSections(new Set());
    } else {
      setCollapsedSections(new Set(['income', 'cogs', 'operating', 'financial']));
    }
  };

  const formatCurrency = (amount: number): string => {
    const isNegative = amount < 0;
    const abs = Math.abs(amount);
    const formatted = new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0
    }).format(abs);
    return isNegative ? `(${formatted})` : formatted;
  };

  const saveInventory = () => {
    localStorage.setItem(STORAGE_KEYS.OPENING_INVENTORY, JSON.stringify(openingInventory));
    localStorage.setItem(STORAGE_KEYS.CLOSING_INVENTORY, JSON.stringify(closingInventory));
    localStorage.setItem(STORAGE_KEYS.ADJUSTMENTS_2024, JSON.stringify(adjustments2024));
    alert('הנתונים נשמרו בהצלחה!');
  };

  // ============ פונקציות המרה בין פורמטים ============
  
  // המרה מפורמט מספרי לפורמט YYYY-MM
  const convertToYearMonth = (inventory: Inventory): { [key: string]: number } => {
    const result: { [key: string]: number } = {};
    Object.entries(inventory).forEach(([key, value]) => {
      if (typeof key === 'number' || !key.includes('-')) {
        // פורמט ישן - המר ל-YYYY-MM
        const monthNum = typeof key === 'string' ? parseInt(key) : key;
        const yearMonthKey = `2025-${String(monthNum).padStart(2, '0')}`;
        result[yearMonthKey] = value;
      } else {
        // פורמט חדש - השאר כמו שזה
        result[key] = value;
      }
    });
    return result;
  };
  
  // המרה מפורמט YYYY-MM לפורמט מספרי
  const convertFromYearMonth = (inventory: { [key: string]: number }): Inventory => {
    const result: Inventory = {};
    Object.entries(inventory).forEach(([key, value]) => {
      if (key.includes('-')) {
        // פורמט YYYY-MM - קח רק את החודש
        const [year, monthStr] = key.split('-');
        const month = parseInt(monthStr);
        
        // אם זה שנת 2025, שמור כמספר
        if (year === '2025') {
          result[month] = value;
        } else {
          // אם זה שנה אחרת, שמור כ-string
          result[key as any] = value;
        }
      } else {
        // כבר בפורמט נכון
        result[key as any] = value;
      }
    });
    return result;
  };

  // טיפול בשמירה מהמודל
  const handleInventorySave = (opening: { [key: string]: number }, closing: { [key: string]: number }) => {
    // המרה חזרה לפורמט של המערכת
    const convertedOpening = convertFromYearMonth(opening);
    const convertedClosing = convertFromYearMonth(closing);
    
    setOpeningInventory(convertedOpening);
    setClosingInventory(convertedClosing);
    
    // שמירה אוטומטית ל-localStorage
    localStorage.setItem(STORAGE_KEYS.OPENING_INVENTORY, JSON.stringify(convertedOpening));
    localStorage.setItem(STORAGE_KEYS.CLOSING_INVENTORY, JSON.stringify(convertedClosing));
  };

  const handleClosingInventoryChange = (month: number, value: number) => {
    const newClosing = { ...closingInventory, [month]: value };
    setClosingInventory(newClosing);
    
    // עדכון אוטומטי של מלאי פתיחה בחודש הבא
    const nextMonth = month + 1;
    if (nextMonth <= 12 && monthlyData.months.includes(nextMonth)) {
      setOpeningInventory(prev => ({ ...prev, [nextMonth]: value }));
    }
  };

  const handleAdjustmentChange = (categoryCode: string, month: number, value: string | number) => {
    setAdjustments2024(prev => ({
      ...prev,
      [categoryCode]: {
        ...(prev[categoryCode] || {}),
        [month]: value
      }
    }));
  };

  const getAdjustmentValue = (categoryCode: string, month: number): number => {
    const val = adjustments2024[categoryCode]?.[month];
    if (val === undefined || val === '' || val === '-') return 0;
    return parseFloat(String(val)) || 0;
  };

  const showBiur = (category: CategoryData, month?: number, vendor?: VendorData) => {
    let txs: Transaction[];
    
    if (vendor) {
      txs = vendor.transactions;
      if (month) {
        txs = txs.filter(tx => parseInt(tx.date.split('/')[1]) === month);
      }
    } else {
      txs = transactions.filter(tx => {
        if (category.code === 'income_site') {
          return tx.sortCode === 600 && tx.accountKey >= 40000 && tx.accountKey < 40020;
        } else if (category.code === 'income_superpharm') {
          return tx.sortCode === 600 && tx.accountKey >= 40020;
        } else {
          return tx.sortCode === category.code;
        }
      });

      if (month) {
        txs = txs.filter(tx => parseInt(tx.date.split('/')[1]) === month);
      }
    }

    const categoryName = category.name;
    const title = vendor 
      ? `${categoryName} - ${vendor.name}${month ? ` - ${MONTH_NAMES[month - 1]}` : ''}`
      : `${categoryName}${month ? ` - ${MONTH_NAMES[month - 1]}` : ''}`;

    setBiurData({
      title,
      transactions: txs,
      month
    });
    setShowBiurModal(true);
  };

  const exportToCSV = () => {
    let csv = '\ufeffקטגוריה,';
    monthlyData.months.forEach(m => {
      csv += `${MONTH_NAMES[m - 1]},`;
    });
    csv += 'סה"כ\n';

    csv += '\nהכנסות\n';
    monthlyData.categories.filter(c => c.type === 'income').forEach(cat => {
      csv += `"${cat.name}",`;
      monthlyData.months.forEach(m => {
        csv += `${cat.data[m] || 0},`;
      });
      csv += `${cat.data.total}\n`;
    });

    csv += `"סה""כ הכנסות",`;
    monthlyData.months.forEach(m => {
      csv += `${monthlyData.totals.revenue[m] || 0},`;
    });
    csv += `${monthlyData.totals.revenue.total}\n`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `דוח_חודשי_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  // ============ RENDER LOADING/ERROR ============
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-xl text-gray-600">טוען נתונים...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-gray-600 mb-2">שגיאה בטעינת הנתונים</p>
          <p className="text-sm text-red-500">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  if (!monthlyData.months.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600 mb-2">לא נמצאו נתונים</p>
          <p className="text-sm text-gray-500">נא לוודא שקובץ CSV קיים בתיקייה</p>
        </div>
      </div>
    );
  }

  // ============ MAIN RENDER ============
  return (
    <div className="w-full p-6 bg-white">
      {/* כותרת */}
      <div className="mb-6 border-b border-gray-200 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">דוח רווח והפסד חודשי</h1>
            <p className="text-sm text-gray-600">
              תקופה: {monthlyData.months.length > 0 
                ? `${MONTH_NAMES[monthlyData.months[0] - 1]} - ${MONTH_NAMES[monthlyData.months[monthlyData.months.length - 1] - 1]} 2025` 
                : 'אין נתונים'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {transactions.length.toLocaleString('he-IL')} תנועות | {monthlyData.categories.length} קטגוריות
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleAllSections}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              {collapsedSections.size > 0 ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {collapsedSections.size > 0 ? 'פתח הכל' : 'סגור הכל'}
            </button>
            <button
              onClick={saveInventory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              שמור מלאי
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              ייצא ל-CSV
            </button>
          </div>
        </div>
      </div>

      {/* כרטיסי סטטיסטיקה */}
      <StatsCards
        monthlyData={monthlyData}
        openingInventory={openingInventory}
        closingInventory={closingInventory}
        adjustments2024={adjustments2024}
        formatCurrency={formatCurrency}
        getAdjustmentValue={getAdjustmentValue}
      />

      {/* טבלה ראשית */}
      <div 
        className="overflow-x-auto shadow-lg rounded-lg" 
        style={{ 
          maxHeight: REPORT_CONFIG.MAX_TABLE_HEIGHT, 
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: `${REPORT_CONFIG.SCROLLBAR_COLOR} ${REPORT_CONFIG.SCROLLBAR_TRACK_COLOR}`
        }}
      >
        <style>{`
          div::-webkit-scrollbar {
            width: ${REPORT_CONFIG.SCROLLBAR_WIDTH};
            height: ${REPORT_CONFIG.SCROLLBAR_WIDTH};
          }
          div::-webkit-scrollbar-track {
            background: ${REPORT_CONFIG.SCROLLBAR_TRACK_COLOR};
            border-radius: 4px;
          }
          div::-webkit-scrollbar-thumb {
            background: ${REPORT_CONFIG.SCROLLBAR_COLOR};
            border-radius: 4px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #2d5f3f;
          }
        `}</style>
        
        <table className="w-full border-collapse text-sm">
          <TableHeader months={monthlyData.months} />
          
          <tbody>
            {/* ========== הכנסות ========== */}
            <tr 
              className="bg-green-50 cursor-pointer hover:bg-green-100 transition-colors"
              onClick={() => toggleSection('income')}
            >
              <td colSpan={monthlyData.months.length + 3} className="border border-gray-300 px-4 py-3 font-bold text-green-800">
                <div className="flex items-center gap-2">
                  {collapsedSections.has('income') ? 
                    <ChevronLeft className="w-5 h-5" /> : 
                    <ChevronDown className="w-5 h-5" />
                  }
                  <span>הכנסות</span>
                  <span className="text-sm font-normal text-green-600">
                    ({monthlyData.categories.filter(c => c.type === 'income').length} קטגוריות)
                  </span>
                </div>
              </td>
            </tr>
            
            {!collapsedSections.has('income') && monthlyData.categories.filter(c => c.type === 'income').map(cat => (
              <React.Fragment key={cat.code}>
                <CategoryRow
                  category={cat}
                  months={monthlyData.months}
                  isExpanded={expandedCategories.has(String(cat.code))}
                  onToggle={() => toggleCategory(String(cat.code))}
                  onShowBiur={(month) => showBiur(cat, month)}
                  formatCurrency={formatCurrency}
                  colorClass="text-green-700"
                />
                
                {expandedCategories.has(String(cat.code)) && cat.vendors?.map((vendor, idx) => (
                  <VendorRow
                    key={`${cat.code}-${idx}`}
                    vendor={vendor}
                    category={cat}
                    months={monthlyData.months}
                    onShowBiur={(month) => showBiur(cat, month, vendor)}
                    formatCurrency={formatCurrency}
                    bgColor="bg-green-50"
                  />
                ))}
              </React.Fragment>
            ))}
            
            {!collapsedSections.has('income') && (
              <tr className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400">
                <td className="border border-gray-300 px-4 py-3 font-bold text-green-800 sticky right-0 bg-gradient-to-br from-green-50 to-emerald-50">
                  סה"כ הכנסות
                </td>
                {monthlyData.months.map(m => (
                  <td key={m} className="border border-gray-300 px-3 py-3 text-center font-bold text-green-700 text-base">
                    {formatCurrency(monthlyData.totals.revenue[m] || 0)}
                  </td>
                ))}
                <td className="border border-gray-300 px-3 py-3 text-center font-bold text-green-700 text-lg">
                  {formatCurrency(monthlyData.totals.revenue.total)}
                </td>
                <td className="border border-gray-300"></td>
              </tr>
            )}

            <tr><td colSpan={monthlyData.months.length + 3} className="h-3 bg-gray-50"></td></tr>

            {/* ========== עלות המכר ========== */}
            <tr 
              className="bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors"
              onClick={() => toggleSection('cogs')}
            >
              <td colSpan={monthlyData.months.length + 3} className="border border-gray-300 px-4 py-3 font-bold text-orange-800">
                <div className="flex items-center gap-2">
                  {collapsedSections.has('cogs') ? 
                    <ChevronLeft className="w-5 h-5" /> : 
                    <ChevronDown className="w-5 h-5" />
                  }
                  <span>עלות המכר</span>
                  <span className="text-sm font-normal text-orange-600">(כולל מלאי)</span>
                </div>
              </td>
            </tr>

            {!collapsedSections.has('cogs') && (
              <>
                <tr>
                  <td colSpan={monthlyData.months.length + 3} style={{ padding: 0, border: 'none' }}>
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-200">
                      <InventoryBackupControls
                        openingInventory={openingInventory}
                        closingInventory={closingInventory}
                        onImport={(opening, closing) => {
                          setOpeningInventory(opening);
                          setClosingInventory(closing);
                        }}
                      />
                      <button
                        onClick={() => setShowInventoryEditor(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                      >
                        <Edit3 className="w-4 h-4" />
                        ערוך מלאי
                      </button>
                    </div>
                  </td>
                </tr>

                <InventoryRow
                  type="opening"
                  months={monthlyData.months}
                  inventory={openingInventory}
                  onChange={(month, value) => setOpeningInventory({...openingInventory, [month]: value})}
                  formatCurrency={formatCurrency}
                />

                {monthlyData.categories.filter(c => c.type === 'cogs').map(cat => (
                  <React.Fragment key={cat.code}>
                    <CategoryRow
                      category={cat}
                      months={monthlyData.months}
                      isExpanded={expandedCategories.has(String(cat.code))}
                      onToggle={() => toggleCategory(String(cat.code))}
                      onShowBiur={(month) => showBiur(cat, month)}
                      formatCurrency={formatCurrency}
                    />
                    
                    {expandedCategories.has(String(cat.code)) && cat.vendors?.map((vendor, idx) => (
                      <VendorRow
                        key={`${cat.code}-${idx}`}
                        vendor={vendor}
                        category={cat}
                        months={monthlyData.months}
                        onShowBiur={(month) => showBiur(cat, month, vendor)}
                        formatCurrency={formatCurrency}
                        bgColor="bg-orange-50"
                      />
                    ))}
                    
                    <AdjustmentRow
                      categoryCode={String(cat.code)}
                      months={monthlyData.months}
                      adjustments={adjustments2024}
                      onChange={handleAdjustmentChange}
                      getAdjustmentValue={getAdjustmentValue}
                      formatCurrency={formatCurrency}
                    />

                    <tr className="bg-orange-100 border-t-2 border-orange-400">
                      <td className="border border-gray-300 px-4 py-2 sticky right-0 bg-orange-100 font-semibold text-orange-800">
                        סה"כ {cat.code} - {cat.name}
                      </td>
                      {monthlyData.months.map(m => {
                        const adjustment = getAdjustmentValue(String(cat.code), m);
                        const total = Math.abs(cat.data[m] || 0) + adjustment;
                        return (
                          <td key={m} className="border border-gray-300 px-3 py-2 text-center font-bold text-orange-800">
                            {formatCurrency(total)}
                          </td>
                        );
                      })}
                      <td className="border border-gray-300 px-3 py-2 text-center font-bold text-orange-800">
                        {formatCurrency(
                          Math.abs(cat.data.total) + 
                          monthlyData.months.reduce((sum, m) => sum + getAdjustmentValue(String(cat.code), m), 0)
                        )}
                      </td>
                      <td className="border border-gray-300"></td>
                    </tr>
                  </React.Fragment>
                ))}

                <InventoryRow
                  type="closing"
                  months={monthlyData.months}
                  inventory={closingInventory}
                  onChange={handleClosingInventoryChange}
                  formatCurrency={formatCurrency}
                />

                <tr className="bg-orange-50 border-2 border-orange-400">
                  <td className="border border-gray-300 px-4 py-3 font-bold text-orange-800 sticky right-0 bg-orange-50">
                    סה"כ עלות המכר
                  </td>
                  {monthlyData.months.map(m => {
                    const cogsAdjustments = monthlyData.categories
                      .filter(c => c.type === 'cogs')
                      .reduce((sum, cat) => sum + getAdjustmentValue(String(cat.code), m), 0);
                    const cogsCost = Math.abs(monthlyData.totals.cogs[m] || 0) + (openingInventory[m] || 0) - (closingInventory[m] || 0) + cogsAdjustments;
                    return (
                      <td key={m} className="border border-gray-300 px-3 py-3 text-center font-bold text-orange-700">
                        {formatCurrency(cogsCost)}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-3 py-3 text-center font-bold text-orange-700 text-base">
                    {formatCurrency(
                      Math.abs(monthlyData.totals.cogs.total) + 
                      Object.values(openingInventory).reduce((a, b) => a + b, 0) - 
                      Object.values(closingInventory).reduce((a, b) => a + b, 0) +
                      monthlyData.categories
                        .filter(c => c.type === 'cogs')
                        .reduce((sum, cat) => {
                          return sum + monthlyData.months.reduce((s, m) => s + getAdjustmentValue(String(cat.code), m), 0);
                        }, 0)
                    )}
                  </td>
                  <td className="border border-gray-300"></td>
                </tr>

                <tr className="bg-green-50 border-2 border-green-400">
                  <td className="border border-gray-300 px-4 py-3 font-bold text-green-800 sticky right-0 bg-green-50">
                    💰 רווח גולמי
                  </td>
                  {monthlyData.months.map(m => {
                    const cogsAdjustments = monthlyData.categories
                      .filter(c => c.type === 'cogs')
                      .reduce((sum, cat) => sum + getAdjustmentValue(String(cat.code), m), 0);
                    const cogsCost = Math.abs(monthlyData.totals.cogs[m] || 0) + (openingInventory[m] || 0) - (closingInventory[m] || 0) + cogsAdjustments;
                    const grossProfit = (monthlyData.totals.revenue[m] || 0) - cogsCost;
                    return (
                      <td key={m} className="border border-gray-300 px-3 py-3 text-center font-bold text-green-700 text-base">
                        {formatCurrency(grossProfit)}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-3 py-3 text-center font-bold text-green-700 text-lg">
                    {formatCurrency(
                      monthlyData.totals.revenue.total - 
                      (Math.abs(monthlyData.totals.cogs.total) + 
                      Object.values(openingInventory).reduce((a, b) => a + b, 0) - 
                      Object.values(closingInventory).reduce((a, b) => a + b, 0) +
                      monthlyData.categories
                        .filter(c => c.type === 'cogs')
                        .reduce((sum, cat) => {
                          return sum + monthlyData.months.reduce((s, m) => s + getAdjustmentValue(String(cat.code), m), 0);
                        }, 0))
                    )}
                  </td>
                  <td className="border border-gray-300"></td>
                </tr>
              </>
            )}

            <tr><td colSpan={monthlyData.months.length + 3} className="h-3 bg-gray-50"></td></tr>

            {/* ========== הוצאות תפעול ========== */}
            <tr 
              className="bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => toggleSection('operating')}
            >
              <td colSpan={monthlyData.months.length + 3} className="border border-gray-300 px-4 py-3 font-bold text-gray-800">
                <div className="flex items-center gap-2">
                  {collapsedSections.has('operating') ? 
                    <ChevronLeft className="w-5 h-5" /> : 
                    <ChevronDown className="w-5 h-5" />
                  }
                  <span>הוצאות תפעול</span>
                  <span className="text-sm font-normal text-gray-600">
                    ({monthlyData.categories.filter(c => c.type === 'operating').length} קטגוריות)
                  </span>
                </div>
              </td>
            </tr>

            {!collapsedSections.has('operating') && (
              <>
                {monthlyData.categories.filter(c => c.type === 'operating').map(cat => (
                  <React.Fragment key={cat.code}>
                    <CategoryRow
                      category={cat}
                      months={monthlyData.months}
                      isExpanded={expandedCategories.has(String(cat.code))}
                      onToggle={() => toggleCategory(String(cat.code))}
                      onShowBiur={(month) => showBiur(cat, month)}
                      formatCurrency={formatCurrency}
                    />
                    
                    {expandedCategories.has(String(cat.code)) && cat.vendors?.map((vendor, idx) => (
                      <VendorRow
                        key={`${cat.code}-${idx}`}
                        vendor={vendor}
                        category={cat}
                        months={monthlyData.months}
                        onShowBiur={(month) => showBiur(cat, month, vendor)}
                        formatCurrency={formatCurrency}
                        bgColor="bg-gray-50"
                      />
                    ))}
                    
                    <AdjustmentRow
                      categoryCode={String(cat.code)}
                      months={monthlyData.months}
                      adjustments={adjustments2024}
                      onChange={handleAdjustmentChange}
                      getAdjustmentValue={getAdjustmentValue}
                      formatCurrency={formatCurrency}
                    />

                    <tr className="bg-gray-100 border-t-2 border-gray-400">
                      <td className="border border-gray-300 px-4 py-2 sticky right-0 bg-gray-100 font-semibold text-gray-800">
                        סה"כ {cat.code} - {cat.name}
                      </td>
                      {monthlyData.months.map(m => {
                        const adjustment = getAdjustmentValue(String(cat.code), m);
                        const total = Math.abs(cat.data[m] || 0) + adjustment;
                        return (
                          <td key={m} className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-800">
                            {formatCurrency(total)}
                          </td>
                        );
                      })}
                      <td className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-800">
                        {formatCurrency(
                          Math.abs(cat.data.total) + 
                          monthlyData.months.reduce((sum, m) => sum + getAdjustmentValue(String(cat.code), m), 0)
                        )}
                      </td>
                      <td className="border border-gray-300"></td>
                    </tr>
                  </React.Fragment>
                ))}

                <tr className="bg-emerald-50 border-2 border-emerald-400">
                  <td className="border border-gray-300 px-4 py-3 font-bold text-emerald-800 sticky right-0 bg-emerald-50">
                    💼 רווח תפעולי
                  </td>
                  {monthlyData.months.map(m => {
                    const cogsAdjustments = monthlyData.categories
                      .filter(c => c.type === 'cogs')
                      .reduce((sum, cat) => sum + getAdjustmentValue(String(cat.code), m), 0);
                    const cogsCost = Math.abs(monthlyData.totals.cogs[m] || 0) + (openingInventory[m] || 0) - (closingInventory[m] || 0) + cogsAdjustments;
                    const grossProfit = (monthlyData.totals.revenue[m] || 0) - cogsCost;
                    
                    const operatingAdjustments = monthlyData.categories
                      .filter(c => c.type === 'operating')
                      .reduce((sum, cat) => sum + getAdjustmentValue(String(cat.code), m), 0);
                    const operatingExpenses = Math.abs(monthlyData.totals.operating[m] || 0) + operatingAdjustments;
                    const operatingProfit = grossProfit - operatingExpenses;
                    
                    return (
                      <td key={m} className="border border-gray-300 px-3 py-3 text-center font-bold text-emerald-700 text-base">
                        {formatCurrency(operatingProfit)}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-3 py-3 text-center font-bold text-emerald-700 text-lg">
                    {formatCurrency(
                      (monthlyData.totals.revenue.total - 
                      (Math.abs(monthlyData.totals.cogs.total) + 
                      Object.values(openingInventory).reduce((a, b) => a + b, 0) - 
                      Object.values(closingInventory).reduce((a, b) => a + b, 0) +
                      monthlyData.categories
                        .filter(c => c.type === 'cogs')
                        .reduce((sum, cat) => {
                          return sum + monthlyData.months.reduce((s, m) => s + getAdjustmentValue(String(cat.code), m), 0);
                        }, 0))) -
                      (Math.abs(monthlyData.totals.operating.total) +
                      monthlyData.categories
                        .filter(c => c.type === 'operating')
                        .reduce((sum, cat) => {
                          return sum + monthlyData.months.reduce((s, m) => s + getAdjustmentValue(String(cat.code), m), 0);
                        }, 0))
                    )}
                  </td>
                  <td className="border border-gray-300"></td>
                </tr>
              </>
            )}

            <tr><td colSpan={monthlyData.months.length + 3} className="h-3 bg-gray-50"></td></tr>

            {/* ========== הוצאות מימון ========== */}
            <tr 
              className="bg-slate-100 cursor-pointer hover:bg-slate-200 transition-colors"
              onClick={() => toggleSection('financial')}
            >
              <td colSpan={monthlyData.months.length + 3} className="border border-gray-300 px-4 py-3 font-bold text-slate-800">
                <div className="flex items-center gap-2">
                  {collapsedSections.has('financial') ? 
                    <ChevronLeft className="w-5 h-5" /> : 
                    <ChevronDown className="w-5 h-5" />
                  }
                  <span>הוצאות מימון</span>
                  <span className="text-sm font-normal text-slate-600">
                    ({monthlyData.categories.filter(c => c.type === 'financial').length} קטגוריות)
                  </span>
                </div>
              </td>
            </tr>

            {!collapsedSections.has('financial') && (
              <>
                {monthlyData.categories.filter(c => c.type === 'financial').map(cat => (
                  <React.Fragment key={cat.code}>
                    <CategoryRow
                      category={cat}
                      months={monthlyData.months}
                      isExpanded={expandedCategories.has(String(cat.code))}
                      onToggle={() => toggleCategory(String(cat.code))}
                      onShowBiur={(month) => showBiur(cat, month)}
                      formatCurrency={formatCurrency}
                    />
                    
                    {expandedCategories.has(String(cat.code)) && cat.vendors?.map((vendor, idx) => (
                      <VendorRow
                        key={`${cat.code}-${idx}`}
                        vendor={vendor}
                        category={cat}
                        months={monthlyData.months}
                        onShowBiur={(month) => showBiur(cat, month, vendor)}
                        formatCurrency={formatCurrency}
                        bgColor="bg-slate-50"
                      />
                    ))}
                    
                    <AdjustmentRow
                      categoryCode={String(cat.code)}
                      months={monthlyData.months}
                      adjustments={adjustments2024}
                      onChange={handleAdjustmentChange}
                      getAdjustmentValue={getAdjustmentValue}
                      formatCurrency={formatCurrency}
                    />

                    <tr className="bg-slate-100 border-t-2 border-slate-400">
                      <td className="border border-gray-300 px-4 py-2 sticky right-0 bg-slate-100 font-semibold text-slate-800">
                        סה"כ {cat.code} - {cat.name}
                      </td>
                      {monthlyData.months.map(m => {
                        const adjustment = getAdjustmentValue(String(cat.code), m);
                        const total = Math.abs(cat.data[m] || 0) + adjustment;
                        return (
                          <td key={m} className="border border-gray-300 px-3 py-2 text-center font-bold text-slate-800">
                            {formatCurrency(total)}
                          </td>
                        );
                      })}
                      <td className="border border-gray-300 px-3 py-2 text-center font-bold text-slate-800">
                        {formatCurrency(
                          Math.abs(cat.data.total) + 
                          monthlyData.months.reduce((sum, m) => sum + getAdjustmentValue(String(cat.code), m), 0)
                        )}
                      </td>
                      <td className="border border-gray-300"></td>
                    </tr>
                  </React.Fragment>
                ))}

                <tr className="bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-400">
                  <td className="border border-gray-300 px-4 py-3 font-bold text-teal-800 sticky right-0 bg-gradient-to-r from-teal-50 to-emerald-50">
                    💰💰 רווח נקי
                  </td>
                  {monthlyData.months.map(m => {
                    const cogsAdjustments = monthlyData.categories
                      .filter(c => c.type === 'cogs')
                      .reduce((sum, cat) => sum + getAdjustmentValue(String(cat.code), m), 0);
                    const cogsCost = Math.abs(monthlyData.totals.cogs[m] || 0) + (openingInventory[m] || 0) - (closingInventory[m] || 0) + cogsAdjustments;
                    const grossProfit = (monthlyData.totals.revenue[m] || 0) - cogsCost;
                    
                    const operatingAdjustments = monthlyData.categories
                      .filter(c => c.type === 'operating')
                      .reduce((sum, cat) => sum + getAdjustmentValue(String(cat.code), m), 0);
                    const operatingExpenses = Math.abs(monthlyData.totals.operating[m] || 0) + operatingAdjustments;
                    const operatingProfit = grossProfit - operatingExpenses;
                    
                    const financialAdjustments = monthlyData.categories
                      .filter(c => c.type === 'financial')
                      .reduce((sum, cat) => sum + getAdjustmentValue(String(cat.code), m), 0);
                    const financialExpenses = Math.abs(monthlyData.totals.financial[m] || 0) + financialAdjustments;
                    const netProfit = operatingProfit - financialExpenses;
                    
                    return (
                      <td key={m} className="border border-gray-300 px-3 py-3 text-center font-bold text-teal-700 text-base">
                        {formatCurrency(netProfit)}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-3 py-3 text-center font-bold text-teal-700 text-xl">
                    {formatCurrency(
                      (monthlyData.totals.revenue.total - 
                      (Math.abs(monthlyData.totals.cogs.total) + 
                      Object.values(openingInventory).reduce((a, b) => a + b, 0) - 
                      Object.values(closingInventory).reduce((a, b) => a + b, 0) +
                      monthlyData.categories
                        .filter(c => c.type === 'cogs')
                        .reduce((sum, cat) => {
                          return sum + monthlyData.months.reduce((s, m) => s + getAdjustmentValue(String(cat.code), m), 0);
                        }, 0))) -
                      (Math.abs(monthlyData.totals.operating.total) +
                      monthlyData.categories
                        .filter(c => c.type === 'operating')
                        .reduce((sum, cat) => {
                          return sum + monthlyData.months.reduce((s, m) => s + getAdjustmentValue(String(cat.code), m), 0);
                        }, 0)) -
                      (Math.abs(monthlyData.totals.financial.total) +
                      monthlyData.categories
                        .filter(c => c.type === 'financial')
                        .reduce((sum, cat) => {
                          return sum + monthlyData.months.reduce((s, m) => s + getAdjustmentValue(String(cat.code), m), 0);
                        }, 0))
                    )}
                  </td>
                  <td className="border border-gray-300"></td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* BiurModal */}
      <BiurModal
        isOpen={showBiurModal}
        data={biurData}
        onClose={() => setShowBiurModal(false)}
        formatCurrency={formatCurrency}
      />

      {/* Inventory Editor Modal */}
      <InventoryEditorModal
        isOpen={showInventoryEditor}
        onClose={() => setShowInventoryEditor(false)}
        openingInventory={convertToYearMonth(openingInventory)}
        closingInventory={convertToYearMonth(closingInventory)}
        onSave={handleInventorySave}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default MonthlyReport;