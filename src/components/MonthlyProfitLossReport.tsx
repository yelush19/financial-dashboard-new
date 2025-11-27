import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Download, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

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

// ============ CONSTANTS ============
const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

const COLORS = ['#528163', '#8dd1bb', '#17320b', '#c0c2c3', '#e4e5e9', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'];

const CARD_COLORS = {
  revenue: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300',
  cogs: 'bg-orange-50 border-orange-300',
  grossProfit: 'bg-green-50 border-green-300',
  operating: 'bg-gray-50 border-gray-300',
  opProfit: 'bg-emerald-50 border-emerald-300',
  financial: 'bg-slate-50 border-slate-300',
  netProfit: 'bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-400'
};

// ============ HELPER FUNCTIONS ============
const formatCurrency = (value: number): string => {
  if (value === 0) return '0';
  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString('he-IL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
  return value < 0 ? `(${formatted})` : formatted;
};

const getMonthFromDate = (dateStr: string): number | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return parseInt(parts[1], 10);
  }
  return null;
};

// ============ MAIN COMPONENT ============
const MonthlyProfitLossReport = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

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

  // ============ FILTER BY SEARCH ============
  const filteredTransactions = useMemo(() => {
    if (!search.trim()) return transactions;
    const searchLower = search.toLowerCase();
    return transactions.filter(tx => 
      tx.accountName.toLowerCase().includes(searchLower) ||
      tx.sortCodeName.toLowerCase().includes(searchLower) ||
      tx.details.toLowerCase().includes(searchLower) ||
      String(tx.accountKey).includes(searchLower)
    );
  }, [transactions, search]);

  // ============ PROCESS DATA BY MONTH ============
  const monthlyData = useMemo(() => {
    if (!filteredTransactions.length) return {
      months: [],
      data: [],
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

    // Get unique months
    const monthsSet = new Set<number>();
    filteredTransactions.forEach(tx => {
      const month = getMonthFromDate(tx.date);
      if (month) monthsSet.add(month);
    });
    const months = Array.from(monthsSet).sort((a, b) => a - b);

    // Process data by month
    const data = months.map(month => {
      const monthTxs = filteredTransactions.filter(tx => getMonthFromDate(tx.date) === month);
      
      // Income (600, 700)
      const revenue = monthTxs
        .filter(tx => tx.sortCode && [600, 700].includes(tx.sortCode))
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      // Cost of goods sold (800)
      const cogs = monthTxs
        .filter(tx => tx.sortCode === 800)
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      // Operating expenses (801, 802, 804, 805, 806, 811)
      const operating = monthTxs
        .filter(tx => tx.sortCode && [801, 802, 804, 805, 806, 811].includes(tx.sortCode))
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      // Financial expenses (813, 990, 991)
      const financial = monthTxs
        .filter(tx => tx.sortCode && [813, 990, 991].includes(tx.sortCode))
        .reduce((sum, tx) => sum + tx.amount, 0);
      
      const grossProfit = revenue + cogs; // cogs is negative
      const operatingProfit = grossProfit + operating; // operating is negative
      const netProfit = operatingProfit + financial; // financial is negative

      return {
        month,
        monthName: MONTH_NAMES[month - 1],
        revenue,
        cogs,
        grossProfit,
        operating,
        operatingProfit,
        financial,
        netProfit
      };
    });

    // Calculate totals
    const totals = {
      revenue: data.reduce((sum, d) => sum + d.revenue, 0),
      cogs: data.reduce((sum, d) => sum + d.cogs, 0),
      grossProfit: data.reduce((sum, d) => sum + d.grossProfit, 0),
      operating: data.reduce((sum, d) => sum + d.operating, 0),
      operatingProfit: data.reduce((sum, d) => sum + d.operatingProfit, 0),
      financial: data.reduce((sum, d) => sum + d.financial, 0),
      netProfit: data.reduce((sum, d) => sum + d.netProfit, 0)
    };

    return { months, data, totals };
  }, [filteredTransactions]);

  // ============ EXPENSE PIE CHART DATA ============
  const expensePieData = useMemo(() => {
    if (!monthlyData.data.length) return [];
    
    const lastMonth = monthlyData.months[monthlyData.months.length - 1];
    const lastMonthTxs = filteredTransactions.filter(tx => getMonthFromDate(tx.date) === lastMonth);
    
    const categories: { [key: string]: number } = {};
    
    lastMonthTxs
      .filter(tx => tx.amount < 0)
      .forEach(tx => {
        const catName = tx.sortCodeName || 'אחר';
        categories[catName] = (categories[catName] || 0) + Math.abs(tx.amount);
      });
    
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, monthlyData]);

  // ============ EXPORT TO CSV ============
  const exportToCSV = () => {
    const headers = ['חודש', 'הכנסות', 'עלות מכר', 'רווח גולמי', 'הוצאות תפעול', 'רווח תפעולי', 'הוצאות מימון', 'רווח נקי'];
    const rows = monthlyData.data.map(d => [
      d.monthName,
      formatCurrency(d.revenue),
      formatCurrency(d.cogs),
      formatCurrency(d.grossProfit),
      formatCurrency(d.operating),
      formatCurrency(d.operatingProfit),
      formatCurrency(d.financial),
      formatCurrency(d.netProfit)
    ]);
    
    // Add totals row
    rows.push([
      'סה"כ',
      formatCurrency(monthlyData.totals.revenue),
      formatCurrency(monthlyData.totals.cogs),
      formatCurrency(monthlyData.totals.grossProfit),
      formatCurrency(monthlyData.totals.operating),
      formatCurrency(monthlyData.totals.operatingProfit),
      formatCurrency(monthlyData.totals.financial),
      formatCurrency(monthlyData.totals.netProfit)
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'monthly_profit_loss_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ============ TOGGLE SECTION ============
  const toggleSection = (section: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(section)) {
      newCollapsed.delete(section);
    } else {
      newCollapsed.add(section);
    }
    setCollapsedSections(newCollapsed);
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#17320b] mb-2">דוח רווח והפסד חודשי</h1>
        <p className="text-gray-600">תצוגה מפורטת של רווחיות לפי חודשים</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#528163] text-white rounded-lg shadow hover:bg-[#17320b] transition-colors"
        >
          <Download size={18} />
          ייצוא ל-CSV
        </button>
        
        <div className="flex items-center border rounded-lg px-3 bg-white shadow-sm border-gray-300 flex-grow">
          <Search className="text-gray-500" size={18} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="חיפוש חשבון / סעיף / פירוט..."
            className="px-3 py-2 w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Trend Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4 text-[#17320b]">מגמת רווחיות חודשית</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthName" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#528163" strokeWidth={2} name="הכנסות" />
              <Line type="monotone" dataKey="grossProfit" stroke="#8dd1bb" strokeWidth={2} name="רווח גולמי" />
              <Line type="monotone" dataKey="operatingProfit" stroke="#17320b" strokeWidth={2} name="רווח תפעולי" />
              <Line type="monotone" dataKey="netProfit" stroke="#c0c2c3" strokeWidth={2} name="רווח נקי" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Pie Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold mb-4 text-[#17320b]">
            פילוח הוצאות - {monthlyData.data.length > 0 ? monthlyData.data[monthlyData.data.length - 1].monthName : ''}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expensePieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {expensePieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
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
                {monthlyData.months.map(month => (
                  <th key={month} className="border border-gray-300 px-3 py-3 text-center font-bold min-w-[100px]">
                    {MONTH_NAMES[month - 1]}
                  </th>
                ))}
                <th className="border border-gray-300 px-3 py-3 text-center font-bold min-w-[120px]">
                  סה"כ
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Revenue Section */}
              <tr 
                className={`${CARD_COLORS.revenue} cursor-pointer hover:opacity-80`}
                onClick={() => toggleSection('revenue')}
              >
                <td className="border border-gray-300 px-4 py-3 font-bold text-[#17320b] sticky right-0 bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="flex items-center gap-2">
                    {collapsedSections.has('revenue') ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    💰 הכנסות
                  </div>
                </td>
                {monthlyData.data.map(d => (
                  <td key={d.month} className="border border-gray-300 px-3 py-3 text-center font-semibold text-[#528163]">
                    {formatCurrency(d.revenue)}
                  </td>
                ))}
                <td className="border border-gray-300 px-3 py-3 text-center font-bold text-[#17320b] text-base">
                  {formatCurrency(monthlyData.totals.revenue)}
                </td>
              </tr>

              {/* Cost of Goods Sold */}
              {!collapsedSections.has('revenue') && (
                <tr className={CARD_COLORS.cogs}>
                  <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-700 sticky right-0 bg-orange-50">
                    📦 עלות מכר
                  </td>
                  {monthlyData.data.map(d => (
                    <td key={d.month} className="border border-gray-300 px-3 py-3 text-center text-gray-700">
                      {formatCurrency(d.cogs)}
                    </td>
                  ))}
                  <td className="border border-gray-300 px-3 py-3 text-center font-semibold text-gray-800">
                    {formatCurrency(monthlyData.totals.cogs)}
                  </td>
                </tr>
              )}

              {/* Gross Profit */}
              {!collapsedSections.has('revenue') && (
                <tr className={CARD_COLORS.grossProfit}>
                  <td className="border border-gray-300 px-4 py-3 font-bold text-[#528163] sticky right-0 bg-green-50">
                    💎 רווח גולמי
                  </td>
                  {monthlyData.data.map(d => (
                    <td key={d.month} className={`border border-gray-300 px-3 py-3 text-center font-bold ${d.grossProfit >= 0 ? 'text-[#528163]' : 'text-red-600'}`}>
                      {formatCurrency(d.grossProfit)}
                    </td>
                  ))}
                  <td className={`border border-gray-300 px-3 py-3 text-center font-bold text-base ${monthlyData.totals.grossProfit >= 0 ? 'text-[#528163]' : 'text-red-600'}`}>
                    {formatCurrency(monthlyData.totals.grossProfit)}
                  </td>
                </tr>
              )}

              {/* Operating Expenses Section */}
              <tr 
                className={`${CARD_COLORS.operating} cursor-pointer hover:opacity-80`}
                onClick={() => toggleSection('operating')}
              >
                <td className="border border-gray-300 px-4 py-3 font-bold text-gray-700 sticky right-0 bg-gray-50">
                  <div className="flex items-center gap-2">
                    {collapsedSections.has('operating') ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    🏢 הוצאות תפעול
                  </div>
                </td>
                {monthlyData.data.map(d => (
                  <td key={d.month} className="border border-gray-300 px-3 py-3 text-center font-semibold text-gray-700">
                    {formatCurrency(d.operating)}
                  </td>
                ))}
                <td className="border border-gray-300 px-3 py-3 text-center font-bold text-gray-800">
                  {formatCurrency(monthlyData.totals.operating)}
                </td>
              </tr>

              {/* Operating Profit */}
              {!collapsedSections.has('operating') && (
                <tr className={CARD_COLORS.opProfit}>
                  <td className="border border-gray-300 px-4 py-3 font-bold text-[#528163] sticky right-0 bg-emerald-50">
                    📊 רווח תפעולי
                  </td>
                  {monthlyData.data.map(d => (
                    <td key={d.month} className={`border border-gray-300 px-3 py-3 text-center font-bold ${d.operatingProfit >= 0 ? 'text-[#528163]' : 'text-red-600'}`}>
                      {formatCurrency(d.operatingProfit)}
                    </td>
                  ))}
                  <td className={`border border-gray-300 px-3 py-3 text-center font-bold text-base ${monthlyData.totals.operatingProfit >= 0 ? 'text-[#528163]' : 'text-red-600'}`}>
                    {formatCurrency(monthlyData.totals.operatingProfit)}
                  </td>
                </tr>
              )}

              {/* Financial Expenses */}
              <tr className={CARD_COLORS.financial}>
                <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-700 sticky right-0 bg-slate-50">
                  🏦 הוצאות מימון
                </td>
                {monthlyData.data.map(d => (
                  <td key={d.month} className="border border-gray-300 px-3 py-3 text-center text-gray-700">
                    {formatCurrency(d.financial)}
                  </td>
                ))}
                <td className="border border-gray-300 px-3 py-3 text-center font-semibold text-gray-800">
                  {formatCurrency(monthlyData.totals.financial)}
                </td>
              </tr>

              {/* Net Profit */}
              <tr className={`${CARD_COLORS.netProfit} border-2 border-teal-400`}>
                <td className="border border-gray-300 px-4 py-3 font-bold text-teal-800 sticky right-0 bg-gradient-to-r from-teal-50 to-emerald-50">
                  💰💰 רווח נקי
                </td>
                {monthlyData.data.map(d => (
                  <td key={d.month} className={`border border-gray-300 px-3 py-3 text-center font-bold text-base ${d.netProfit >= 0 ? 'text-teal-700' : 'text-red-600'}`}>
                    {formatCurrency(d.netProfit)}
                  </td>
                ))}
                <td className={`border border-gray-300 px-3 py-3 text-center font-bold text-xl ${monthlyData.totals.netProfit >= 0 ? 'text-teal-700' : 'text-red-600'}`}>
                  {formatCurrency(monthlyData.totals.netProfit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
        <p className="font-semibold text-amber-800 mb-2">💡 הוראות שימוש:</p>
        <ul className="text-amber-700 space-y-1 mr-6">
          <li>• לחץ על כותרת קבוצה (הכנסות/הוצאות תפעול) כדי לקפל/לפתוח</li>
          <li>• השתמש בשורת החיפוש כדי לסנן לפי חשבון, סעיף או פירוט</li>
          <li>• לחץ על "ייצוא ל-CSV" כדי להוריד את הדוח לאקסל</li>
          <li>• ערכים בסוגריים מציינים הפסד</li>
          <li>• הגרפים מציגים מגמות ופילוח הוצאות</li>
        </ul>
      </div>
    </div>
  );
};

export default MonthlyProfitLossReport;
