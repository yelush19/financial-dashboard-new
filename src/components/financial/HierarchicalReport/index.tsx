import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

// ================ INTERFACES ================
interface Transaction {
  date: string;
  account: string;
  accountName: string;
  category: string;
  month: string;
  amount: number;
  details: string;
}

interface AccountGroup {
  account: string;
  name: string;
  month: string;
  rows: Transaction[];
}

interface CategoryData {
  items: AccountGroup[];
}

interface HierarchicalReportProps {
  companyName?: string;
  reportPeriod?: string;
}

// ================ CONSTANTS ================
const CATEGORY_MAP: Record<string, string> = {
  "600": "600 - הכנסות",
  "700": "700 - הכנסות סופרפארם",
  "800": "800 - עלות המכר",
  "801": "801 - הוצאות מכירה",
  "802": "802 - הוצאות הנהלה וכלליות",
  "804": "804 - הוצאות שיווק ופרסום",
  "805": "805 - הוצאות שירות לקוחות",
  "806": "806 - הוצאות לוגיסטיקה",
  "811": "811 - הוצאות שכר ונלוות",
  "990": "990 - עמלות בנקים וסליקה",
  "813": "813 - עמלות בנקים וסליקה",
  "991": "991 - ריבית החזר הלוואה"
};

// ================ HELPER FUNCTIONS ================
const numberFormat = (num: number): string => {
  if (typeof num !== 'number' || isNaN(num)) return "0";
  return num.toLocaleString("he-IL", { minimumFractionDigits: 0 });
};

const getMonthName = (date: string): string => {
  if (!date || typeof date !== 'string') return "";
  const parts = date.split("/");
  if (parts.length !== 3) return "";
  const monthNum = parseInt(parts[1], 10);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return "";
  
  const monthNames = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
  ];
  return monthNames[monthNum - 1] || "";
};

// ================ MAIN COMPONENT ================
function HierarchicalReport({ companyName, reportPeriod }: HierarchicalReportProps) {
  const [data, setData] = useState<Transaction[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});

  // ================ DATA LOADING ================
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/TRANSACTION.csv");
        const text = await response.text();
        
        // Parse CSV manually (avoiding Papa Parse complexity)
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const parsed: Transaction[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          const row: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          // Extract data with type safety
          const amountStr = (row["חובה / זכות (שקל)"] || "0").replace(/,/g, "");
          const rawAmount = parseFloat(amountStr);
          
          if (isNaN(rawAmount)) continue;
          
          const code = (row["קוד מיון"] || "").trim();
          const category = CATEGORY_MAP[code];
          
          if (!category) continue;
          
          const date = row["ת.אסמכ"] || "";
          const month = getMonthName(date);
          
          if (!month) continue;
          
          parsed.push({
            date,
            account: row["מפתח חשבון"] || "",
            accountName: row["שם חשבון"] || "",
            category,
            month,
            amount: rawAmount,
            details: row["פרטים"] || ""
          });
        }
        
        setData(parsed);
      } catch (error) {
        console.error("שגיאה בטעינת הנתונים:", error);
      }
    };
    
    loadData();
  }, []);

  // ================ DATA GROUPING ================
  const grouped: Record<string, CategoryData> = {};
  
  data.forEach((row) => {
    const { category, account, accountName, month } = row;
    
    if (!grouped[category]) {
      grouped[category] = { items: [] };
    }
    
    const key = `${account}-${month}`;
    let existing = grouped[category].items.find(
      (item) => `${item.account}-${item.month}` === key
    );
    
    if (!existing) {
      existing = {
        account,
        name: accountName,
        month,
        rows: []
      };
      grouped[category].items.push(existing);
    }
    
    existing.rows.push(row);
  });

  // ================ TOGGLE HANDLERS ================
  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const toggleAccount = (key: string) => {
    setExpandedAccounts((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // ================ RENDER ================
  return (
    <div dir="rtl" className="p-4 font-sans">
      <h2 className="text-2xl font-bold mb-4" style={{ color: '#528163' }}>
        דוח רווח והפסד היררכי
      </h2>
      
      {data.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          טוען נתונים...
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(grouped).map(([category, categoryData]) => {
            const isExpanded = expandedCategories[category] || false;
            
            // Calculate category total with type safety
            const categoryTotal = categoryData.items.reduce((sum, group) => {
              const groupTotal = group.rows.reduce((s, r) => s + (r.amount || 0), 0);
              return sum + groupTotal;
            }, 0);

            return (
              <div key={category} className="border rounded-lg overflow-hidden">
                {/* Category Header */}
                <div
                  onClick={() => toggleCategory(category)}
                  className="cursor-pointer bg-green-50 hover:bg-green-100 p-3 flex items-center justify-between border-b transition-colors"
                >
                  <div className="flex items-center gap-2 font-semibold text-green-800">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    {category}
                  </div>
                  <div className="font-bold text-green-900">
                    {numberFormat(categoryTotal)} ₪
                  </div>
                </div>

                {/* Account Groups */}
                {isExpanded && (
                  <div className="bg-white">
                    {categoryData.items.map((group) => {
                      const accRowKey = `${group.account}-${group.month}`;
                      const isAccountExpanded = expandedAccounts[accRowKey] || false;
                      
                      // Calculate account total with type safety
                      const accTotal = group.rows.reduce((sum, r) => sum + (r.amount || 0), 0);

                      return (
                        <div key={accRowKey} className="border-b last:border-b-0">
                          {/* Account Row */}
                          <div
                            onClick={() => toggleAccount(accRowKey)}
                            className="cursor-pointer hover:bg-gray-50 p-3 flex items-center justify-between transition-colors"
                          >
                            <div className="flex items-center gap-2 text-sm">
                              {isAccountExpanded ? (
                                <ChevronDown size={16} />
                              ) : (
                                <ChevronRight size={16} />
                              )}
                              {group.account} - {group.name} ({group.month})
                            </div>
                            <div className="font-medium">
                              {numberFormat(accTotal)} ₪
                            </div>
                          </div>

                          {/* Transaction Details */}
                          {isAccountExpanded && (
                            <table className="w-full text-sm border-t">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="border p-2 text-right">תאריך</th>
                                  <th className="border p-2 text-right">פרטים</th>
                                  <th className="border p-2 text-right">סכום</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.rows.map((row, i) => (
                                  <tr key={i} className="even:bg-gray-50">
                                    <td className="border p-2 whitespace-nowrap">
                                      {row.date}
                                    </td>
                                    <td className="border p-2">{row.details}</td>
                                    <td className="border p-2 text-left">
                                      {numberFormat(row.amount)} ₪
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default HierarchicalReport;