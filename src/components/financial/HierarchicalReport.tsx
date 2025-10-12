import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Transaction {
  category: string;
  categoryCode: string;
  account: string;
  accountName: string;
  date: string;
  month: string;
  details: string;
  amount: number;
}

interface AccountGroup {
  account: string;
  name: string;
  month: string;
  rows: Transaction[];
}

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

const numberFormat = (num: number): string =>
  num?.toLocaleString("he-IL", { minimumFractionDigits: 0 }) ?? "0";

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

interface HierarchicalReportProps {
  companyName?: string;
  reportPeriod?: string;
}

function HierarchicalReport({ companyName, reportPeriod }: HierarchicalReportProps) {
  const [data, setData] = useState<Transaction[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/TRANSACTION.csv")
      .then((res) => res.text())
      .then((text) => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results: Papa.ParseResult<any>) => {
            const cleaned = results.data
              .map((row: any) => {
                const rawAmount = parseFloat((row["חובה / זכות (שקל)"] || "0").toString().replace(/,/g, ""));
                const code = (row["קוד מיון"] || "").toString().trim();
                const category = CATEGORY_MAP[code];
                const date = row["ת.אסמכ"]?.toString() || "";
                const month = getMonthName(date);
                
                if (!category) return null;
                
                return {
                  category,
                  categoryCode: code,
                  account: row["מפתח חשבון"] || "",
                  accountName: row["שם חשבון"] || "",
                  date,
                  month,
                  details: row["פרטים"] || "",
                  amount: rawAmount
                } as Transaction;
              })
              .filter((item): item is Transaction => item !== null);
            
            setData(cleaned);
          }
        });
      });
  }, []);

  const grouped = data.reduce<Record<string, Record<string, AccountGroup>>>((acc, tx) => {
    const categoryKey = `${tx.categoryCode} - ${tx.category}`;
    if (!acc[categoryKey]) acc[categoryKey] = {};
    const key = `${tx.account}-${tx.month}`;
    if (!acc[categoryKey][key]) {
      acc[categoryKey][key] = {
        account: tx.account,
        name: tx.accountName,
        month: tx.month,
        rows: []
      };
    }
    acc[categoryKey][key].rows.push(tx);
    return acc;
  }, {});

  return (
    <div className="p-6" dir="rtl">
      <h2 className="text-xl font-bold mb-4">דוח רווח והפסד היררכי לפי חודשים</h2>
      {Object.entries(grouped).map(([categoryKey, accounts]) => {
        const catKey = `cat-${categoryKey}`;
        const catTotal = Object.values(accounts)
          .flatMap((a: AccountGroup) => a.rows)
          .reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
        
        return (
          <div key={categoryKey} className="mb-4 border rounded shadow">
            <div
              onClick={() => setExpandedCategories(prev => ({ ...prev, [catKey]: !prev[catKey] }))}
              className="cursor-pointer flex items-center justify-between bg-green-100 px-4 py-2 text-green-900 font-bold"
            >
              <div className="flex items-center gap-2">
                {expandedCategories[catKey] ? <ChevronDown /> : <ChevronRight />} {categoryKey}
              </div>
              <div>{numberFormat(catTotal)} ₪</div>
            </div>
            {expandedCategories[catKey] && (
              <div className="bg-white border-t">
                {Object.entries(accounts).map(([accKey, obj]) => {
                  const accRowKey = `${catKey}-${accKey}`;
                  const accTotal = obj.rows.reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
                  
                  return (
                    <div key={accKey}>
                      <div
                        onClick={() => setExpandedAccounts(prev => ({ ...prev, [accRowKey]: !prev[accRowKey] }))}
                        className="cursor-pointer flex items-center justify-between px-6 py-2 text-gray-800 hover:bg-gray-50 border-b"
                      >
                        <div className="flex items-center gap-2">
                          {expandedAccounts[accRowKey] ? <ChevronDown /> : <ChevronRight />} {obj.account} - {obj.name} ({obj.month})
                        </div>
                        <div>{numberFormat(accTotal)} ₪</div>
                      </div>
                      {expandedAccounts[accRowKey] && (
                        <table className="w-full text-sm border-t">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="border p-2">תאריך</th>
                              <th className="border p-2">פרטים</th>
                              <th className="border p-2">סכום</th>
                            </tr>
                          </thead>
                          <tbody>
                            {obj.rows.map((row: Transaction, i: number) => (
                              <tr key={i} className="even:bg-gray-50">
                                <td className="border p-2 whitespace-nowrap">{row.date}</td>
                                <td className="border p-2">{row.details}</td>
                                <td className="border p-2">{numberFormat(row.amount)}</td>
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
  );
};

export default HierarchicalReport;