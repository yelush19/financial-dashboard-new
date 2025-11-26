import React, { useState } from 'react';
import { X, ChevronDown, ChevronLeft } from 'lucide-react';

interface Transaction {
  sortCode?: number | null;
  sortCodeName?: string;
  accountKey?: number;
  accountName?: string;
  amount?: number;
  details?: string;
  date?: string;
  counterAccountName?: string;
  counterAccountNumber?: number;
  'קוד מיון'?: number;
  'שם קוד מיון'?: string;
  'מפתח חשבון'?: number;
  'שם חשבון'?: string;
  'תנועה'?: number;
  'פרטים'?: string;
  'ת.אסמכ'?: string;
  'שם חשבון נגדי'?: string;
  'ח-ן נגדי'?: number;
  [key: string]: any;
}

interface ScrollableDrillDownProps {
  isOpen: boolean;
  onClose: () => void;
  categoryCode: number | string;
  categoryName: string;
  month: number;
  monthName: string;
  transactions: Transaction[];
  formatCurrency: (amount: number) => string;
  onShowBiur: (transactions: Transaction[], title: string) => void;
}

export default function ScrollableDrillDown({
  isOpen,
  onClose,
  categoryCode,
  categoryName,
  month,
  monthName,
  transactions,
  formatCurrency,
  onShowBiur,
}: ScrollableDrillDownProps) {
  // State לניהול פתיחה/סגירה של חשבונות וספקים
  const [expandedAccounts, setExpandedAccounts] = useState<Set<number>>(new Set());
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());

  // פונקציות עזר לחילוץ נתונים
  const getMonthFromDate = (dateStr: string): number => {
    if (!dateStr) return 0;
    const parts = dateStr.split('/');
    if (parts.length >= 2) {
      return parseInt(parts[1]) || 0;
    }
    return 0;
  };

  const getSortCode = (tx: Transaction): number => {
    return tx['קוד מיון'] || tx.sortCode || 0;
  };

  const getAccountKey = (tx: Transaction): number => {
    return tx['מפתח חשבון'] || tx.accountKey || 0;
  };

  const getAccountName = (tx: Transaction): string => {
    return tx['שם חשבון'] || tx.accountName || 'לא ידוע';
  };

  const getCounterAccount = (tx: Transaction): number => {
    return tx['ח-ן נגדי'] || tx.counterAccountNumber || 0;
  };

  const getCounterAccountName = (tx: Transaction): string => {
    return tx['שם חשבון נגדי'] || tx.counterAccountName || 'לא ידוע';
  };

  const getAmount = (tx: Transaction): number => {
    return tx['תנועה'] || tx.amount || 0;
  };

  const getDate = (tx: Transaction): string => {
    return tx['ת.אסמכ'] || tx.date || '';
  };

  const getDetails = (tx: Transaction): string => {
    return tx['פרטים'] || tx.details || '';
  };

  // סינון טרנזקציות לפי קטגוריה וחודש
  const getFilteredTransactions = () => {
    return transactions.filter((t: Transaction) => {
      const txSortCode = getSortCode(t);
      const txMonth = getMonthFromDate(getDate(t));
      
      if (categoryCode === 'income_site') {
        const accountKey = getAccountKey(t);
        return txSortCode === 600 && accountKey >= 40000 && accountKey < 40020 && txMonth === month;
      } else if (categoryCode === 'income_superpharm') {
        const accountKey = getAccountKey(t);
        return txSortCode === 600 && accountKey >= 40020 && txMonth === month;
      } else {
        return txSortCode === Number(categoryCode) && txMonth === month;
      }
    });
  };

  // בניית מבנה היררכי - רמה 2: חשבונות
  const getAccountsData = () => {
    const filtered = getFilteredTransactions();
    
    const grouped = filtered.reduce((acc: any, t: Transaction) => {
      const key = getAccountKey(t);
      if (!acc[key]) {
        acc[key] = {
          code: key,
          name: getAccountName(t),
          total: 0,
          transactions: [],
        };
      }
      acc[key].total += getAmount(t);
      acc[key].transactions.push(t);
      return acc;
    }, {});

    return Object.values(grouped).sort((a: any, b: any) => Math.abs(b.total) - Math.abs(a.total));
  };

  // בניית מבנה היררכי - רמה 3: ספקים בתוך חשבון
  const getVendorsForAccount = (accountCode: number) => {
    const filtered = getFilteredTransactions().filter(
      (t: Transaction) => getAccountKey(t) === accountCode
    );

    const grouped = filtered.reduce((acc: any, t: Transaction) => {
      const key = getCounterAccount(t);
      const name = getCounterAccountName(t);
      const vendorKey = `${key}_${name}`;
      
      if (!acc[vendorKey]) {
        acc[vendorKey] = {
          code: key,
          name: name,
          total: 0,
          transactions: [],
        };
      }
      acc[vendorKey].total += getAmount(t);
      acc[vendorKey].transactions.push(t);
      return acc;
    }, {});

    return Object.values(grouped).sort((a: any, b: any) => Math.abs(b.total) - Math.abs(a.total));
  };

  // טוגל פתיחה/סגירה של חשבון
  const toggleAccount = (accountCode: number) => {
    const newSet = new Set(expandedAccounts);
    if (newSet.has(accountCode)) {
      newSet.delete(accountCode);
    } else {
      newSet.add(accountCode);
    }
    setExpandedAccounts(newSet);
  };

  // לחיצה על סכום ספק - פתיחת BiurModal
  const handleVendorClick = (
    vendorTransactions: Transaction[], 
    vendorName: string, 
    accountName: string
  ) => {
    const title = `${vendorName} - ${accountName} - ${categoryName} - ${monthName}`;
    onShowBiur(vendorTransactions, title);
  };

  if (!isOpen) return null;

  const accountsData = getAccountsData();

  return (
    <div className="mt-6 border-2 border-green-400 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
      <div className="p-6">
        {/* כותרת */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-green-300">
          <div>
            <h3 className="text-xl font-bold text-green-800 flex items-center gap-2">
              🔍 דריל-דאון מפורט
            </h3>
            <p className="text-sm text-gray-700 mt-2 font-medium">
              📊 {categoryCode} - {categoryName} | 📅 {monthName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-white border-2 border-gray-300 hover:bg-red-50 hover:border-red-400 rounded-lg flex items-center gap-2 transition-all shadow-sm"
            title="סגור"
          >
            <X className="w-5 h-5" />
            <span className="font-medium">סגור</span>
          </button>
        </div>

        {/* רמה 1: קוד מיון (כותרת קבועה) */}
        <div className="mb-4 p-4 bg-green-100 border-2 border-green-400 rounded-lg">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-bold text-green-900">
              📋 רמה 1: קוד מיון {categoryCode} - {categoryName}
            </h4>
            <span className="text-sm font-semibold text-green-700 bg-white px-3 py-1 rounded-full">
              {accountsData.length} חשבונות
            </span>
          </div>
        </div>

        {/* רמה 2: חשבונות */}
        <div className="space-y-3">
          {accountsData.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-lg">אין נתונים להצגה</p>
            </div>
          ) : (
            accountsData.map((account: any) => {
              const isExpanded = expandedAccounts.has(account.code);
              const vendorsData = isExpanded ? getVendorsForAccount(account.code) : [];

              return (
                <div key={account.code} className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  {/* כותרת חשבון - רמה 2 */}
                  <div
                    onClick={() => toggleAccount(account.code)}
                    className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-sky-50 cursor-pointer hover:from-blue-100 hover:to-sky-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-blue-600">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronLeft className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-blue-900 bg-blue-100 px-2 py-1 rounded">
                          📌 רמה 2
                        </span>
                        <div className="mt-1">
                          <span className="font-bold text-gray-900 text-base">
                            {account.code}
                          </span>
                          <span className="text-gray-600 mx-2">—</span>
                          <span className="text-gray-800 font-medium">
                            {account.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-lg font-bold text-blue-700">
                        {formatCurrency(Math.abs(account.total))}
                      </div>
                      {isExpanded && (
                        <div className="text-xs text-gray-600 mt-1">
                          {vendorsData.length} ספקים
                        </div>
                      )}
                    </div>
                  </div>

                  {/* רמה 3: ספקים */}
                  {isExpanded && (
                    <div className="bg-gray-50 p-4 border-t-2 border-gray-200">
                      {vendorsData.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">אין ספקים להצגה</p>
                      ) : (
                        <div className="space-y-2">
                          {vendorsData.map((vendor: any) => (
                            <div
                              key={`${vendor.code}_${vendor.name}`}
                              className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded">
                                  🏢 רמה 3
                                </span>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {vendor.name}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    ח-ן נגדי: {vendor.code}
                                  </div>
                                </div>
                              </div>
                              <div
                                onClick={() => handleVendorClick(vendor.transactions, vendor.name, account.name)}
                                className="cursor-pointer hover:scale-105 transition-transform"
                              >
                                <div className="text-right">
                                  <div className="text-base font-bold text-orange-600 hover:text-orange-700 hover:underline">
                                    {formatCurrency(Math.abs(vendor.total))} 👆
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {vendor.transactions.length} תנועות
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}