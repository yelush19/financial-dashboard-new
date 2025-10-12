import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft, FileText, X, Plus, Minus, Save, Edit3, Download, TrendingUp, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';

// ============ TYPES ============
interface Transaction {
  sortCode: number | null;
  sortCodeName: string;
  accountKey: number;
  accountName: string;
  amount: number;
  details: string;
  date: string;
  counterAccountName: string;
  counterAccountNumber: number;
}

interface MonthlyData {
  [month: number]: number;
  total: number;
}

interface VendorData {
  name: string;
  data: MonthlyData;
  transactions: Transaction[];
}

interface CategoryData {
  code: number | string;
  name: string;
  type: 'income' | 'cogs' | 'operating' | 'financial';
  data: MonthlyData;
  vendors?: VendorData[];
}

// ============ CONSTANTS ============
const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

const CARD_COLORS = {
  revenue: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300',
  cogs: 'bg-orange-50 border-orange-300',
  grossProfit: 'bg-green-50 border-green-300',
  operating: 'bg-gray-50 border-gray-300',
  opProfit: 'bg-emerald-50 border-emerald-300',
  financial: 'bg-slate-50 border-slate-300',
  netProfit: 'bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-400'
};

// ============ MAIN COMPONENT ============
const MonthlyReport = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [openingInventory, setOpeningInventory] = useState<{ [month: number]: number }>({});
  const [closingInventory, setClosingInventory] = useState<{ [month: number]: number }>({});
  const [showBiurModal, setShowBiurModal] = useState(false);
  const [biurData, setBiurData] = useState<{ title: string; transactions: Transaction[]; month?: number }>({
    title: '',
    transactions: []
  });

  // ============ LOAD DATA ============
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/TransactionMonthlyModi.csv');
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

    loadTransactions();
  }, []);

  // ============ PROCESS DATA ============
  const monthlyData = useMemo(() => {
    if (!transactions.length) return { 
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

    const uniqueMonths = Array.from(new Set(
      transactions
        .filter(tx => tx.date && tx.date.split('/').length === 3)
        .map(tx => {
          const parts = tx.date.split('/');
          return parseInt(parts[1]);
        })
    )).sort((a, b) => a - b);

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
      { 
        code: 'income_site', 
        name: income_site.sortCodeName || 'הכנסות מכירות - אתר', 
        type: 'income', 
        data: income_site.data,
        vendors: income_site.vendors
      },
      { 
        code: 'income_superpharm', 
        name: income_superpharm.sortCodeName || 'הכנסות מכירות - סופרפארם', 
        type: 'income', 
        data: income_superpharm.data,
        vendors: income_superpharm.vendors
      },
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

  const formatCurrency = (amount: number) => {
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
    localStorage.setItem('openingInventory', JSON.stringify(openingInventory));
    localStorage.setItem('closingInventory', JSON.stringify(closingInventory));
    alert('המלאי נשמר בהצלחה!');
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

    csv += '\nעלות המכר\n';
    monthlyData.categories.filter(c => c.type === 'cogs').forEach(cat => {
      csv += `"${cat.name}",`;
      monthlyData.months.forEach(m => {
        csv += `${Math.abs(cat.data[m] || 0)},`;
      });
      csv += `${Math.abs(cat.data.total)}\n`;
    });
    
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
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600 mb-2">לא נמצאו נתונים</p>
          <p className="text-sm text-gray-500">נא לוודא שקובץ TransactionMonthlyModi.csv קיים בתיקייה</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-white">
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg border ${CARD_COLORS.revenue}`}>
          <div className="text-sm text-gray-600 mb-1">סה"כ הכנסות</div>
          <div className="text-2xl font-bold text-green-700">
            {formatCurrency(monthlyData.totals.revenue.total)}
          </div>
        </div>
        <div className={`p-4 rounded-lg border ${CARD_COLORS.cogs}`}>
          <div className="text-sm text-gray-600 mb-1">עלות המכר</div>
          <div className="text-2xl font-bold text-orange-700">
            {formatCurrency(Math.abs(monthlyData.totals.cogs.total))}
          </div>
        </div>
        <div className={`p-4 rounded-lg border ${CARD_COLORS.opProfit}`}>
          <div className="text-sm text-gray-600 mb-1">רווח תפעולי</div>
          <div className="text-2xl font-bold text-emerald-700">
            {formatCurrency(monthlyData.totals.operatingProfit.total)}
          </div>
        </div>
        <div className={`p-4 rounded-lg border ${CARD_COLORS.netProfit}`}>
          <div className="text-sm text-gray-600 mb-1">רווח נקי</div>
          <div className="text-2xl font-bold text-teal-700">
            {formatCurrency(monthlyData.totals.netProfit.total)}
          </div>
        </div>
      </div>

      <div 
        className="overflow-x-auto shadow-lg rounded-lg" 
        style={{ 
          maxHeight: '600px', 
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#528163 #f1f1f1'
        }}
      >
        <style>{`
          div::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          div::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          div::-webkit-scrollbar-thumb {
            background: #528163;
            border-radius: 4px;
          }
          div::-webkit-scrollbar-thumb:hover {
            background: #2d5f3f;
          }
        `}</style>
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-emerald-50 to-teal-50">
              <th className="border border-gray-300 px-4 py-3 text-right font-semibold min-w-[250px] sticky right-0 bg-gradient-to-r from-emerald-50 to-teal-50">
                קטגוריה
              </th>
              {monthlyData.months.map(m => (
                <th key={m} className="border border-gray-300 px-3 py-3 text-center font-semibold min-w-[120px]">
                  {MONTH_NAMES[m - 1]}
                </th>
              ))}
              <th className="border border-gray-300 px-3 py-3 text-center font-semibold min-w-[130px]">סה"כ</th>
              <th className="border border-gray-300 px-2 py-3 w-12">📝</th>
            </tr>
          </thead>
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
            
            {!collapsedSections.has('income') && (
              <>
            {monthlyData.categories.filter(c => c.type === 'income').map(cat => (
              <React.Fragment key={cat.code}>
                <tr 
                  className="hover:bg-gray-50 cursor-pointer" 
                  onClick={() => toggleCategory(String(cat.code))}
                >
                  <td className="border border-gray-300 px-4 py-2 sticky right-0 bg-white">
                    <div className="flex items-center gap-2">
                      {cat.vendors && cat.vendors.length > 0 && (
                        expandedCategories.has(String(cat.code)) ? 
                          <Minus className="w-4 h-4 text-green-600" /> : 
                          <Plus className="w-4 h-4 text-green-600" />
                      )}
                      <span className="font-medium">600 - {cat.name}</span>
                    </div>
                  </td>
                  {monthlyData.months.map(m => (
                    <td 
                      key={m} 
                      className="border border-gray-300 px-3 py-2 text-center text-green-700 font-medium hover:bg-green-50 cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); showBiur(cat, m); }}
                    >
                      {formatCurrency(cat.data[m] || 0)}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-3 py-2 text-center text-green-700 font-bold">
                    {formatCurrency(cat.data.total)}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    <FileText 
                      className="w-4 h-4 text-green-600 mx-auto cursor-pointer hover:text-green-800"
                      onClick={(e) => { e.stopPropagation(); showBiur(cat); }}
                    />
                  </td>
                </tr>
                
                {expandedCategories.has(String(cat.code)) && cat.vendors?.map((vendor, idx) => (
                  <tr key={`${cat.code}-${idx}`} className="bg-green-50">
                    <td className="border border-gray-300 px-8 py-2 text-sm text-gray-700 sticky right-0 bg-green-50">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">├─</span>
                        <span>{vendor.name}</span>
                      </div>
                    </td>
                    {monthlyData.months.map(m => (
                      <td 
                        key={m} 
                        className="border border-gray-300 px-3 py-2 text-center text-sm hover:bg-green-100 cursor-pointer"
                        onClick={() => showBiur(cat, m, vendor)}
                      >
                        {formatCurrency(vendor.data[m] || 0)}
                      </td>
                    ))}
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                      {formatCurrency(vendor.data.total)}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <FileText 
                        className="w-3 h-3 text-green-600 mx-auto cursor-pointer hover:text-green-800"
                        onClick={() => showBiur(cat, undefined, vendor)}
                      />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            
            <tr className={`${CARD_COLORS.revenue} border-2 border-green-400`}>
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
            </>
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
                  <span className="text-sm font-normal text-orange-600">
                    (כולל מלאי)
                  </span>
                </div>
              </td>
            </tr>

            {!collapsedSections.has('cogs') && (
              <>

            <tr className="bg-blue-50">
              <td className="border border-gray-300 px-6 py-2 sticky right-0 bg-blue-50">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-3 h-3 text-gray-500" />
                  <span className="font-medium">מלאי פתיחה</span>
                </div>
              </td>
              {monthlyData.months.map(m => (
                <td key={m} className="border border-gray-300 px-2 py-2 text-center">
                  <input
                    type="number"
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={openingInventory[m] || 0}
                    onChange={(e) => setOpeningInventory({...openingInventory, [m]: Number(e.target.value)})}
                  />
                </td>
              ))}
              <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                {formatCurrency(Object.values(openingInventory).reduce((a, b) => a + b, 0))}
              </td>
              <td className="border border-gray-300"></td>
            </tr>

            {monthlyData.categories.filter(c => c.type === 'cogs').map(cat => (
              <React.Fragment key={cat.code}>
                <tr 
                  className="hover:bg-orange-50 cursor-pointer" 
                  onClick={() => toggleCategory(String(cat.code))}
                >
                  <td className="border border-gray-300 px-4 py-2 sticky right-0 bg-white">
                    <div className="flex items-center gap-2">
                      {cat.vendors && cat.vendors.length > 0 && (
                        expandedCategories.has(String(cat.code)) ? 
                          <Minus className="w-4 h-4 text-orange-600" /> : 
                          <Plus className="w-4 h-4 text-orange-600" />
                      )}
                      <span className="font-medium">{cat.code} - {cat.name}</span>
                    </div>
                  </td>
                  {monthlyData.months.map(m => (
                    <td 
                      key={m} 
                      className="border border-gray-300 px-3 py-2 text-center font-medium hover:bg-orange-50 cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); showBiur(cat, m); }}
                    >
                      {formatCurrency(Math.abs(cat.data[m] || 0))}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-3 py-2 text-center font-bold">
                    {formatCurrency(Math.abs(cat.data.total))}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    <FileText 
                      className="w-4 h-4 text-orange-600 mx-auto cursor-pointer hover:text-orange-800"
                      onClick={(e) => { e.stopPropagation(); showBiur(cat); }}
                    />
                  </td>
                </tr>
                
                {expandedCategories.has(String(cat.code)) && cat.vendors?.map((vendor, idx) => (
                  <tr key={`${cat.code}-${idx}`} className="bg-orange-50">
                    <td className="border border-gray-300 px-8 py-2 text-sm text-gray-700 sticky right-0 bg-orange-50">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">├─</span>
                        <span>{vendor.name}</span>
                      </div>
                    </td>
                    {monthlyData.months.map(m => (
                      <td 
                        key={m} 
                        className="border border-gray-300 px-3 py-2 text-center text-sm hover:bg-orange-100 cursor-pointer"
                        onClick={() => showBiur(cat, m, vendor)}
                      >
                        {formatCurrency(Math.abs(vendor.data[m] || 0))}
                      </td>
                    ))}
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                      {formatCurrency(Math.abs(vendor.data.total))}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <FileText 
                        className="w-3 h-3 text-orange-600 mx-auto cursor-pointer hover:text-orange-800"
                        onClick={() => showBiur(cat, undefined, vendor)}
                      />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}

            <tr className="bg-blue-50">
              <td className="border border-gray-300 px-6 py-2 sticky right-0 bg-blue-50">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-3 h-3 text-gray-500" />
                  <span className="font-medium">מלאי סגירה</span>
                </div>
              </td>
              {monthlyData.months.map(m => (
                <td key={m} className="border border-gray-300 px-2 py-2 text-center">
                  <input
                    type="number"
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={closingInventory[m] || 0}
                    onChange={(e) => setClosingInventory({...closingInventory, [m]: Number(e.target.value)})}
                  />
                </td>
              ))}
              <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                {formatCurrency(-Object.values(closingInventory).reduce((a, b) => a + b, 0))}
              </td>
              <td className="border border-gray-300"></td>
            </tr>

            <tr className={`${CARD_COLORS.cogs} border-2 border-orange-400`}>
              <td className="border border-gray-300 px-4 py-3 font-bold text-orange-800 sticky right-0 bg-orange-50">
                סה"כ עלות המכר
              </td>
              {monthlyData.months.map(m => {
                const cogsCost = Math.abs(monthlyData.totals.cogs[m] || 0) + (openingInventory[m] || 0) - (closingInventory[m] || 0);
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
                  Object.values(closingInventory).reduce((a, b) => a + b, 0)
                )}
              </td>
              <td className="border border-gray-300"></td>
            </tr>

            <tr className={`${CARD_COLORS.grossProfit} border-2 border-green-400`}>
              <td className="border border-gray-300 px-4 py-3 font-bold text-green-800 sticky right-0 bg-green-50">
                💰 רווח גולמי
              </td>
              {monthlyData.months.map(m => (
                <td key={m} className="border border-gray-300 px-3 py-3 text-center font-bold text-green-700 text-base">
                  {formatCurrency(monthlyData.totals.grossProfit[m] || 0)}
                </td>
              ))}
              <td className="border border-gray-300 px-3 py-3 text-center font-bold text-green-700 text-lg">
                {formatCurrency(monthlyData.totals.grossProfit.total)}
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
                <tr 
                  className="hover:bg-gray-50 cursor-pointer" 
                  onClick={() => toggleCategory(String(cat.code))}
                >
                  <td className="border border-gray-300 px-4 py-2 sticky right-0 bg-white">
                    <div className="flex items-center gap-2">
                      {cat.vendors && cat.vendors.length > 0 && (
                        expandedCategories.has(String(cat.code)) ? 
                          <Minus className="w-4 h-4 text-gray-600" /> : 
                          <Plus className="w-4 h-4 text-gray-600" />
                      )}
                      <span className="font-medium">{cat.code} - {cat.name}</span>
                      {cat.vendors && cat.vendors.length > 0 && (
                        <span className="text-xs text-gray-500">({cat.vendors.length})</span>
                      )}
                    </div>
                  </td>
                  {monthlyData.months.map(m => (
                    <td 
                      key={m} 
                      className="border border-gray-300 px-3 py-2 text-center font-medium hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); showBiur(cat, m); }}
                    >
                      {formatCurrency(Math.abs(cat.data[m] || 0))}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-3 py-2 text-center font-bold">
                    {formatCurrency(Math.abs(cat.data.total))}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    <FileText 
                      className="w-4 h-4 text-gray-600 mx-auto cursor-pointer hover:text-gray-800"
                      onClick={(e) => { e.stopPropagation(); showBiur(cat); }}
                    />
                  </td>
                </tr>
                
                {expandedCategories.has(String(cat.code)) && cat.vendors?.map((vendor, idx) => (
                  <tr key={`${cat.code}-${idx}`} className="bg-gray-50">
                    <td className="border border-gray-300 px-8 py-2 text-sm text-gray-700 sticky right-0 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">├─</span>
                        <span>{vendor.name}</span>
                      </div>
                    </td>
                    {monthlyData.months.map(m => (
                      <td 
                        key={m} 
                        className="border border-gray-300 px-3 py-2 text-center text-sm hover:bg-gray-100 cursor-pointer"
                        onClick={() => showBiur(cat, m, vendor)}
                      >
                        {formatCurrency(Math.abs(vendor.data[m] || 0))}
                      </td>
                    ))}
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                      {formatCurrency(Math.abs(vendor.data.total))}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <FileText 
                        className="w-3 h-3 text-gray-600 mx-auto cursor-pointer hover:text-gray-800"
                        onClick={() => showBiur(cat, undefined, vendor)}
                      />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}

            <tr className={`${CARD_COLORS.opProfit} border-2 border-emerald-400`}>
              <td className="border border-gray-300 px-4 py-3 font-bold text-emerald-800 sticky right-0 bg-emerald-50">
                💼 רווח תפעולי
              </td>
              {monthlyData.months.map(m => (
                <td key={m} className="border border-gray-300 px-3 py-3 text-center font-bold text-emerald-700 text-base">
                  {formatCurrency(monthlyData.totals.operatingProfit[m] || 0)}
                </td>
              ))}
              <td className="border border-gray-300 px-3 py-3 text-center font-bold text-emerald-700 text-lg">
                {formatCurrency(monthlyData.totals.operatingProfit.total)}
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
                <tr 
                  className="hover:bg-slate-50 cursor-pointer" 
                  onClick={() => toggleCategory(String(cat.code))}
                >
                  <td className="border border-gray-300 px-4 py-2 sticky right-0 bg-white">
                    <div className="flex items-center gap-2">
                      {cat.vendors && cat.vendors.length > 0 && (
                        expandedCategories.has(String(cat.code)) ? 
                          <Minus className="w-4 h-4 text-slate-600" /> : 
                          <Plus className="w-4 h-4 text-slate-600" />
                      )}
                      <span className="font-medium">{cat.code} - {cat.name}</span>
                      {cat.vendors && cat.vendors.length > 0 && (
                        <span className="text-xs text-gray-500">({cat.vendors.length})</span>
                      )}
                    </div>
                  </td>
                  {monthlyData.months.map(m => (
                    <td 
                      key={m} 
                      className="border border-gray-300 px-3 py-2 text-center font-medium hover:bg-slate-50 cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); showBiur(cat, m); }}
                    >
                      {formatCurrency(Math.abs(cat.data[m] || 0))}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-3 py-2 text-center font-bold">
                    {formatCurrency(Math.abs(cat.data.total))}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    <FileText 
                      className="w-4 h-4 text-slate-600 mx-auto cursor-pointer hover:text-slate-800"
                      onClick={(e) => { e.stopPropagation(); showBiur(cat); }}
                    />
                  </td>
                </tr>
                
                {expandedCategories.has(String(cat.code)) && cat.vendors?.map((vendor, idx) => (
                  <tr key={`${cat.code}-${idx}`} className="bg-slate-50">
                    <td className="border border-gray-300 px-8 py-2 text-sm text-gray-700 sticky right-0 bg-slate-50">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">├─</span>
                        <span>{vendor.name}</span>
                      </div>
                    </td>
                    {monthlyData.months.map(m => (
                      <td 
                        key={m} 
                        className="border border-gray-300 px-3 py-2 text-center text-sm hover:bg-slate-100 cursor-pointer"
                        onClick={() => showBiur(cat, m, vendor)}
                      >
                        {formatCurrency(Math.abs(vendor.data[m] || 0))}
                      </td>
                    ))}
                    <td className="border border-gray-300 px-3 py-2 text-center text-sm font-medium">
                      {formatCurrency(Math.abs(vendor.data.total))}
                    </td>
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <FileText 
                        className="w-3 h-3 text-slate-600 mx-auto cursor-pointer hover:text-slate-800"
                        onClick={() => showBiur(cat, undefined, vendor)}
                      />
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}

            <tr className={`${CARD_COLORS.netProfit} border-2 border-teal-400`}>
              <td className="border border-gray-300 px-4 py-3 font-bold text-teal-800 sticky right-0 bg-gradient-to-r from-teal-50 to-emerald-50">
                💰💰 רווח נקי
              </td>
              {monthlyData.months.map(m => (
                <td key={m} className="border border-gray-300 px-3 py-3 text-center font-bold text-teal-700 text-base">
                  {formatCurrency(monthlyData.totals.netProfit[m] || 0)}
                </td>
              ))}
              <td className="border border-gray-300 px-3 py-3 text-center font-bold text-teal-700 text-xl">
                {formatCurrency(monthlyData.totals.netProfit.total)}
              </td>
              <td className="border border-gray-300"></td>
            </tr>
            </>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
        <p className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          💡 הוראות שימוש:
        </p>
        <ul className="text-amber-700 space-y-1 mr-6">
          <li>• לחץ על כותרת קבוצה (הכנסות/עלות המכר/הוצאות) כדי לקפל/לפתוח</li>
          <li>• השתמש בכפתור "פתח/סגור הכל" לשליטה מהירה</li>
          <li>• לחץ על <Plus className="w-3 h-3 inline mx-1" /> כדי לפתוח פירוט ספקים/לקוחות</li>
          <li>• לחץ על <FileText className="w-3 h-3 inline mx-1" /> לצפייה בביאור מפורט של כל התנועות</li>
          <li>• לחץ על סכום בטבלה לראות ביאור חודשי ספציפי</li>
          <li>• ערוך את המלאי בשדות הכחולים ולחץ על "שמור מלאי" לשמירה</li>
          <li>• השתמש ב"ייצא ל-CSV" לייצוא הדוח לאקסל</li>
        </ul>
      </div>

      {showBiurModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{biurData.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {biurData.transactions.length} תנועות | סה"כ: {formatCurrency(
                    biurData.transactions.reduce((sum, tx) => sum + tx.amount, 0)
                  )}
                </p>
              </div>
              <button 
                onClick={() => setShowBiurModal(false)} 
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="border px-3 py-2 text-right">תאריך</th>
                    <th className="border px-3 py-2 text-right">חשבון</th>
                    <th className="border px-3 py-2 text-right">שם חשבון</th>
                    <th className="border px-3 py-2 text-right">פרטים</th>
                    <th className="border px-3 py-2 text-right">ח-ן נגדי</th>
                    <th className="border px-3 py-2 text-right">שם ח-ן נגדי</th>
                    <th className="border px-3 py-2 text-left">סכום</th>
                  </tr>
                </thead>
                <tbody>
                  {biurData.transactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 text-sm">{tx.date}</td>
                      <td className="border px-3 py-2 text-sm font-medium text-blue-600">{tx.accountKey}</td>
                      <td className="border px-3 py-2 text-sm">{tx.accountName}</td>
                      <td className="border px-3 py-2 text-sm max-w-xs truncate" title={tx.details}>{tx.details}</td>
                      <td className="border px-3 py-2 text-sm font-medium text-purple-600">
                        {tx.counterAccountNumber || '-'}
                      </td>
                      <td className="border px-3 py-2 text-sm">
                        {tx.counterAccountName || '-'}
                      </td>
                      <td className="border px-3 py-2 text-sm text-left font-medium">
                        {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 sticky bottom-0">
                  <tr>
                    <td colSpan={6} className="border px-3 py-2 text-right font-bold">סה"כ:</td>
                    <td className="border px-3 py-2 text-left font-bold">
                      {formatCurrency(biurData.transactions.reduce((sum, tx) => sum + tx.amount, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyReport;