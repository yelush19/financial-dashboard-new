import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Download, X } from 'lucide-react';
import Papa from 'papaparse';

interface Transaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  month: string;
}

interface MonthData {
  [category: string]: number;
}

interface PivotData {
  [month: string]: MonthData;
}

interface CategoryTotal {
  category: string;
  total: number;
}

interface PivotReportWithPopupProps {
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

const getMonthName = (date: string): string => {
  const parts = date.split("/");
  if (parts.length !== 3) return "";
  const month = parseInt(parts[1]);
  const monthNames = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
  ];
  return monthNames[month - 1] || "";
};

const PivotReportWithPopup: React.FC<PivotReportWithPopupProps> = ({ 
  companyName = 'החברה שלי', 
  reportPeriod = '2025' 
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedCell, setSelectedCell] = useState<{month: string; category: string} | null>(null);
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
              .map((row) => {
                const rawAmount = parseFloat((row["חובה / זכות (שקל)"] || "0").toString().replace(/,/g, ""));
                const code = (row["קוד מיון"] || "").toString().trim();
                const category = CATEGORY_MAP[code];
                const date = row["ת.אסמכ"]?.toString() || "";
                const month = getMonthName(date);
                
                return category && month
                  ? {
                      date,
                      description: row["פרטים"] || "",
                      amount: rawAmount,
                      category,
                      month
                    }
                  : null;
              })
              .filter((x): x is Transaction => x !== null);
            
            setTransactions(cleaned);
            setIsLoading(false);
          }
        });
      });
  }, []);

  const pivotData: PivotData = useMemo(() => {
    const result: PivotData = {};
    
    transactions.forEach(transaction => {
      if (!result[transaction.month]) {
        result[transaction.month] = {};
      }
      
      if (!result[transaction.month][transaction.category]) {
        result[transaction.month][transaction.category] = 0;
      }
      
      result[transaction.month][transaction.category] += transaction.amount;
    });
    
    return result;
  }, [transactions]);

  const months = useMemo(() => Object.keys(pivotData).sort(), [pivotData]);
  
  const categories = useMemo(() => {
    const cats = new Set<string>();
    Object.values(pivotData).forEach(monthData => {
      Object.keys(monthData).forEach(cat => cats.add(cat));
    });
    return Array.from(cats).sort();
  }, [pivotData]);

  const categoryTotals: CategoryTotal[] = useMemo(() => {
    const totals: { [key: string]: number } = {};
    
    categories.forEach(category => {
      totals[category] = months.reduce((sum, month) => {
        return sum + (pivotData[month][category] || 0);
      }, 0);
    });
    
    return categories.map(cat => ({
      category: cat,
      total: totals[cat]
    }));
  }, [categories, months, pivotData]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleCellClick = (month: string, category: string) => {
    setSelectedCell({ month, category });
  };

  const getTransactionsForCell = (month: string, category: string): Transaction[] => {
    return transactions.filter(t => t.month === month && t.category === category);
  };

  const exportToCSV = () => {
    let csv = 'קטגוריה,' + months.join(',') + ',סה"כ\n';
    
    categoryTotals.forEach(({ category, total }) => {
      const row = [
        category,
        ...months.map(month => pivotData[month][category] || 0),
        total
      ];
      csv += row.join(',') + '\n';
    });
    
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'pivot_report.csv';
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
          <h2 className="text-2xl font-bold text-purple-900">דוח Pivot - {companyName}</h2>
          <p className="text-gray-600">תקופה: {reportPeriod} | {transactions.length} תנועות</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Download size={20} />
          ייצא ל-CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-purple-100">
              <th className="border border-purple-300 p-3 text-right font-bold">קטגוריה</th>
              {months.map(month => (
                <th key={month} className="border border-purple-300 p-3 text-center font-bold">
                  {month}
                </th>
              ))}
              <th className="border border-purple-300 p-3 text-center font-bold bg-purple-200">סה"כ</th>
            </tr>
          </thead>
          <tbody>
            {categoryTotals.map(({ category, total }) => (
              <React.Fragment key={category}>
                <tr className="hover:bg-purple-50 transition-colors">
                  <td className="border border-purple-300 p-3">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="flex items-center gap-2 w-full text-right hover:text-purple-600"
                    >
                      {expandedCategories.has(category) ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                      <span className="font-semibold">{category}</span>
                    </button>
                  </td>
                  {months.map(month => (
                    <td
                      key={month}
                      className="border border-purple-300 p-3 text-center cursor-pointer hover:bg-purple-100"
                      onClick={() => handleCellClick(month, category)}
                    >
                      <span className={pivotData[month][category] >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ₪{(pivotData[month][category] || 0).toLocaleString()}
                      </span>
                    </td>
                  ))}
                  <td className="border border-purple-300 p-3 text-center font-bold bg-purple-50">
                    <span className={total >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ₪{total.toLocaleString()}
                    </span>
                  </td>
                </tr>
                {expandedCategories.has(category) && (
                  <tr className="bg-purple-25">
                    <td colSpan={months.length + 2} className="border border-purple-300 p-4">
                      <div className="text-sm text-gray-600">
                        <p className="font-semibold mb-2">פירוט {category}:</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {months.map(month => {
                            const amount = pivotData[month][category] || 0;
                            if (amount !== 0) {
                              return (
                                <div key={month} className="p-2 bg-white rounded">
                                  <span className="font-medium">{month}:</span>
                                  <span className={amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                                    {' '}₪{amount.toLocaleString()}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCell && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                תנועות - {selectedCell.category} ({selectedCell.month})
              </h2>
              <button
                onClick={() => setSelectedCell(null)}
                className="hover:bg-purple-700 p-1 rounded transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {getTransactionsForCell(selectedCell.month, selectedCell.category).map((transaction, idx) => (
                <div key={idx} className="border-b border-gray-200 py-3 last:border-b-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{transaction.description}</p>
                      <p className="text-sm text-gray-500">{transaction.date}</p>
                    </div>
                    <p className={`font-bold text-lg ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₪{transaction.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PivotReportWithPopup;