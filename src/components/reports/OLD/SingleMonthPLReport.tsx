import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, FileText, X, Plus, Minus, Download, Calendar } from 'lucide-react';
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

interface VendorData {
  name: string;
  amount: number;
  transactions: Transaction[];
}

interface CategoryData {
  code: number | string;
  name: string;
  type: 'income' | 'cogs' | 'operating' | 'financial';
  amount: number;
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
const SingleMonthPLReport = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showBiurModal, setShowBiurModal] = useState(false);
  const [biurData, setBiurData] = useState<{ title: string; transactions: Transaction[] }>({
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
              
              // Auto-select first available month
              const months = Array.from(new Set(
                parsed
                  .filter(tx => tx.date && tx.date.split('/').length === 3)
                  .map(tx => parseInt(tx.date.split('/')[1]))
              )).sort((a, b) => a - b);
              
              if (months.length > 0) {
                setSelectedMonth(months[0]);
              }
              
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

  // ============ AVAILABLE MONTHS ============
  const availableMonths = useMemo(() => {
    return Array.from(new Set(
      transactions
        .filter(tx => tx.date && tx.date.split('/').length === 3)
        .map(tx => parseInt(tx.date.split('/')[1]))
    )).sort((a, b) => a - b);
  }, [transactions]);

  // ============ PROCESS DATA FOR SELECTED MONTH ============
  const monthData = useMemo(() => {
    if (!selectedMonth || !transactions.length) return {
      categories: [],
      totals: {
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        operating: 0,
        operatingProfit: 0,
        financial: 0,
        netProfit: 0
      }
    };

    const monthTxs = transactions.filter(tx => parseInt(tx.date.split('/')[1]) === selectedMonth);

    const processCategory = (
      code: number | string,
      type: 'income' | 'cogs' | 'operating' | 'financial',
      filterFn: (tx: Transaction) => boolean
    ) => {
      const categoryTxs = monthTxs.filter(filterFn);
      
      const sortCodeName = categoryTxs.length > 0 
        ? categoryTxs[0].sortCodeName 
        : (typeof code === 'string' ? code : `קוד ${code}`);
      
      const vendorGroups = _.groupBy(categoryTxs, tx => {
        const counterNum = tx.counterAccountNumber || 0;
        const counterName = tx.counterAccountName || tx.details.split(' ')[0] || 'לא ידוע';
        return `${counterNum}|||${counterName}`;
      });
      
      const vendors: VendorData[] = Object.entries(vendorGroups)
        .map(([key, txs]) => {
          const [counterNum, counterName] = key.split('|||');
          const amount = (txs as Transaction[]).reduce((sum, tx) => sum + tx.amount, 0);
          
          return {
            name: counterNum && counterNum !== '0' ? `${counterName} - ${counterNum}` : counterName || 'לא ידוע',
            amount,
            transactions: txs as Transaction[]
          };
        })
        .filter(v => v.amount !== 0)
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

      const amount = categoryTxs.reduce((sum, tx) => sum + tx.amount, 0);

      return { amount, vendors, sortCodeName };
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
        amount: income_site.amount,
        vendors: income_site.vendors
      },
      { 
        code: 'income_superpharm', 
        name: income_superpharm.sortCodeName || 'הכנסות מכירות - סופרפארם', 
        type: 'income', 
        amount: income_superpharm.amount,
        vendors: income_superpharm.vendors
      },
      { code: 800, name: cogs800.sortCodeName, type: 'cogs', amount: cogs800.amount, vendors: cogs800.vendors },
      { code: 806, name: cogs806.sortCodeName, type: 'cogs', amount: cogs806.amount, vendors: cogs806.vendors },
      { code: 801, name: op801.sortCodeName, type: 'operating', amount: op801.amount, vendors: op801.vendors },
      { code: 802, name: op802.sortCodeName, type: 'operating', amount: op802.amount, vendors: op802.vendors },
      { code: 804, name: op804.sortCodeName, type: 'operating', amount: op804.amount, vendors: op804.vendors },
      { code: 805, name: op805.sortCodeName, type: 'operating', amount: op805.amount, vendors: op805.vendors },
      { code: 811, name: op811.sortCodeName, type: 'operating', amount: op811.amount, vendors: op811.vendors },
      { code: 813, name: fin813.sortCodeName, type: 'financial', amount: fin813.amount, vendors: fin813.vendors },
      { code: 990, name: fin990.sortCodeName, type: 'financial', amount: fin990.amount, vendors: fin990.vendors },
      { code: 991, name: fin991.sortCodeName, type: 'financial', amount: fin991.amount, vendors: fin991.vendors },
    ];

    const revenue = categories.filter(c => c.type === 'income').reduce((sum, c) => sum + c.amount, 0);
    const cogs = categories.filter(c => c.type === 'cogs').reduce((sum, c) => sum + c.amount, 0);
    const operating = categories.filter(c => c.type === 'operating').reduce((sum, c) => sum + c.amount, 0);
    const financial = categories.filter(c => c.type === 'financial').reduce((sum, c) => sum + c.amount, 0);

    const grossProfit = revenue + cogs;
    const operatingProfit = grossProfit + operating;
    const netProfit = operatingProfit + financial;

    return {
      categories,
      totals: { revenue, cogs, grossProfit, operating, operatingProfit, financial, netProfit }
    };
  }, [transactions, selectedMonth]);

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

  const showBiur = (category: CategoryData, vendor?: VendorData) => {
    let txs: Transaction[];
    
    if (vendor) {
      txs = vendor.transactions;
    } else {
      txs = transactions.filter(tx => {
        if (parseInt(tx.date.split('/')[1]) !== selectedMonth) return false;
        
        if (category.code === 'income_site') {
          return tx.sortCode === 600 && tx.accountKey >= 40000 && tx.accountKey < 40020;
        } else if (category.code === 'income_superpharm') {
          return tx.sortCode === 600 && tx.accountKey >= 40020;
        } else {
          return tx.sortCode === category.code;
        }
      });
    }

    const categoryName = category.name;
    const title = vendor 
      ? `${categoryName} - ${vendor.name} - ${MONTH_NAMES[selectedMonth! - 1]}`
      : `${categoryName} - ${MONTH_NAMES[selectedMonth! - 1]}`;

    setBiurData({ title, transactions: txs });
    setShowBiurModal(true);
  };

  const exportToCSV = () => {
    if (!selectedMonth) return;
    
    let csv = '\ufeffקטגוריה,סכום\n';

    csv += '\nהכנסות\n';
    monthData.categories.filter(c => c.type === 'income').forEach(cat => {
      csv += `"${cat.name}",${cat.amount}\n`;
    });
    csv += `"סה"כ הכנסות",${monthData.totals.revenue}\n`;

    csv += '\nעלות מכר\n';
    monthData.categories.filter(c => c.type === 'cogs').forEach(cat => {
      csv += `"${cat.name}",${cat.amount}\n`;
    });
    csv += `"סה"כ עלות מכר",${monthData.totals.cogs}\n`;
    csv += `"רווח גולמי",${monthData.totals.grossProfit}\n`;

    csv += '\nהוצאות תפעול\n';
    monthData.categories.filter(c => c.type === 'operating').forEach(cat => {
      csv += `"${cat.name}",${cat.amount}\n`;
    });
    csv += `"סה"כ הוצאות תפעול",${monthData.totals.operating}\n`;
    csv += `"רווח תפעולי",${monthData.totals.operatingProfit}\n`;

    csv += '\nהוצאות מימון\n';
    monthData.categories.filter(c => c.type === 'financial').forEach(cat => {
      csv += `"${cat.name}",${cat.amount}\n`;
    });
    csv += `"סה"כ הוצאות מימון",${monthData.totals.financial}\n`;
    csv += `"רווח נקי",${monthData.totals.netProfit}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `PL_${MONTH_NAMES[selectedMonth - 1]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ============ LOADING & ERROR STATES ============
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f7fafc]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#528163] mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f7fafc]">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 font-semibold">שגיאה: {error}</p>
        </div>
      </div>
    );
  }

  // ============ RENDER ============
  return (
    <div className="min-h-screen bg-[#f7fafc] p-6" dir="rtl">
      {/* Header with Month Selector */}
      <div className="mb-6 bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#17320b] mb-2">דוח רווח והפסד - תצוגת חודש</h1>
            <p className="text-gray-600">תצוגה מפורטת עם כל רמות הביאורים</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="text-[#528163]" size={20} />
              <select
                value={selectedMonth || ''}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 border-2 border-[#528163] rounded-lg bg-white text-[#17320b] font-semibold focus:outline-none focus:ring-2 focus:ring-[#528163]"
              >
                {availableMonths.map(month => (
                  <option key={month} value={month}>
                    {MONTH_NAMES[month - 1]}
                  </option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#528163] text-white rounded-lg shadow hover:bg-[#17320b] transition-colors"
            >
              <Download size={18} />
              ייצוא ל-CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className={`${CARD_COLORS.revenue} border-2 rounded-xl p-4 shadow-md`}>
          <div className="text-sm font-medium text-gray-600 mb-1">💰 הכנסות</div>
          <div className="text-2xl font-bold text-[#528163]">
            {formatCurrency(monthData.totals.revenue)}
          </div>
        </div>
        
        <div className={`${CARD_COLORS.grossProfit} border-2 rounded-xl p-4 shadow-md`}>
          <div className="text-sm font-medium text-gray-600 mb-1">💎 רווח גולמי</div>
          <div className={`text-2xl font-bold ${monthData.totals.grossProfit >= 0 ? 'text-[#528163]' : 'text-red-600'}`}>
            {formatCurrency(monthData.totals.grossProfit)}
          </div>
        </div>
        
        <div className={`${CARD_COLORS.opProfit} border-2 rounded-xl p-4 shadow-md`}>
          <div className="text-sm font-medium text-gray-600 mb-1">📊 רווח תפעולי</div>
          <div className={`text-2xl font-bold ${monthData.totals.operatingProfit >= 0 ? 'text-[#528163]' : 'text-red-600'}`}>
            {formatCurrency(monthData.totals.operatingProfit)}
          </div>
        </div>
        
        <div className={`${CARD_COLORS.netProfit} border-2 rounded-xl p-4 shadow-md`}>
          <div className="text-sm font-medium text-gray-600 mb-1">💰💰 רווח נקי</div>
          <div className={`text-2xl font-bold ${monthData.totals.netProfit >= 0 ? 'text-teal-700' : 'text-red-600'}`}>
            {formatCurrency(monthData.totals.netProfit)}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" dir="rtl">
            <thead className="bg-[#e4e5e9] text-[#17320b]">
              <tr>
                <th className="border border-gray-300 px-4 py-3 text-right font-bold sticky right-0 bg-[#e4e5e9]">
                  סעיף
                </th>
                <th className="border border-gray-300 px-3 py-3 text-center font-bold min-w-[150px]">
                  סכום
                </th>
                <th className="border border-gray-300 px-2 py-3 text-center font-bold w-16">
                  ביאור
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Revenue Section */}
              <tr 
                className={`${CARD_COLORS.revenue} cursor-pointer hover:opacity-80`}
                onClick={() => toggleSection('income')}
              >
                <td className="border border-gray-300 px-4 py-3 font-bold text-[#17320b] sticky right-0 bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="flex items-center gap-2">
                    {collapsedSections.has('income') ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    💰 הכנסות
                  </div>
                </td>
                <td className="border border-gray-300 px-3 py-3 text-center font-bold text-[#528163] text-lg">
                  {formatCurrency(monthData.totals.revenue)}
                </td>
                <td className="border border-gray-300"></td>
              </tr>

              {/* Income Categories */}
              {!collapsedSections.has('income') && monthData.categories.filter(c => c.type === 'income').map((cat) => (
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
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                      {formatCurrency(Math.abs(cat.amount))}
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
                      <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                        {formatCurrency(Math.abs(vendor.amount))}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center">
                        <FileText 
                          className="w-3 h-3 text-slate-600 mx-auto cursor-pointer hover:text-slate-800"
                          onClick={() => showBiur(cat, vendor)}
                        />
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {/* COGS Section */}
              {!collapsedSections.has('income') && (
                <>
                  <tr className={CARD_COLORS.cogs}>
                    <td className="border border-gray-300 px-4 py-3 font-bold text-gray-700 sticky right-0 bg-orange-50">
                      📦 עלות מכר
                    </td>
                    <td className="border border-gray-300 px-3 py-3 text-center font-bold text-gray-800">
                      {formatCurrency(Math.abs(monthData.totals.cogs))}
                    </td>
                    <td className="border border-gray-300"></td>
                  </tr>

                  {monthData.categories.filter(c => c.type === 'cogs').map((cat) => (
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
                        <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                          {formatCurrency(Math.abs(cat.amount))}
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
                          <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                            {formatCurrency(Math.abs(vendor.amount))}
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-center">
                            <FileText 
                              className="w-3 h-3 text-slate-600 mx-auto cursor-pointer hover:text-slate-800"
                              onClick={() => showBiur(cat, vendor)}
                            />
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}

                  {/* Gross Profit */}
                  <tr className={`${CARD_COLORS.grossProfit} border-2 border-green-400`}>
                    <td className="border border-gray-300 px-4 py-3 font-bold text-[#528163] sticky right-0 bg-green-50">
                      💎 רווח גולמי
                    </td>
                    <td className={`border border-gray-300 px-3 py-3 text-center font-bold text-lg ${monthData.totals.grossProfit >= 0 ? 'text-[#528163]' : 'text-red-600'}`}>
                      {formatCurrency(monthData.totals.grossProfit)}
                    </td>
                    <td className="border border-gray-300"></td>
                  </tr>
                </>
              )}

              {/* Operating Expenses Section */}
              <tr 
                className={`${CARD_COLORS.operating} cursor-pointer hover:opacity-80`}
                onClick={() => toggleSection('operating')}
              >
                <td className="border border-gray-300 px-4 py-3 font-bold text-gray-700 sticky right-0 bg-gray-50">
                  <div className="flex items-center gap-2">
                    {collapsedSections.has('operating') ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    🏢 הוצאות תפעול
                  </div>
                </td>
                <td className="border border-gray-300 px-3 py-3 text-center font-bold text-gray-800 text-lg">
                  {formatCurrency(Math.abs(monthData.totals.operating))}
                </td>
                <td className="border border-gray-300"></td>
              </tr>

              {/* Operating Categories */}
              {!collapsedSections.has('operating') && monthData.categories.filter(c => c.type === 'operating').map((cat) => (
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
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                      {formatCurrency(Math.abs(cat.amount))}
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
                      <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                        {formatCurrency(Math.abs(vendor.amount))}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center">
                        <FileText 
                          className="w-3 h-3 text-slate-600 mx-auto cursor-pointer hover:text-slate-800"
                          onClick={() => showBiur(cat, vendor)}
                        />
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {/* Operating Profit */}
              {!collapsedSections.has('operating') && (
                <tr className={`${CARD_COLORS.opProfit} border-2 border-emerald-400`}>
                  <td className="border border-gray-300 px-4 py-3 font-bold text-[#528163] sticky right-0 bg-emerald-50">
                    📊 רווח תפעולי
                  </td>
                  <td className={`border border-gray-300 px-3 py-3 text-center font-bold text-lg ${monthData.totals.operatingProfit >= 0 ? 'text-[#528163]' : 'text-red-600'}`}>
                    {formatCurrency(monthData.totals.operatingProfit)}
                  </td>
                  <td className="border border-gray-300"></td>
                </tr>
              )}

              {/* Financial Expenses */}
              <tr className={CARD_COLORS.financial}>
                <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-700 sticky right-0 bg-slate-50">
                  🏦 הוצאות מימון
                </td>
                <td className="border border-gray-300 px-3 py-3 text-center font-semibold text-gray-800">
                  {formatCurrency(Math.abs(monthData.totals.financial))}
                </td>
                <td className="border border-gray-300"></td>
              </tr>

              {monthData.categories.filter(c => c.type === 'financial').map((cat) => (
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
                    <td className="border border-gray-300 px-3 py-2 text-center font-medium">
                      {formatCurrency(Math.abs(cat.amount))}
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
                      <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                        {formatCurrency(Math.abs(vendor.amount))}
                      </td>
                      <td className="border border-gray-300 px-2 py-2 text-center">
                        <FileText 
                          className="w-3 h-3 text-slate-600 mx-auto cursor-pointer hover:text-slate-800"
                          onClick={() => showBiur(cat, vendor)}
                        />
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {/* Net Profit */}
              <tr className={`${CARD_COLORS.netProfit} border-2 border-teal-400`}>
                <td className="border border-gray-300 px-4 py-3 font-bold text-teal-800 sticky right-0 bg-gradient-to-r from-teal-50 to-emerald-50">
                  💰💰 רווח נקי
                </td>
                <td className={`border border-gray-300 px-3 py-3 text-center font-bold text-xl ${monthData.totals.netProfit >= 0 ? 'text-teal-700' : 'text-red-600'}`}>
                  {formatCurrency(monthData.totals.netProfit)}
                </td>
                <td className="border border-gray-300"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
        <p className="font-semibold text-amber-800 mb-2">💡 הוראות שימוש:</p>
        <ul className="text-amber-700 space-y-1 mr-6">
          <li>• בחרי חודש מהרשימה הנפתחת כדי לראות את הדוח שלו</li>
          <li>• לחצי על כותרת קבוצה (הכנסות/הוצאות תפעול) כדי לקפל/לפתוח</li>
          <li>• לחצי על <Plus className="w-3 h-3 inline mx-1" /> כדי לפתוח פירוט ספקים/לקוחות</li>
          <li>• לחצי על <FileText className="w-3 h-3 inline mx-1" /> לצפייה בביאור מפורט של כל התנועות</li>
          <li>• השתמשי ב"ייצוא ל-CSV" ליצוא הדוח לאקסל</li>
        </ul>
      </div>

      {/* Biur Modal */}
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

export default SingleMonthPLReport;
