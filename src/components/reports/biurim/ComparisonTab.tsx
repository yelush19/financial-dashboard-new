import React, { useState, useMemo } from 'react';
import { CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronLeft } from 'lucide-react';

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

// ===== INTERFACES =====
interface Transaction {
  accountKey: number;
  accountName: string;
  sortCode: number;
  sortCodeName: string;
  amount: number;
  month: number;
}

interface TrialBalanceRecord {
  accountKey: number;
  accountName: string;
  sortCode: number;
  sortCodeName: string;
  months: { [month: number]: number };
}

interface ComparisonTabProps {
  transactions: Transaction[];
  trialBalance: TrialBalanceRecord[];
  activeMonths: number[];
  formatCurrency: (amount: number) => string;
}

interface MonthComparison {
  fromTransactions: number;
  fromTrialBalance: number;
  diff: number;
  matched: boolean;
}

interface CardComparisonRow {
  accountKey: number;
  accountName: string;
  sortCode: number;
  sortCodeName: string;
  monthlyComparison: { [month: number]: MonthComparison };
  totalFromTransactions: number;
  totalFromTrialBalance: number;
  totalDiff: number;
  matched: boolean;
}

// ===== COMPONENT =====
const ComparisonTab: React.FC<ComparisonTabProps> = ({
  transactions,
  trialBalance,
  activeMonths,
  formatCurrency
}) => {
  const [expandedCodes, setExpandedCodes] = useState<Set<number>>(new Set());
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);

  // ===== COMPARISON LOGIC =====
  const comparisonData = useMemo((): CardComparisonRow[] => {
    console.log('🔍 בונה השוואה ברמת כרטיס...');

    // שלב 1: חשב סכומים מתנועות לפי כרטיס וחודש
    const transactionsByCard = new Map<number, {
      accountName: string;
      sortCode: number;
      sortCodeName: string;
      months: { [month: number]: number };
    }>();

    transactions.forEach(tx => {
      if (!transactionsByCard.has(tx.accountKey)) {
        transactionsByCard.set(tx.accountKey, {
          accountName: tx.accountName,
          sortCode: tx.sortCode,
          sortCodeName: tx.sortCodeName,
          months: {}
        });
      }

      const card = transactionsByCard.get(tx.accountKey)!;
      if (!card.months[tx.month]) {
        card.months[tx.month] = 0;
      }
      card.months[tx.month] += tx.amount;
    });

    // שלב 2: איחוד - כל הכרטיסים (מתנועות או ממאזן)
    const allKeys = new Set([
      ...transactionsByCard.keys(),
      ...trialBalance.map(tb => tb.accountKey)
    ]);

    console.log('📊 סה"כ כרטיסים להשוואה:', allKeys.size);

    // שלב 3: בניית השוואה לכל כרטיס
    const result = Array.from(allKeys).map(accountKey => {
      const trans = transactionsByCard.get(accountKey);
      const trial = trialBalance.find(tb => tb.accountKey === accountKey);

      const monthlyComparison: { [month: number]: MonthComparison } = {};
      let totalTrans = 0;
      let totalTrial = 0;

      activeMonths.forEach(month => {
        const transAmount = trans?.months[month] || 0;
        const trialAmount = trial?.months[month] || 0;
        const diff = Math.abs(transAmount - trialAmount);

        monthlyComparison[month] = {
          fromTransactions: transAmount,
          fromTrialBalance: trialAmount,
          diff: diff,
          matched: diff < 1
        };

        totalTrans += transAmount;
        totalTrial += trialAmount;
      });

      const totalDiff = Math.abs(totalTrans - totalTrial);

      return {
        accountKey,
        accountName: trans?.accountName || trial?.accountName || '',
        sortCode: trans?.sortCode || trial?.sortCode || 0,
        sortCodeName: trans?.sortCodeName || trial?.sortCodeName || '',
        monthlyComparison,
        totalFromTransactions: totalTrans,
        totalFromTrialBalance: totalTrial,
        totalDiff,
        matched: totalDiff < 1
      };
    });

    return result.sort((a, b) => a.sortCode - b.sortCode || a.accountKey - b.accountKey);
  }, [transactions, trialBalance, activeMonths]);

  // ===== GROUP BY SORT CODE =====
  const groupedByCode = useMemo(() => {
    const groups = new Map<number, CardComparisonRow[]>();

    comparisonData.forEach(row => {
      if (!groups.has(row.sortCode)) {
        groups.set(row.sortCode, []);
      }
      groups.get(row.sortCode)!.push(row);
    });

    let result = Array.from(groups.entries())
      .map(([code, cards]) => ({
        code,
        name: cards[0].sortCodeName || `קוד ${code}`,
        cards
      }))
      .sort((a, b) => a.code - b.code);

    // סינון הפרשים בלבד
    if (showOnlyDifferences) {
      result = result
        .map(group => ({
          ...group,
          cards: group.cards.filter(card => !card.matched)
        }))
        .filter(group => group.cards.length > 0);
    }

    return result;
  }, [comparisonData, showOnlyDifferences]);

  // ===== STATS =====
  const stats = useMemo(() => {
    const total = comparisonData.length;
    const matched = comparisonData.filter(c => c.matched).length;
    const unmatched = total - matched;
    const totalDiff = comparisonData.reduce((sum, c) => sum + c.totalDiff, 0);

    return { total, matched, unmatched, totalDiff };
  }, [comparisonData]);

  // ===== RENDER =====
  return (
    <div className="p-6" dir="rtl">
      {/* כותרת */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">
          🔍 השוואה: ביאורים לפי קוד מיון ⟷ יתרות מאזניות
        </h2>
        <p className="text-gray-600 mb-4">
          השוואה ברמת <strong>כרטיס (accountKey)</strong> לכל חודש
        </p>

        {/* סטטיסטיקות */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-500">
            <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
            <div className="text-sm text-blue-600">סה"כ כרטיסים</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-500">
            <div className="text-2xl font-bold text-green-700">{stats.matched}</div>
            <div className="text-sm text-green-600">תואמים (&lt;1₪)</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border-2 border-red-500">
            <div className="text-2xl font-bold text-red-700">{stats.unmatched}</div>
            <div className="text-sm text-red-600">לא תואמים</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-500">
            <div className="text-2xl font-bold text-yellow-700">{formatCurrency(stats.totalDiff)}</div>
            <div className="text-sm text-yellow-600">סה"כ הפרשים</div>
          </div>
        </div>

        {/* פילטר */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOnlyDifferences}
            onChange={e => setShowOnlyDifferences(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">הצג רק כרטיסים עם הפרשים</span>
        </label>
      </div>

      {/* קבוצות לפי קוד מיון */}
      <div className="space-y-4">
        {groupedByCode.map(group => {
          const isExpanded = expandedCodes.has(group.code);
          const groupMatched = group.cards.filter(c => c.matched).length;
          const groupUnmatched = group.cards.length - groupMatched;

          return (
            <div key={group.code} className="bg-white rounded-lg shadow border">
              {/* כותרת קוד מיון */}
              <div
                className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 cursor-pointer hover:bg-blue-100 flex items-center justify-between"
                onClick={() => {
                  const newSet = new Set(expandedCodes);
                  if (newSet.has(group.code)) {
                    newSet.delete(group.code);
                  } else {
                    newSet.add(group.code);
                  }
                  setExpandedCodes(newSet);
                }}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-blue-600" />
                  ) : (
                    <ChevronLeft className="w-5 h-5 text-blue-600" />
                  )}
                  <span className="font-bold text-blue-900">קוד {group.code}</span>
                  <span className="text-blue-700">- {group.name}</span>
                  <span className="text-sm text-gray-600">
                    ({group.cards.length} כרטיסים: {groupMatched} ✅ | {groupUnmatched} ❌)
                  </span>
                </div>
              </div>

              {/* כרטיסים */}
              {isExpanded && (
                <div className="p-4">
                  {group.cards.map(card => (
                    <div
                      key={card.accountKey}
                      className={`mb-4 rounded-lg p-3 ${
                        card.matched ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      {/* כותרת כרטיס */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {card.matched ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <span className="font-semibold">{card.accountKey}</span>
                          <span>- {card.accountName}</span>
                        </div>
                        <div className={`text-sm font-bold ${card.matched ? 'text-green-700' : 'text-red-700'}`}>
                          הפרש: {formatCurrency(card.totalDiff)}
                        </div>
                      </div>

                      {/* טבלת חודשים */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-2 text-right border">חודש</th>
                              <th className="p-2 text-center border">מתנועות</th>
                              <th className="p-2 text-center border">ממאזן</th>
                              <th className="p-2 text-center border">הפרש</th>
                              <th className="p-2 text-center border">סטטוס</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeMonths.map(month => {
                              const data = card.monthlyComparison[month];
                              return (
                                <tr key={month} className="border-b">
                                  <td className="p-2 font-semibold">{MONTH_NAMES[month - 1]}</td>
                                  <td className="p-2 text-center">{formatCurrency(data.fromTransactions)}</td>
                                  <td className="p-2 text-center">{formatCurrency(data.fromTrialBalance)}</td>
                                  <td className={`p-2 text-center font-bold ${data.matched ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(data.diff)}
                                  </td>
                                  <td className="p-2 text-center">
                                    {data.matched ? (
                                      <span className="text-green-600">✓</span>
                                    ) : (
                                      <span className="text-red-600">✗</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            {/* שורת סיכום */}
                            <tr className="bg-gray-200 font-bold">
                              <td className="p-2">סה"כ</td>
                              <td className="p-2 text-center">{formatCurrency(card.totalFromTransactions)}</td>
                              <td className="p-2 text-center">{formatCurrency(card.totalFromTrialBalance)}</td>
                              <td className={`p-2 text-center ${card.matched ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(card.totalDiff)}
                              </td>
                              <td className="p-2 text-center">
                                {card.matched ? (
                                  <CheckCircle className="w-4 h-4 text-green-600 inline" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-600 inline" />
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* אין תוצאות */}
      {groupedByCode.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {showOnlyDifferences ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-xl font-bold text-green-700">כל הכרטיסים תואמים!</p>
              <p className="text-sm mt-2">אין הפרשים בין התנועות למאזן בוחן</p>
            </>
          ) : (
            <p>אין נתונים להצגה</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ComparisonTab;