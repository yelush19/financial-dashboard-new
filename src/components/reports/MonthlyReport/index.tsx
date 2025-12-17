// src/components/reports/MonthlyReport/index.tsx
// 🔥 גרסה עם סינון דינמי - 27/11/2025
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft, Save, Download, TrendingUp, AlertCircle, Edit3, Calculator } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';
import { filterCancellingTransactions } from '../../../utils/transactionFilter';
import { ImportAdjustmentsButton } from '../../ImportAdjustmentsButton';
console.log('🔴 INDEX.TSX LOADED!');


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

import { MONTH_NAMES, STORAGE_KEYS, REPORT_CONFIG } from '../../../constants/reportConstants';

import { StatsCards } from './StatsCards';
import { BiurModal } from './BiurModal';
import { TableHeader } from './TableHeader';
import { CategoryRow } from './CategoryRow';
import { VendorRow } from './VendorRow';
import { InventoryRow } from './InventoryRow';
import { AdjustmentRow } from './AdjustmentRow';
import { InventoryBackupControls } from './InventoryBackupControls';
import { InventoryEditorModal } from './InventoryEditorModal';
import { AdjustmentsEditorModal } from './AdjustmentsEditorModal';
import { DrillDownModal } from './DrillDownModal';
import { useMonthlyInventory } from '../../../hooks/useAdjustments';
import { useAllCategoryAdjustments } from '../../../hooks/useCategoryAdjustments';
import { InventoryInput } from '../../InventoryInput';
import { useSecureCSV } from '../../../hooks/useSecureCSV';

const MonthlyReport: React.FC = () => {
  // שנה נוכחית - צריך להיות מוגדר לפני השימוש בו!
  const selectedYear = 2025;

  const { csvData, loading: csvLoading, error: csvError } = useSecureCSV('TransactionMonthlyModi.csv');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [openingInventory, setOpeningInventory] = useState<Inventory>({});
  const [closingInventory, setClosingInventory] = useState<Inventory>({});
  const [adjustments2024, setAdjustments2024] = useState<Adjustments2024>({});

  // טעינת התאמות מ-Supabase
  const { adjustments: adjustmentsFromSupabase, loading: adjLoading, refresh: refreshAdjustments } =
    useAllCategoryAdjustments(selectedYear);

  const [showBiurModal, setShowBiurModal] = useState(false);
  const [biurData, setBiurData] = useState<BiurData>({
    title: '',
    transactions: []
  });
  const [showInventoryEditor, setShowInventoryEditor] = useState(false);
  const [showAdjustmentsEditor, setShowAdjustmentsEditor] = useState(false);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [drillDownData, setDrillDownData] = useState<{
    categoryCode: number | string;
    categoryName: string;
    month: number;
    monthName: string;
    transactions: Transaction[];
  } | null>(null);

  // Hooks למלאי - חשבון 800 - לכל 12 חודשים
  const inv1 = useMonthlyInventory(800, selectedYear, 1);
  const inv2 = useMonthlyInventory(800, selectedYear, 2);
  const inv3 = useMonthlyInventory(800, selectedYear, 3);
  const inv4 = useMonthlyInventory(800, selectedYear, 4);
  const inv5 = useMonthlyInventory(800, selectedYear, 5);
  const inv6 = useMonthlyInventory(800, selectedYear, 6);
  const inv7 = useMonthlyInventory(800, selectedYear, 7);
  const inv8 = useMonthlyInventory(800, selectedYear, 8);
  const inv9 = useMonthlyInventory(800, selectedYear, 9);
  const inv10 = useMonthlyInventory(800, selectedYear, 10);
  const inv11 = useMonthlyInventory(800, selectedYear, 11);
  const inv12 = useMonthlyInventory(800, selectedYear, 12);

  // מערך של כל ה-hooks למלאי
  const inventoryHooks = [inv1, inv2, inv3, inv4, inv5, inv6, inv7, inv8, inv9, inv10, inv11, inv12];

  useEffect(() => {
    if (!csvData) return;

    const loadTransactions = async () => {
      try {
        setLoading(true);
        setError(csvError);

        Papa.parse(csvData, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            try {
              const parsed: Transaction[] = (results as any).data
                .map((row: any) => ({
                  koteret: parseInt(row['כותרת']) || 0,
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

    loadTransactions();
  }, [csvData, csvError]);

  // עדכון התאמות מ-Supabase
  useEffect(() => {
    if (!adjLoading && adjustmentsFromSupabase) {
      setAdjustments2024(adjustmentsFromSupabase);
    }
  }, [adjustmentsFromSupabase, adjLoading]);

  // עדכון מלאי מ-Supabase hooks
  useEffect(() => {
    const newOpening: Inventory = {};
    const newClosing: Inventory = {};

    inventoryHooks.forEach((hook, index) => {
      const month = index + 1;
      newOpening[month] = hook.opening;
      newClosing[month] = hook.closing;
    });

    setOpeningInventory(newOpening);
    setClosingInventory(newClosing);
  }, [
    inv1.opening, inv1.closing,
    inv2.opening, inv2.closing,
    inv3.opening, inv3.closing,
    inv4.opening, inv4.closing,
    inv5.opening, inv5.closing,
    inv6.opening, inv6.closing,
    inv7.opening, inv7.closing,
    inv8.opening, inv8.closing,
    inv9.opening, inv9.closing,
    inv10.opening, inv10.closing,
    inv11.opening, inv11.closing,
    inv12.opening, inv12.closing
  ]);

  // 🔥 סינון דינמי - מזהה תנועות מתאפסות אוטומטית
  const activeTransactions = useMemo(() => {
    console.log('🟡 useMemo called, transactions.length:', transactions.length);
    if (transactions.length === 0) return [];
    
    const filtered = filterCancellingTransactions(transactions);
    console.log(`✅ סינון דינמי: ${transactions.length} → ${filtered.length} (סוננו ${transactions.length - filtered.length})`);
    
    return filtered;
  }, [transactions]);

  const monthlyData = useMemo((): ProcessedMonthlyData => {
    if (!activeTransactions.length) {
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

    const uniqueMonths = Array.from(new Set(
      activeTransactions
        .filter(tx => tx.date && tx.date.split('/').length === 3)
        .map(tx => parseInt(tx.date.split('/')[1]))
    )).sort((a, b) => a - b);

    // 🔧 לוגיקה חדשה: קיבוץ לפי חשבון (accountKey) במקום ספק
    const processCategory = (
      code: number | string, 
      type: 'income' | 'cogs' | 'operating' | 'financial', 
      filterFn: (tx: Transaction) => boolean
    ) => {
      const categoryTxs = activeTransactions.filter(filterFn);
      const data: MonthlyData = { total: 0 };
      
      const sortCodeName = categoryTxs.length > 0 
        ? categoryTxs[0].sortCodeName 
        : (typeof code === 'string' ? code : `קוד ${code}`);
      
      uniqueMonths.forEach(m => data[m] = 0);
      
      // 🆕 קיבוץ לפי חשבון (accountKey) - רמה 2
      const accountGroups = _.groupBy(categoryTxs, tx => {
        const accountKey = tx.accountKey || 0;
        const accountName = tx.accountName || 'לא ידוע';
        return `${accountKey}|||${accountName}`;
      });
      
      const vendors: VendorData[] = Object.entries(accountGroups)
        .map(([key, txs]) => {
          const [accountKey, accountName] = key.split('|||');
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
            name: accountKey && accountKey !== '0' ? `${accountName} - ${accountKey}` : accountName || 'לא ידוע',
            data: vendorData,
            transactions: txs as Transaction[]
          };
        })
        .filter(v => v.data.total !== 0)
        .sort((a, b) => Math.abs(b.data.total) - Math.abs(a.data.total));

      categoryTxs.forEach(tx => {
        const month = parseInt(tx.date.split('/')[1]);
        if (uniqueMonths.includes(month)) {
          data[month] += tx.amount;
          data.total += tx.amount;
        }
      });

      return { data, vendors, sortCodeName };
    };

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

  const convertToYearMonth = (inventory: Inventory): { [key: string]: number } => {
    const result: { [key: string]: number } = {};
    Object.entries(inventory).forEach(([key, value]) => {
      if (typeof key === 'number' || !key.includes('-')) {
        const monthNum = typeof key === 'string' ? parseInt(key) : key;
        const yearMonthKey = `2025-${String(monthNum).padStart(2, '0')}`;
        result[yearMonthKey] = value;
      } else {
        result[key] = value;
      }
    });
    return result;
  };
  
  const convertFromYearMonth = (inventory: { [key: string]: number }): Inventory => {
    const result: Inventory = {};
    Object.entries(inventory).forEach(([key, value]) => {
      if (key.includes('-')) {
        const [year, monthStr] = key.split('-');
        const month = parseInt(monthStr);
        
        if (year === '2025') {
          result[month] = value;
        } else {
          result[key as any] = value;
        }
      } else {
        result[key as any] = value;
      }
    });
    return result;
  };

  const handleInventorySave = (opening: { [key: string]: number }, closing: { [key: string]: number }) => {
    const convertedOpening = convertFromYearMonth(opening);
    const convertedClosing = convertFromYearMonth(closing);
    
    setOpeningInventory(convertedOpening);
    setClosingInventory(convertedClosing);
    
    console.log('✅ Inventory saved - InventoryEditorModal handles Wix API', {
      opening: convertedOpening,
      closing: convertedClosing
    });
  };

  const handleClosingInventoryChange = (month: number, value: number) => {
    const newClosing = { ...closingInventory, [month]: value };
    setClosingInventory(newClosing);
    
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

  const handleDrillDown = (category: CategoryData, month: number) => {
    let txs: Transaction[];
    
    if (category.code === 'income_site') {
      txs = activeTransactions.filter(tx => 
        tx.sortCode === 600 && tx.accountKey >= 40000 && tx.accountKey < 40020
      );
    } else if (category.code === 'income_superpharm') {
      txs = activeTransactions.filter(tx => 
        tx.sortCode === 600 && tx.accountKey >= 40020
      );
    } else {
      txs = activeTransactions.filter(tx => tx.sortCode === category.code);
    }

    txs = txs.filter(tx => parseInt(tx.date.split('/')[1]) === month);

    setDrillDownData({
      categoryCode: category.code,
      categoryName: category.name,
      month,
      monthName: MONTH_NAMES[month - 1],
      transactions: txs
    });
    setShowDrillDown(true);
  };

  const showBiur = (category: CategoryData, month?: number, vendor?: VendorData) => {
    let txs: Transaction[];
    
    if (vendor) {
      // התנועות כבר מסוננות ב-activeTransactions
      txs = vendor.transactions;
      if (month) {
        txs = txs.filter(tx => parseInt(tx.date.split('/')[1]) === month);
      }
    } else {
      txs = activeTransactions.filter(tx => {
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

    csv += `"סה"כ הכנסות",`;
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

  return (
    <div className="w-full p-6 bg-white">
      <div className="mb-6 pb-4" style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        padding: '1.5rem',
        borderRadius: '12px',
        color: 'white',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <span className="text-4xl">📊</span>
              דוח רווח והפסד חודשי
            </h1>
            <p className="text-sm opacity-90">
              תקופה: {monthlyData.months.length > 0 
                ? `${MONTH_NAMES[monthlyData.months[0] - 1]} - ${MONTH_NAMES[monthlyData.months[monthlyData.months.length - 1] - 1]} 2025` 
                : 'אין נתונים'}
            </p>
            <p className="text-xs opacity-75 mt-1">
              📌 מקור הנתונים: קובץ טרנזקציות (TransactionMonthlyModi.csv)
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowInventoryEditor(true)}
              className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 flex items-center gap-2 transition-all"
            >
              <Edit3 className="w-4 h-4" />
              עדכון מלאי
            </button>
            <button
              onClick={() => setShowAdjustmentsEditor(true)}
              className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 flex items-center gap-2 transition-all"
            >
              <Calculator className="w-4 h-4" />
              עדכוני 2024
            </button>
            <button
              onClick={toggleAllSections}
              className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 flex items-center gap-2 transition-all"
            >
              {collapsedSections.size > 0 ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {collapsedSections.size > 0 ? 'פתח הכל' : 'סגור הכל'}
            </button>
            <button
              onClick={saveInventory}
              className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              שמור מלאי
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              ייצא ל-CSV
            </button>
          </div>
        </div>
      </div>

      <StatsCards
        monthlyData={monthlyData}
        openingInventory={openingInventory}
        closingInventory={closingInventory}
        adjustments2024={adjustments2024}
        formatCurrency={formatCurrency}
        getAdjustmentValue={getAdjustmentValue}
      />

      <div 
        className="overflow-x-auto shadow-lg rounded-lg" 
        style={{ 
          maxHeight: REPORT_CONFIG.MAX_TABLE_HEIGHT, 
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: `${REPORT_CONFIG.SCROLLBAR_COLOR} ${REPORT_CONFIG.SCROLLBAR_TRACK_COLOR}`
        }}
      >
        <table className="w-full border-collapse text-sm">
          <TableHeader months={monthlyData.months} />
          
          <tbody>
            {/* הכנסות */}
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
                  onShowBiur={(month) => month ? handleDrillDown(cat, month) : showBiur(cat)}
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

            {/* עלות המכר */}
            <tr 
              className="bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => toggleSection('cogs')}
            >
              <td colSpan={monthlyData.months.length + 3} className="border border-gray-300 px-4 py-3 font-bold text-gray-800">
                <div className="flex items-center gap-2">
                  {collapsedSections.has('cogs') ? 
                    <ChevronLeft className="w-5 h-5" /> : 
                    <ChevronDown className="w-5 h-5" />
                  }
                  <span>עלות המכר</span>
                  <span className="text-sm font-normal text-gray-600">(כולל מלאי)</span>
                </div>
              </td>
            </tr>

            {!collapsedSections.has('cogs') && (
              <>
                {/* מלאי פתיחה - Supabase */}
                <tr className="bg-green-50">
                  <td className="border border-gray-300 px-4 py-2 sticky right-0 bg-green-50 font-semibold">
                    <span className="mr-4">📦</span>
                    מלאי פתיחה
                  </td>
                  {monthlyData.months.map((m) => {
                    const idx = m - 1;
                    const hook = inventoryHooks[idx];
                    return (
                      <td key={m} className="border border-gray-300 px-2 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={hook.opening}
                            onChange={(e) => hook.updateOpening(parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 text-center border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            disabled={hook.saving}
                          />
                        </div>
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-3 py-2 text-center font-semibold">
                    {formatCurrency(Object.values(openingInventory).reduce((a, b) => a + b, 0))}
                  </td>
                  <td className="border border-gray-300"></td>
                </tr>

                {monthlyData.categories.filter(c => c.type === 'cogs').map(cat => (
                  <React.Fragment key={cat.code}>
                    <CategoryRow
                      category={cat}
                      months={monthlyData.months}
                      isExpanded={expandedCategories.has(String(cat.code))}
                      onToggle={() => toggleCategory(String(cat.code))}
                      onShowBiur={(month) => month ? handleDrillDown(cat, month) : showBiur(cat)}
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
                      indented={true}
                    />

                    <tr className="bg-gray-100 border-t-2 border-gray-400">
                      <td className="border border-gray-300 px-4 py-2 sticky right-0 bg-gray-100 font-semibold text-gray-800">
                        סה"כ {cat.code} מעודכן - {cat.name}
                      </td>
                      {monthlyData.months.map(m => {
                        const adjustment = getAdjustmentValue(String(cat.code), m);
                        const categoryValue = Math.abs(cat.data[m] || 0);
                        const adjustedTotal = categoryValue - adjustment;
                        const revenue = monthlyData.totals.revenue[m] || 0;
                        const percentage = revenue !== 0 ? ((adjustedTotal / revenue) * 100).toFixed(1) : '0.0';
                        return (
                          <td key={m} className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900">
                            <div>{formatCurrency(adjustedTotal)}</div>
                            <div className="text-xs text-gray-600">({percentage}%)</div>
                          </td>
                        );
                      })}
                      <td className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900">
                        <div>{formatCurrency(
                          Math.abs(cat.data.total) - 
                          monthlyData.months.reduce((sum, m) => sum + getAdjustmentValue(String(cat.code), m), 0)
                        )}</div>
                        <div className="text-xs text-gray-600">
                          ({((Math.abs(cat.data.total) - monthlyData.months.reduce((sum, m) => sum + getAdjustmentValue(String(cat.code), m), 0)) / monthlyData.totals.revenue.total * 100).toFixed(1)}%)
                        </div>
                      </td>
                      <td className="border border-gray-300"></td>
                    </tr>
                  </React.Fragment>
                ))}

                {/* מלאי סגירה - Supabase */}
                <tr className="bg-green-50">
                  <td className="border border-gray-300 px-4 py-2 sticky right-0 bg-green-50 font-semibold">
                    <span className="mr-4">📦</span>
                    מלאי סגירה
                  </td>
                  {monthlyData.months.map((m) => {
                    const idx = m - 1;
                    const hook = inventoryHooks[idx];
                    return (
                      <td key={m} className="border border-gray-300 px-2 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            value={hook.closing}
                            onChange={(e) => hook.updateClosing(parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 text-center border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                            disabled={hook.saving}
                          />
                        </div>
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-3 py-2 text-center font-semibold">
                    {formatCurrency(Object.values(closingInventory).reduce((a, b) => a + b, 0))}
                  </td>
                  <td className="border border-gray-300"></td>
                </tr>

                <tr className="bg-gray-100 border-2 border-gray-400">
                  <td className="border border-gray-300 px-4 py-3 font-bold text-gray-800 sticky right-0 bg-gray-100">
                    סה"כ עלות המכר
                  </td>
                  {monthlyData.months.map(m => {
                    const cogsAdjustments = monthlyData.categories
                      .filter(c => c.type === 'cogs')
                      .reduce((sum, cat) => sum + getAdjustmentValue(String(cat.code), m), 0);
                    const cogsCost = Math.abs(monthlyData.totals.cogs[m] || 0) - cogsAdjustments + (openingInventory[m] || 0) - (closingInventory[m] || 0);
                    return (
                      <td key={m} className="border border-gray-300 px-3 py-3 text-center font-bold text-gray-700">
                        {formatCurrency(cogsCost)}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-3 py-3 text-center font-bold text-gray-700 text-base">
                    {formatCurrency(
                      Math.abs(monthlyData.totals.cogs.total) - 
                      monthlyData.categories
                        .filter(c => c.type === 'cogs')
                        .reduce((sum, cat) => {
                          return sum + monthlyData.months.reduce((s, m) => s + getAdjustmentValue(String(cat.code), m), 0);
                        }, 0) +
                      Object.values(openingInventory).reduce((a, b) => a + b, 0) - 
                      Object.values(closingInventory).reduce((a, b) => a + b, 0)
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
                    const cogsCost = Math.abs(monthlyData.totals.cogs[m] || 0) - cogsAdjustments + (openingInventory[m] || 0) - (closingInventory[m] || 0);
                    const grossProfit = (monthlyData.totals.revenue[m] || 0) - cogsCost;
                    const revenue = monthlyData.totals.revenue[m] || 0;
                    const percentage = revenue !== 0 ? ((grossProfit / revenue) * 100).toFixed(1) : '0.0';
                    return (
                      <td key={m} className="border border-gray-300 px-3 py-3 text-center font-bold text-green-700 text-base">
                        <div>{formatCurrency(grossProfit)}</div>
                        <div className="text-xs text-gray-600">({percentage}%)</div>
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-3 py-3 text-center font-bold text-green-700 text-lg">
                    {formatCurrency(
                      monthlyData.totals.revenue.total - 
                      (Math.abs(monthlyData.totals.cogs.total) - 
                      monthlyData.categories
                        .filter(c => c.type === 'cogs')
                        .reduce((sum, cat) => {
                          return sum + monthlyData.months.reduce((s, m) => s + getAdjustmentValue(String(cat.code), m), 0);
                        }, 0) +
                      Object.values(openingInventory).reduce((a, b) => a + b, 0) - 
                      Object.values(closingInventory).reduce((a, b) => a + b, 0))
                    )}
                  </td>
                  <td className="border border-gray-300"></td>
                </tr>
              </>
            )}

            <tr><td colSpan={monthlyData.months.length + 3} className="h-3 bg-gray-50"></td></tr>

            {/* הוצאות תפעול */}
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
                      onShowBiur={(month) => month ? handleDrillDown(cat, month) : showBiur(cat)}
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
                      indented={true}
                    />

                    <tr className="bg-gray-100 border-t-2 border-gray-400">
                      <td className="border border-gray-300 px-4 py-2 sticky right-0 bg-gray-100 font-semibold text-gray-800">
                        סה"כ {cat.code} מעודכן - {cat.name}
                      </td>
                      {monthlyData.months.map(m => {
                        const adjustment = getAdjustmentValue(String(cat.code), m);
                        const categoryValue = Math.abs(cat.data[m] || 0);
                        const adjustedTotal = categoryValue - adjustment;
                        const revenue = monthlyData.totals.revenue[m] || 0;
                        const percentage = revenue !== 0 ? ((adjustedTotal / revenue) * 100).toFixed(1) : '0.0';
                        return (
                          <td key={m} className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900">
                            <div>{formatCurrency(adjustedTotal)}</div>
                            <div className="text-xs text-gray-600">({percentage}%)</div>
                          </td>
                        );
                      })}
                      <td className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900">
                        <div>{formatCurrency(
                          Math.abs(cat.data.total) - 
                          monthlyData.months.reduce((sum, m) => sum + getAdjustmentValue(String(cat.code), m), 0)
                        )}</div>
                      </td>
                      <td className="border border-gray-300"></td>
                    </tr>
                  </React.Fragment>
                ))}

                <tr className="bg-green-50 border-2 border-green-400">
                  <td className="border border-gray-300 px-4 py-3 font-bold text-green-800 sticky right-0 bg-green-50">
                    💼 רווח תפעולי
                  </td>
                  {monthlyData.months.map(m => {
                    const cogsAdjustments = monthlyData.categories
                      .filter(c => c.type === 'cogs')
                      .reduce((sum, cat) => sum + getAdjustmentValue(String(cat.code), m), 0);
                    const cogsCost = Math.abs(monthlyData.totals.cogs[m] || 0) - cogsAdjustments + (openingInventory[m] || 0) - (closingInventory[m] || 0);
                    const grossProfit = (monthlyData.totals.revenue[m] || 0) - cogsCost;
                    const operatingAdjustments = monthlyData.categories
                      .filter(c => c.type === 'operating')
                      .reduce((sum, cat) => sum + getAdjustmentValue(String(cat.code), m), 0);
                    const operatingExpenses = Math.abs(monthlyData.totals.operating[m] || 0) - operatingAdjustments;
                    const operatingProfit = grossProfit - operatingExpenses;
                    const revenue = monthlyData.totals.revenue[m] || 0;
                    const percentage = revenue !== 0 ? ((operatingProfit / revenue) * 100).toFixed(1) : '0.0';
                    return (
                      <td key={m} className="border border-gray-300 px-3 py-3 text-center font-bold text-green-700 text-base">
                        <div>{formatCurrency(operatingProfit)}</div>
                        <div className="text-xs text-gray-600">({percentage}%)</div>
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-3 py-3 text-center font-bold text-green-700 text-lg">
                    {formatCurrency(monthlyData.totals.operatingProfit.total)}
                  </td>
                  <td className="border border-gray-300"></td>
                </tr>
              </>
            )}

            <tr><td colSpan={monthlyData.months.length + 3} className="h-3 bg-gray-50"></td></tr>

            {/* הוצאות מימון */}
            <tr 
              className="bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => toggleSection('financial')}
            >
              <td colSpan={monthlyData.months.length + 3} className="border border-gray-300 px-4 py-3 font-bold text-gray-800">
                <div className="flex items-center gap-2">
                  {collapsedSections.has('financial') ? 
                    <ChevronLeft className="w-5 h-5" /> : 
                    <ChevronDown className="w-5 h-5" />
                  }
                  <span>הוצאות מימון</span>
                  <span className="text-sm font-normal text-gray-600">
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
                      onShowBiur={(month) => month ? handleDrillDown(cat, month) : showBiur(cat)}
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
                  </React.Fragment>
                ))}

                <tr className="bg-green-100 border-2 border-green-500">
                  <td className="border border-gray-300 px-4 py-3 font-bold text-green-900 sticky right-0 bg-green-100">
                    💰💰 רווח נקי
                  </td>
                  {monthlyData.months.map(m => {
                    const cogsAdjustments = monthlyData.categories
                      .filter(c => c.type === 'cogs')
                      .reduce((sum, cat) => sum + getAdjustmentValue(String(cat.code), m), 0);
                    const cogsCost = Math.abs(monthlyData.totals.cogs[m] || 0) - cogsAdjustments + (openingInventory[m] || 0) - (closingInventory[m] || 0);
                    const grossProfit = (monthlyData.totals.revenue[m] || 0) - cogsCost;
                    const operatingAdjustments = monthlyData.categories
                      .filter(c => c.type === 'operating')
                      .reduce((sum, cat) => sum + getAdjustmentValue(String(cat.code), m), 0);
                    const operatingExpenses = Math.abs(monthlyData.totals.operating[m] || 0) - operatingAdjustments;
                    const operatingProfit = grossProfit - operatingExpenses;
                    const financialExpenses = Math.abs(monthlyData.totals.financial[m] || 0);
                    const netProfit = operatingProfit - financialExpenses;
                    const revenue = monthlyData.totals.revenue[m] || 0;
                    const percentage = revenue !== 0 ? ((netProfit / revenue) * 100).toFixed(1) : '0.0';
                    return (
                      <td key={m} className="border border-gray-300 px-3 py-3 text-center font-bold text-green-800 text-base">
                        <div>{formatCurrency(netProfit)}</div>
                        <div className="text-xs text-gray-600">({percentage}%)</div>
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-3 py-3 text-center font-bold text-green-800 text-xl">
                    {formatCurrency(monthlyData.totals.netProfit.total)}
                  </td>
                  <td className="border border-gray-300"></td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      <BiurModal
        isOpen={showBiurModal}
        data={biurData}
        onClose={() => setShowBiurModal(false)}
        formatCurrency={formatCurrency}
      />

      <InventoryEditorModal
        isOpen={showInventoryEditor}
        onClose={() => setShowInventoryEditor(false)}
        openingInventory={convertToYearMonth(openingInventory)}
        closingInventory={convertToYearMonth(closingInventory)}
        onSave={handleInventorySave}
        formatCurrency={formatCurrency}
      />

      <AdjustmentsEditorModal
  isOpen={showAdjustmentsEditor}
  onClose={() => setShowAdjustmentsEditor(false)}
  adjustments={adjustments2024}
  onSave={(newAdj) => {
    setAdjustments2024(newAdj);
    // נשמר ב-Supabase - אין צורך ב-localStorage!
  }}
  formatCurrency={formatCurrency}
  year={selectedYear}
/>

      {drillDownData && (
        <DrillDownModal
          isOpen={showDrillDown}
          onClose={() => {
            setShowDrillDown(false);
            setDrillDownData(null);
          }}
          categoryCode={drillDownData.categoryCode}
          categoryName={drillDownData.categoryName}
          month={drillDownData.month}
          monthName={drillDownData.monthName}
          transactions={drillDownData.transactions}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

export default MonthlyReport;