// RecurringExpensesAnalysis.tsx
// כלי ניתוח הוצאות חוזרות - זיהוי ספקים קבועים וחודשים חסרים
// 17/12/2025

import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, TrendingDown, Calendar, ChevronDown, ChevronLeft } from 'lucide-react';

interface Transaction {
  vendorKey: number;
  vendorName: string;
  counterAccountNumber: number;
  counterAccountName: string;
  amount: number;
  date: string;
  sortCode: number | null;
  sortCodeName: string;
  accountKey: number;
  accountName: string;
  details: string;
}

interface RecurringExpensesAnalysisProps {
  transactions: Transaction[];
  months: number[];
  formatCurrency: (amount: number) => string;
}

interface VendorAnalysis {
  vendorKey: number;
  vendorName: string;
  sortCode: number | null;
  sortCodeName: string;
  monthsActive: number[];
  monthsMissing: number[];
  totalMonths: number;
  frequency: number; // אחוז הופעה
  amounts: { [month: number]: number };
  avgAmount: number;
  isRecurring: boolean; // האם זה ספק קבוע (מופיע ב-3+ חודשים)
  alerts: Alert[];
}

interface Alert {
  type: 'missing' | 'low_amount' | 'high_amount' | 'first_time' | 'stopped';
  message: string;
  severity: 'warning' | 'error' | 'info';
  month?: number;
}

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

export const RecurringExpensesAnalysis: React.FC<RecurringExpensesAnalysisProps> = ({
  transactions,
  months,
  formatCurrency
}) => {
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(true);
  const [expandedVendors, setExpandedVendors] = useState<Set<number>>(new Set());
  const [selectedSortCode, setSelectedSortCode] = useState<number | 'all'>('all');

  // ניתוח ספקים
  const analysis = useMemo((): VendorAnalysis[] => {
    if (!transactions.length || !months.length) return [];

    // קיבוץ לפי ספק (vendorKey)
    const vendorMap = new Map<number, {
      vendorName: string;
      sortCode: number | null;
      sortCodeName: string;
      monthlyAmounts: { [month: number]: number };
      transactions: Transaction[];
    }>();

    // סינון רק הוצאות (לא הכנסות)
    const expenseTransactions = transactions.filter(tx =>
      tx.sortCode && tx.sortCode >= 800 && tx.sortCode !== 600
    );

    expenseTransactions.forEach(tx => {
      const key = tx.vendorKey || tx.counterAccountNumber;
      if (!key || key === 0) return;

      const month = parseInt(tx.date.split('/')[1]);
      if (!months.includes(month)) return;

      if (!vendorMap.has(key)) {
        vendorMap.set(key, {
          vendorName: tx.vendorName || tx.counterAccountName || 'לא ידוע',
          sortCode: tx.sortCode,
          sortCodeName: tx.sortCodeName,
          monthlyAmounts: {},
          transactions: []
        });
      }

      const vendor = vendorMap.get(key)!;
      vendor.monthlyAmounts[month] = (vendor.monthlyAmounts[month] || 0) + Math.abs(tx.amount);
      vendor.transactions.push(tx);
    });

    // ניתוח כל ספק
    const results: VendorAnalysis[] = [];
    const lastMonth = Math.max(...months);
    const firstMonth = Math.min(...months);

    vendorMap.forEach((data, vendorKey) => {
      const monthsActive = Object.keys(data.monthlyAmounts).map(Number).sort((a, b) => a - b);
      const monthsMissing: number[] = [];
      const alerts: Alert[] = [];

      // חישוב ממוצע
      const amounts = Object.values(data.monthlyAmounts);
      const avgAmount = amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;

      // זיהוי ספק קבוע (מופיע ב-3+ חודשים)
      const isRecurring = monthsActive.length >= 3;

      if (isRecurring) {
        // בדיקת חודשים חסרים - רק בטווח הפעילות
        const firstActive = Math.min(...monthsActive);
        const lastActive = Math.max(...monthsActive);

        for (let m = firstActive; m <= lastMonth; m++) {
          if (months.includes(m) && !monthsActive.includes(m)) {
            monthsMissing.push(m);
            alerts.push({
              type: 'missing',
              message: `חסרה חשבונית ב${MONTH_NAMES[m - 1]}`,
              severity: m === lastMonth ? 'error' : 'warning',
              month: m
            });
          }
        }

        // בדיקת סטיות בסכום (מעל 50% מהממוצע)
        Object.entries(data.monthlyAmounts).forEach(([monthStr, amount]) => {
          const month = parseInt(monthStr);
          const deviation = Math.abs(amount - avgAmount) / avgAmount;

          if (deviation > 0.5 && avgAmount > 100) {
            if (amount < avgAmount) {
              alerts.push({
                type: 'low_amount',
                message: `סכום נמוך ב${MONTH_NAMES[month - 1]}: ${formatCurrency(amount)} (ממוצע: ${formatCurrency(avgAmount)})`,
                severity: 'info',
                month
              });
            } else {
              alerts.push({
                type: 'high_amount',
                message: `סכום גבוה ב${MONTH_NAMES[month - 1]}: ${formatCurrency(amount)} (ממוצע: ${formatCurrency(avgAmount)})`,
                severity: 'info',
                month
              });
            }
          }
        });

        // בדיקה אם הספק הפסיק להופיע
        if (lastActive < lastMonth - 1 && monthsActive.length >= 4) {
          alerts.push({
            type: 'stopped',
            message: `הספק הפסיק להופיע אחרי ${MONTH_NAMES[lastActive - 1]}`,
            severity: 'warning'
          });
        }
      }

      // ספק חדש (הופיע רק בחודש האחרון)
      if (monthsActive.length === 1 && monthsActive[0] === lastMonth) {
        alerts.push({
          type: 'first_time',
          message: 'ספק חדש - הופיע לראשונה החודש',
          severity: 'info'
        });
      }

      results.push({
        vendorKey,
        vendorName: data.vendorName,
        sortCode: data.sortCode,
        sortCodeName: data.sortCodeName,
        monthsActive,
        monthsMissing,
        totalMonths: months.length,
        frequency: (monthsActive.length / months.length) * 100,
        amounts: data.monthlyAmounts,
        avgAmount,
        isRecurring,
        alerts
      });
    });

    // מיון: קודם לפי כמות התראות, אח"כ לפי תדירות
    return results
      .filter(v => v.isRecurring || v.alerts.length > 0)
      .sort((a, b) => {
        // קודם לפי חומרת התראות
        const aErrors = a.alerts.filter(al => al.severity === 'error').length;
        const bErrors = b.alerts.filter(al => al.severity === 'error').length;
        if (aErrors !== bErrors) return bErrors - aErrors;

        const aWarnings = a.alerts.filter(al => al.severity === 'warning').length;
        const bWarnings = b.alerts.filter(al => al.severity === 'warning').length;
        if (aWarnings !== bWarnings) return bWarnings - aWarnings;

        // אח"כ לפי תדירות
        return b.frequency - a.frequency;
      });
  }, [transactions, months, formatCurrency]);

  // קודי מיון ייחודיים
  const sortCodes = useMemo(() => {
    const codes = new Set<number>();
    analysis.forEach(v => {
      if (v.sortCode) codes.add(v.sortCode);
    });
    return Array.from(codes).sort((a, b) => a - b);
  }, [analysis]);

  // סינון לפי קוד מיון
  const filteredAnalysis = useMemo(() => {
    let filtered = analysis;

    if (selectedSortCode !== 'all') {
      filtered = filtered.filter(v => v.sortCode === selectedSortCode);
    }

    if (showOnlyAlerts) {
      filtered = filtered.filter(v => v.alerts.length > 0);
    }

    return filtered;
  }, [analysis, selectedSortCode, showOnlyAlerts]);

  // סטטיסטיקות
  const stats = useMemo(() => {
    const totalAlerts = analysis.reduce((sum, v) => sum + v.alerts.length, 0);
    const missingAlerts = analysis.reduce((sum, v) =>
      sum + v.alerts.filter(a => a.type === 'missing').length, 0);
    const recurringVendors = analysis.filter(v => v.isRecurring).length;

    return { totalAlerts, missingAlerts, recurringVendors };
  }, [analysis]);

  const toggleVendor = (vendorKey: number) => {
    const newSet = new Set(expandedVendors);
    if (newSet.has(vendorKey)) {
      newSet.delete(vendorKey);
    } else {
      newSet.add(vendorKey);
    }
    setExpandedVendors(newSet);
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  if (!transactions.length) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>אין נתונים לניתוח</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* כותרת */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <TrendingDown className="w-6 h-6 text-orange-500" />
          ניתוח הוצאות חוזרות
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          זיהוי ספקים קבועים, חודשים חסרים וסטיות בסכומים
        </p>
      </div>

      {/* סטטיסטיקות */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.recurringVendors}</div>
          <div className="text-sm text-blue-800">ספקים קבועים</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-amber-600">{stats.totalAlerts}</div>
          <div className="text-sm text-amber-800">התראות סה"כ</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{stats.missingAlerts}</div>
          <div className="text-sm text-red-800">חשבוניות חסרות</div>
        </div>
      </div>

      {/* פילטרים */}
      <div className="flex gap-4 mb-4 items-center">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyAlerts}
            onChange={(e) => setShowOnlyAlerts(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-gray-700">הצג רק ספקים עם התראות</span>
        </label>

        <select
          value={selectedSortCode}
          onChange={(e) => setSelectedSortCode(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">כל קודי המיון</option>
          {sortCodes.map(code => (
            <option key={code} value={code}>{code}</option>
          ))}
        </select>
      </div>

      {/* רשימת ספקים */}
      <div className="space-y-2">
        {filteredAnalysis.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p>לא נמצאו התראות!</p>
            <p className="text-sm">כל ההוצאות החוזרות תקינות</p>
          </div>
        ) : (
          filteredAnalysis.map(vendor => (
            <div
              key={vendor.vendorKey}
              className={`border rounded-lg overflow-hidden ${
                vendor.alerts.some(a => a.severity === 'error')
                  ? 'border-red-300 bg-red-50'
                  : vendor.alerts.some(a => a.severity === 'warning')
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-gray-200 bg-white'
              }`}
            >
              {/* כותרת ספק */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-opacity-80"
                onClick={() => toggleVendor(vendor.vendorKey)}
              >
                <div className="flex items-center gap-3">
                  <button className="p-1">
                    {expandedVendors.has(vendor.vendorKey)
                      ? <ChevronDown className="w-4 h-4" />
                      : <ChevronLeft className="w-4 h-4" />
                    }
                  </button>
                  <div>
                    <div className="font-medium text-gray-800">
                      {vendor.vendorName}
                      <span className="text-xs text-gray-500 mr-2">({vendor.vendorKey})</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {vendor.sortCodeName} | ממוצע: {formatCurrency(vendor.avgAmount)} |
                      תדירות: {vendor.frequency.toFixed(0)}%
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {vendor.alerts.length > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vendor.alerts.some(a => a.severity === 'error')
                        ? 'bg-red-200 text-red-800'
                        : vendor.alerts.some(a => a.severity === 'warning')
                          ? 'bg-amber-200 text-amber-800'
                          : 'bg-blue-200 text-blue-800'
                    }`}>
                      {vendor.alerts.length} התראות
                    </span>
                  )}
                </div>
              </div>

              {/* פרטים מורחבים */}
              {expandedVendors.has(vendor.vendorKey) && (
                <div className="border-t p-4 bg-white">
                  {/* חודשים */}
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">פעילות חודשית:</div>
                    <div className="flex gap-1 flex-wrap">
                      {months.map(m => {
                        const isActive = vendor.monthsActive.includes(m);
                        const isMissing = vendor.monthsMissing.includes(m);
                        return (
                          <div
                            key={m}
                            className={`w-16 px-2 py-1 text-xs text-center rounded ${
                              isActive
                                ? 'bg-green-100 text-green-800'
                                : isMissing
                                  ? 'bg-red-100 text-red-800 font-bold'
                                  : 'bg-gray-100 text-gray-400'
                            }`}
                            title={isActive ? formatCurrency(vendor.amounts[m]) : isMissing ? 'חסר!' : 'לא פעיל'}
                          >
                            {MONTH_NAMES[m - 1].slice(0, 3)}
                            {isActive && (
                              <div className="text-[10px]">{formatCurrency(vendor.amounts[m])}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* התראות */}
                  {vendor.alerts.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">התראות:</div>
                      <div className="space-y-1">
                        {vendor.alerts.map((alert, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                              alert.severity === 'error'
                                ? 'bg-red-100 text-red-800'
                                : alert.severity === 'warning'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {getAlertIcon(alert.severity)}
                            {alert.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecurringExpensesAnalysis;
