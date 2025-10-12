import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, Filter, SortAsc, SortDesc } from 'lucide-react';
import Papa from 'papaparse';

interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  account: string;
}

type SortField = 'date' | 'amount' | 'category';
type SortOrder = 'asc' | 'desc';

interface RawDataProps {
  companyName?: string;
  reportPeriod?: string;
}

const CATEGORY_MAP: Record<string, string> = {
  "600": "הכנסות",
  "700": "הכנסות",
  "800": "עלות המכר",
  "801": "הוצאות מכירה",
  "802": "הוצאות הנהלה וכלליות",
  "804": "הוצאות שיווק ופרסום",
  "805": "הוצאות שירות לקוחות",
  "806": "הוצאות לוגיסטיקה",
  "811": "הוצאות שכר ונלוות",
  "990": "עמלות בנקים",
  "813": "עמלות בנקים",
  "991": "ריבית הלוואה"
};

const RawData: React.FC<RawDataProps> = ({ 
  companyName = 'החברה שלי', 
  reportPeriod = '2025' 
}) => {
  const [rawData, setRawData] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/TRANSACTION.csv")
      .then((res) => res.text())
      .then((text) => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: ({ data }) => {
            const cleaned = (data as any[])
              .map((row, index) => {
                const rawAmount = parseFloat((row["חובה / זכות (שקל)"] || "0").toString().replace(/,/g, ""));
                const code = (row["קוד מיון"] || "").toString().trim();
                const category = CATEGORY_MAP[code];
                
                if (!category) return null;
                
                return {
                  id: index + 1,
                  date: row["ת.אסמכ"]?.toString() || "",
                  description: row["פרטים"] || "",
                  amount: rawAmount,
                  category,
                  type: (rawAmount >= 0 ? 'income' : 'expense') as 'income' | 'expense',
                  account: row["שם חשבון"] || ""
                };
              })
              .filter((x): x is Transaction => x !== null);
            
            setRawData(cleaned);
            setIsLoading(false);
          }
        });
      });
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(rawData.map(t => t.category));
    return ['all', ...Array.from(cats).sort()];
  }, [rawData]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = rawData.filter(transaction => {
      const matchesSearch = 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.account.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
      const matchesType = filterType === 'all' || transaction.type === filterType;
      
      return matchesSearch && matchesCategory && matchesType;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'date') {
        comparison = a.date.localeCompare(b.date);
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortField === 'category') {
        comparison = a.category.localeCompare(b.category, 'he');
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [rawData, searchTerm, filterCategory, filterType, sortField, sortOrder]);

  const totalIncome = useMemo(() => 
    filteredAndSortedData.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    [filteredAndSortedData]
  );

  const totalExpense = useMemo(() => 
    Math.abs(filteredAndSortedData.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)),
    [filteredAndSortedData]
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const exportToCSV = () => {
    const headers = ['תאריך', 'תיאור', 'סכום', 'קטגוריה', 'סוג', 'חשבון'];
    const rows = filteredAndSortedData.map(t => [
      t.date,
      t.description,
      t.amount,
      t.category,
      t.type === 'income' ? 'הכנסה' : 'הוצאה',
      t.account
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'raw_data.csv';
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">טוען נתונים...</div>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ direction: 'rtl' }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-indigo-900">נתונים גולמיים - {companyName}</h2>
          <p className="text-gray-600">תקופה: {reportPeriod} | {rawData.length} תנועות</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Download size={20} />
          ייצא ל-CSV
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-700 font-medium">סה"כ הכנסות</p>
          <p className="text-2xl font-bold text-green-600">₪{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
          <p className="text-sm text-red-700 font-medium">סה"כ הוצאות</p>
          <p className="text-2xl font-bold text-red-600">₪{totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700 font-medium">מאזן</p>
          <p className={`text-2xl font-bold ${(totalIncome - totalExpense) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            ₪{(totalIncome - totalExpense).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute right-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="חיפוש..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute right-3 top-3 text-gray-400" size={20} />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'כל הקטגוריות' : cat}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Filter className="absolute right-3 top-3 text-gray-400" size={20} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
          >
            <option value="all">הכל</option>
            <option value="income">הכנסות</option>
            <option value="expense">הוצאות</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-indigo-100">
              <th
                onClick={() => handleSort('date')}
                className="border border-indigo-300 p-3 text-right font-bold cursor-pointer hover:bg-indigo-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  תאריך
                  {sortField === 'date' && (
                    sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />
                  )}
                </div>
              </th>
              <th className="border border-indigo-300 p-3 text-right font-bold">תיאור</th>
              <th
                onClick={() => handleSort('amount')}
                className="border border-indigo-300 p-3 text-center font-bold cursor-pointer hover:bg-indigo-200 transition-colors"
              >
                <div className="flex items-center justify-center gap-2">
                  סכום
                  {sortField === 'amount' && (
                    sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('category')}
                className="border border-indigo-300 p-3 text-center font-bold cursor-pointer hover:bg-indigo-200 transition-colors"
              >
                <div className="flex items-center justify-center gap-2">
                  קטגוריה
                  {sortField === 'category' && (
                    sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />
                  )}
                </div>
              </th>
              <th className="border border-indigo-300 p-3 text-center font-bold">סוג</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedData.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-indigo-50 transition-colors">
                <td className="border border-indigo-300 p-3 text-right whitespace-nowrap">
                  {transaction.date}
                </td>
                <td className="border border-indigo-300 p-3 text-right">{transaction.description}</td>
                <td className="border border-indigo-300 p-3 text-center">
                  <span className={`font-bold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₪{transaction.amount.toLocaleString()}
                  </span>
                </td>
                <td className="border border-indigo-300 p-3 text-center">
                  <span className="bg-indigo-100 px-3 py-1 rounded-full text-sm font-medium">
                    {transaction.category}
                  </span>
                </td>
                <td className="border border-indigo-300 p-3 text-center">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    transaction.type === 'income' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {transaction.type === 'income' ? 'הכנסה' : 'הוצאה'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600 text-center">
        מציג {filteredAndSortedData.length} מתוך {rawData.length} תנועות
      </div>
    </div>
  );
};

export default RawData;
