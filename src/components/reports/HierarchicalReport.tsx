import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import Papa from 'papaparse';
import groupBy from 'lodash/groupBy';
import sumBy from 'lodash/sumBy';

interface Transaction {
  accountKey: number;
  accountName: string;
  amount: number;
  details: string;
  date: string;
  valueDate: string;
  counterAccountName: string;
  debitCredit: string;
}

interface AccountData {
  accountKey: number;
  accountName: string;
  total: number;
  transactions: Transaction[];
}

interface SubCategoryData {
  name: string;
  total: number;
  accounts: AccountData[];
}

interface CategoryData {
  name: string;
  total: number;
  type: 'income' | 'expense';
  subCategories: SubCategoryData[];
}

const HierarchicalReport: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubCategories, setExpandedSubCategories] = useState<Set<string>>(new Set());
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [selectedTransactions, setSelectedTransactions] = useState<Transaction[] | null>(null);

  // טעינת נתונים מ-TRANSACTION.csv
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const response = await fetch('/TRANSACTION.csv');
        const text = await response.text();
        
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results: Papa.ParseResult<any>) => {
            const parsed: Transaction[] = results.data.map((row: any) => ({
              accountKey: parseInt(row['מפתח חשבון']) || 0,
              accountName: row['שם חשבון'] || '',
              amount: parseFloat(row['חובה / זכות (שקל)']?.replace(/,/g, '') || '0'),
              details: row['פרטים'] || '',
              date: row['תאריך 3'] || '',
              valueDate: row['ת.ערך'] || '',
              counterAccountName: row['שם חשבון נגדי'] || '',
              debitCredit: row['חובה / זכות (שקל)'] || '',
            }));
            setTransactions(parsed);
            setLoading(false);
          },
        });
      } catch (error) {
        console.error('Error loading transactions:', error);
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  // מבנה הדוח ההיררכי
  const hierarchicalData = useMemo(() => {
    if (!transactions.length) return [];

    // קטגוריות ראשיות - נתחיל בגרסה פשוטה
    const categories: CategoryData[] = [
      {
        name: 'הכנסות',
        type: 'income',
        total: 0,
        subCategories: [
          { name: 'מכירות', total: 0, accounts: [] },
          { name: 'שירותים', total: 0, accounts: [] },
          { name: 'הכנסות אחרות', total: 0, accounts: [] },
        ],
      },
      {
        name: 'עלות המכר',
        type: 'expense',
        total: 0,
        subCategories: [
          { name: 'רכש סחורה', total: 0, accounts: [] },
          { name: 'עלויות ייצור', total: 0, accounts: [] },
        ],
      },
      {
        name: 'הוצאות תפעול',
        type: 'expense',
        total: 0,
        subCategories: [
          { name: 'שכר עבודה', total: 0, accounts: [] },
          { name: 'שכר דירה', total: 0, accounts: [] },
          { name: 'שיווק ופרסום', total: 0, accounts: [] },
          { name: 'הוצאות משרד', total: 0, accounts: [] },
        ],
      },
      {
        name: 'הוצאות מימון',
        type: 'expense',
        total: 0,
        subCategories: [
          { name: 'ריבית והוצאות בנק', total: 0, accounts: [] },
          { name: 'הפרשי שער', total: 0, accounts: [] },
        ],
      },
    ];

    // סיווג חשבונות לפי טווח מפתח חשבון
    const classifyAccount = (accountKey: number): { categoryIndex: number; subCategoryIndex: number } => {
      if (accountKey >= 4000 && accountKey < 4100) return { categoryIndex: 0, subCategoryIndex: 0 }; // מכירות
      if (accountKey >= 4100 && accountKey < 4200) return { categoryIndex: 0, subCategoryIndex: 1 }; // שירותים
      if (accountKey >= 4200 && accountKey < 5000) return { categoryIndex: 0, subCategoryIndex: 2 }; // הכנסות אחרות
      if (accountKey >= 5000 && accountKey < 5100) return { categoryIndex: 1, subCategoryIndex: 0 }; // רכש סחורה
      if (accountKey >= 5100 && accountKey < 6000) return { categoryIndex: 1, subCategoryIndex: 1 }; // עלויות ייצור
      if (accountKey >= 6000 && accountKey < 6100) return { categoryIndex: 2, subCategoryIndex: 0 }; // שכר עבודה
      if (accountKey >= 6100 && accountKey < 6200) return { categoryIndex: 2, subCategoryIndex: 1 }; // שכר דירה
      if (accountKey >= 6200 && accountKey < 6300) return { categoryIndex: 2, subCategoryIndex: 2 }; // שיווק
      if (accountKey >= 6300 && accountKey < 7000) return { categoryIndex: 2, subCategoryIndex: 3 }; // הוצאות משרד
      if (accountKey >= 7000 && accountKey < 8000) return { categoryIndex: 3, subCategoryIndex: 0 }; // מימון
      return { categoryIndex: 2, subCategoryIndex: 3 }; // ברירת מחדל
    };

    // קיבוץ טרנזקציות לפי חשבון
    const groupedByAccount = groupBy(transactions, (tx: Transaction) => tx.accountKey);

    Object.keys(groupedByAccount).forEach((accountKey) => {
      const txs = groupedByAccount[accountKey] as Transaction[];
      const key = parseInt(accountKey);
      if (key === 0 || !txs.length) return;

      const { categoryIndex, subCategoryIndex } = classifyAccount(key);
      const total = sumBy(txs, (tx: Transaction) => tx.amount);

      const accountData: AccountData = {
        accountKey: key,
        accountName: txs[0].accountName,
        total,
        transactions: txs,
      };

      categories[categoryIndex].subCategories[subCategoryIndex].accounts.push(accountData);
      categories[categoryIndex].subCategories[subCategoryIndex].total += total;
      categories[categoryIndex].total += total;
    });

    return categories;
  }, [transactions]);

  // פונקציות toggle
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const toggleSubCategory = (subCategoryName: string) => {
    setExpandedSubCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subCategoryName)) {
        newSet.delete(subCategoryName);
      } else {
        newSet.add(subCategoryName);
      }
      return newSet;
    });
  };

  const toggleAccount = (accountKey: number) => {
    setExpandedAccounts(prev => {
      const newSet = new Set(prev);
      const key = accountKey.toString();
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // פורמט מספר לשקלים
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">טוען נתונים...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">דוח רווח והפסד היררכי</h2>
      
      <div className="space-y-2">
        {hierarchicalData.map((category) => (
          <div key={category.name} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* רמה 1: קטגוריה ראשית */}
            <button
              onClick={() => toggleCategory(category.name)}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                {expandedCategories.has(category.name) ? (
                  <ChevronDown className="w-5 h-5 text-blue-600 transition-transform duration-200" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-blue-600 transition-transform duration-200" />
                )}
                <span className="font-bold text-lg text-gray-800">{category.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-bold text-lg ${category.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(category.total)}
                </span>
                {category.type === 'income' ? (
                  <TrendingUp className="w-5 h-5 text-green-600" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-600" />
                )}
              </div>
            </button>

            {/* רמה 2: תת-קטגוריות */}
            {expandedCategories.has(category.name) && (
              <div className="bg-gray-50">
                {category.subCategories.map((subCategory) => (
                  <div key={subCategory.name} className="border-t border-gray-200">
                    <button
                      onClick={() => toggleSubCategory(`${category.name}-${subCategory.name}`)}
                      className="w-full flex items-center justify-between p-3 pl-12 hover:bg-gray-100 transition-colors duration-150"
                    >
                      <div className="flex items-center gap-3">
                        {expandedSubCategories.has(`${category.name}-${subCategory.name}`) ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                        <span className="font-semibold text-gray-700">{subCategory.name}</span>
                      </div>
                      <span className="font-semibold text-gray-700">
                        {formatCurrency(subCategory.total)}
                      </span>
                    </button>

                    {/* רמה 3: חשבונות */}
                    {expandedSubCategories.has(`${category.name}-${subCategory.name}`) && (
                      <div className="bg-white">
                        {subCategory.accounts.map((account) => (
                          <div key={account.accountKey} className="border-t border-gray-100">
                            <button
                              onClick={() => toggleAccount(account.accountKey)}
                              className="w-full flex items-center justify-between p-3 pl-20 hover:bg-blue-50 transition-colors duration-150"
                            >
                              <div className="flex items-center gap-3">
                                {expandedAccounts.has(account.accountKey.toString()) ? (
                                  <ChevronDown className="w-4 h-4 text-blue-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-blue-500" />
                                )}
                                <span className="text-gray-600">
                                  {account.accountKey} - {account.accountName}
                                </span>
                              </div>
                              <span className="text-gray-700">
                                {formatCurrency(account.total)}
                              </span>
                            </button>

                            {/* רמה 4: טרנזקציות */}
                            {expandedAccounts.has(account.accountKey.toString()) && (
                              <div className="bg-gray-50 p-4 pl-28">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th className="p-2 text-right">תאריך</th>
                                      <th className="p-2 text-right">חשבון נגדי</th>
                                      <th className="p-2 text-right">פרטים</th>
                                      <th className="p-2 text-left">סכום</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {account.transactions.slice(0, 10).map((tx: Transaction, idx: number) => (
                                      <tr key={idx} className="border-t border-gray-200 hover:bg-white">
                                        <td className="p-2 text-right text-gray-600">{tx.date}</td>
                                        <td className="p-2 text-right text-gray-600">{tx.counterAccountName}</td>
                                        <td className="p-2 text-right text-gray-700">{tx.details}</td>
                                        <td className="p-2 text-left font-medium text-gray-800">
                                          {formatCurrency(tx.amount)}
                                        </td>
                                      </tr>
                                    ))}
                                    {account.transactions.length > 10 && (
                                      <tr className="border-t border-gray-200">
                                        <td colSpan={4} className="p-2 text-center text-gray-500 text-xs">
                                          ועוד {account.transactions.length - 10} טרנזקציות...
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HierarchicalReport;