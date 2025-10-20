import React, { useState, useMemo } from 'react';
import { CheckCircle, AlertCircle, XCircle, ChevronDown, ChevronLeft, Search, Bug } from 'lucide-react';

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

// ===== INTERFACES =====
interface Transaction {
  accountKey: number;
  accountName: string;
  sortCode: number;
  sortCodeName: string;
  amount: number;
  month: number;
  title?: string;
  details?: string;
  valueDate?: string;
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
  transactionCount?: number;
  transactionsList?: Transaction[];
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
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [selectedDebugCard, setSelectedDebugCard] = useState<number | null>(null);
  const [selectedDebugMonth, setSelectedDebugMonth] = useState<number | null>(null);

  // ===== COMPARISON LOGIC WITH DEBUG =====
  const comparisonData = useMemo((): CardComparisonRow[] => {
    console.log('🔍 בונה השוואה ברמת כרטיס...');

    // שלב 1: חשב סכומים מתנועות לפי כרטיס וחודש
    const transactionsByCard = new Map<number, {
      accountName: string;
      sortCode: number;
      sortCodeName: string;
      months: { [month: number]: { total: number; count: number; list: Transaction[] } };
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
        card.months[tx.month] = { total: 0, count: 0, list: [] };
      }
      card.months[tx.month].total += tx.amount;
      card.months[tx.month].count += 1;
      card.months[tx.month].list.push(tx);
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
        const transData = trans?.months[month];
        const transAmount = transData?.total || 0;
        const trialAmount = trial?.months[month] || 0;
        const diff = transAmount - trialAmount;

        monthlyComparison[month] = {
          fromTransactions: transAmount,
          fromTrialBalance: trialAmount,
          diff: Math.abs(diff),
          matched: Math.abs(diff) < 0.01,
          transactionCount: transData?.count || 0,
          transactionsList: transData?.list || []
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
      .map(([code, cards]) => {
        const totalBiurim = cards.reduce((sum, c) => sum + c.totalFromTransactions, 0);
        const totalMazan = cards.reduce((sum, c) => sum + c.totalFromTrialBalance, 0);
        const totalDiff = Math.abs(totalBiurim - totalMazan);
        
        return {
          code,
          name: cards[0].sortCodeName || `קוד ${code}`,
          cards,
          totalBiurim,
          totalMazan,
          totalDiff,
          matched: totalDiff <= 5
        };
      })
      .sort((a, b) => a.code - b.code);

    // סינון הפרשים בלבד
    if (showOnlyDifferences) {
      result = result
        .map(group => ({
          ...group,
          cards: group.cards.filter(card => !card.matched)
        }))
        .filter(group => group.cards.length > 0 || !group.matched);
    }

    return result;
  }, [comparisonData, showOnlyDifferences]);

  // ===== DEBUG PANEL =====
  const renderDebugPanel = (card: CardComparisonRow, month: number) => {
    const monthData = card.monthlyComparison[month];
    if (!monthData) return null;

    const trial = trialBalance.find(tb => tb.accountKey === card.accountKey);

    return (
      <div style={{
        background: '#fef3c7',
        border: '2px solid #f59e0b',
        borderRadius: '8px',
        padding: '1rem',
        margin: '0.5rem 0',
        fontSize: '13px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#92400e' }}>
          🔍 DEBUG - חשבון {card.accountKey} - {MONTH_NAMES[month - 1]}
        </div>

        {/* חלק 1: סיכום */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: '1rem',
          marginBottom: '1rem',
          padding: '0.5rem',
          background: 'white',
          borderRadius: '6px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>מתנועות</div>
            <div style={{ fontWeight: 'bold' }}>{formatCurrency(monthData.fromTransactions)}</div>
            <div style={{ fontSize: '10px', color: '#6b7280' }}>
              {monthData.transactionCount} תנועות
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>ממאזן בוחן</div>
            <div style={{ fontWeight: 'bold' }}>{formatCurrency(monthData.fromTrialBalance)}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>הפרש</div>
            <div style={{ 
              fontWeight: 'bold',
              color: monthData.matched ? '#10b981' : '#dc2626'
            }}>
              {formatCurrency(monthData.diff)}
            </div>
          </div>
        </div>

        {/* חלק 2: רשימת תנועות */}
        {monthData.transactionsList && monthData.transactionsList.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '12px' }}>
              📋 רשימת תנועות ({monthData.transactionsList.length}):
            </div>
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto',
              background: 'white',
              borderRadius: '6px',
              padding: '0.5rem'
            }}>
              {monthData.transactionsList.map((tx, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '0.25rem',
                    borderBottom: idx < monthData.transactionsList!.length - 1 ? '1px solid #e5e7eb' : 'none',
                    fontSize: '11px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{tx.title || tx.details || 'ללא תיאור'}</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                  {tx.valueDate && (
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>
                      תאריך: {tx.valueDate}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ 
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: '#f3f4f6',
              borderRadius: '6px',
              fontWeight: 'bold'
            }}>
              סה"כ מחושב: {formatCurrency(
                monthData.transactionsList.reduce((sum, tx) => sum + tx.amount, 0)
              )}
            </div>
          </div>
        )}

        {/* חלק 3: נתוני מאזן בוחן */}
        {trial && (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '12px' }}>
              📊 מאזן בוחן - חשבון {card.accountKey}:
            </div>
            <div style={{
              background: 'white',
              borderRadius: '6px',
              padding: '0.5rem'
            }}>
              <div style={{ fontSize: '11px' }}>
                <div>שם: {trial.accountName}</div>
                <div>קוד מיון: {trial.sortCode} - {trial.sortCodeName}</div>
                <div>יתרה לחודש {month}: {formatCurrency(trial.months[month] || 0)}</div>
              </div>
            </div>
          </div>
        )}

        {/* חלק 4: זיהוי בעיה */}
        {!monthData.matched && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#fecaca',
            borderRadius: '6px',
            border: '1px solid #dc2626'
          }}>
            <div style={{ fontWeight: 'bold', color: '#991b1b', marginBottom: '0.5rem' }}>
              ⚠️ זיהוי בעיה:
            </div>
            <div style={{ fontSize: '11px', color: '#7f1d1d' }}>
              {(monthData.transactionCount ?? 0) === 0 && (monthData.fromTrialBalance ?? 0) !== 0 && (
                <div>❌ אין תנועות אבל יש יתרה במאזן בוחן!</div>
              )}
              {(monthData.transactionCount ?? 0) > 0 && (monthData.fromTrialBalance ?? 0) === 0 && (
                <div>⚠️ יש תנועות אבל אין יתרה במאזן בוחן</div>
              )}
              {(monthData.transactionCount ?? 0) > 0 && (monthData.fromTrialBalance ?? 0) !== 0 && (
                <div>
                  🔍 סכום התנועות ({formatCurrency(monthData.fromTransactions ?? 0)}) 
                  לא תואם ליתרה במאזן ({formatCurrency(monthData.fromTrialBalance ?? 0)})
                  <br/>
                  → בדוק: האם כל התנועות נכללו? האם יתרה במאזן מצטברת?
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ===== RENDER =====
  return (
    <div style={{ padding: '1.5rem' }}>
      {/* כפתורי בקרה */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '1.5rem',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setShowOnlyDifferences(!showOnlyDifferences)}
          style={{
            padding: '0.5rem 1rem',
            background: showOnlyDifferences ? '#dc2626' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {showOnlyDifferences ? (
            <>
              <XCircle size={16} />
              הצג רק הפרשים
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              הצג הכל (כולל תקינים)
            </>
          )}
        </button>

        <button
          onClick={() => setDebugMode(!debugMode)}
          style={{
            padding: '0.5rem 1rem',
            background: debugMode ? '#f59e0b' : '#e5e7eb',
            color: debugMode ? 'white' : '#374151',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Bug size={16} />
          {debugMode ? 'מצב DEBUG פעיל' : 'הפעל DEBUG'}
        </button>

        <div style={{
          marginRight: 'auto',
          fontSize: '13px',
          color: '#6b7280',
          padding: '0.5rem 1rem',
          background: '#f9fafb',
          borderRadius: '6px',
          border: '1px solid #e5e7eb'
        }}>
          {showOnlyDifferences ? (
            <span>🔍 מציג רק הפרשים</span>
          ) : (
            <span>📊 מציג את כל הכרטיסים</span>
          )}
        </div>
      </div>

      {/* קודי מיון */}
      {groupedByCode.map(group => {
        const isExpanded = expandedCodes.has(group.code);
        
        return (
          <div 
            key={group.code}
            style={{
              marginBottom: '1.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
            {/* כותרת קוד מיון */}
            <div
              onClick={() => {
                const newExpanded = new Set(expandedCodes);
                if (isExpanded) {
                  newExpanded.delete(group.code);
                } else {
                  newExpanded.add(group.code);
                }
                setExpandedCodes(newExpanded);
              }}
              style={{
                padding: '1rem',
                background: group.matched ? '#f0fdf4' : '#fef2f2',
                borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {isExpanded ? <ChevronDown size={20} /> : <ChevronLeft size={20} />}
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                    קוד {group.code} - {group.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '0.25rem' }}>
                    {group.cards.length} כרטיסים | 
                    ביאורים: {formatCurrency(group.totalBiurim)} | 
                    מאזן: {formatCurrency(group.totalMazan)}
                  </div>
                </div>
              </div>
              <div style={{
                padding: '0.5rem 1rem',
                background: group.matched ? '#10b981' : '#dc2626',
                color: 'white',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {group.matched ? '✓ תקין' : `הפרש: ${formatCurrency(group.totalDiff)}`}
              </div>
            </div>

            {/* כרטיסים */}
            {isExpanded && (
              <div style={{ padding: '1rem' }}>
                {group.cards.map(card => {
                  const isCardExpanded = expandedCards.has(card.accountKey);
                  
                  return (
                    <div 
                      key={card.accountKey}
                      style={{
                        marginBottom: '1rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        overflow: 'hidden'
                      }}
                    >
                      {/* כותרת כרטיס */}
                      <div
                        onClick={() => {
                          const newExpanded = new Set(expandedCards);
                          if (isCardExpanded) {
                            newExpanded.delete(card.accountKey);
                          } else {
                            newExpanded.add(card.accountKey);
                          }
                          setExpandedCards(newExpanded);
                        }}
                        style={{
                          padding: '0.75rem',
                          background: card.matched ? '#fafafa' : '#fef2f2',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isCardExpanded ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
                          <div>
                            <span style={{ fontWeight: 'bold' }}>
                              {card.accountKey} - {card.accountName}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '13px' }}>
                          <span>ביאורים: {formatCurrency(card.totalFromTransactions)}</span>
                          <span>מאזן: {formatCurrency(card.totalFromTrialBalance)}</span>
                          <span style={{
                            color: card.matched ? '#10b981' : '#dc2626',
                            fontWeight: 'bold'
                          }}>
                            {card.matched ? '✓' : `הפרש: ${formatCurrency(card.totalDiff)}`}
                          </span>
                        </div>
                      </div>

                      {/* פירוט חודשי */}
                      {isCardExpanded && (
                        <div style={{ padding: '1rem', background: 'white' }}>
                          <table style={{ width: '100%', fontSize: '13px' }}>
                            <thead>
                              <tr style={{ background: '#f9fafb' }}>
                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>חודש</th>
                                <th style={{ padding: '0.5rem', textAlign: 'center' }}>מתנועות</th>
                                <th style={{ padding: '0.5rem', textAlign: 'center' }}>ממאזן</th>
                                <th style={{ padding: '0.5rem', textAlign: 'center' }}>הפרש</th>
                                <th style={{ padding: '0.5rem', textAlign: 'center' }}>סטטוס</th>
                                {debugMode && (
                                  <th style={{ padding: '0.5rem', textAlign: 'center' }}>פעולות</th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {activeMonths.map(month => {
                                const data = card.monthlyComparison[month];
                                if (!data) return null;

                                const showDebug = debugMode && 
                                  selectedDebugCard === card.accountKey && 
                                  selectedDebugMonth === month;

                                return (
                                  <React.Fragment key={month}>
                                    <tr style={{ 
                                      borderBottom: '1px solid #e5e7eb',
                                      background: data.matched ? 'white' : '#fef2f2'
                                    }}>
                                      <td style={{ padding: '0.5rem', fontWeight: '500' }}>
                                        {MONTH_NAMES[month - 1]}
                                      </td>
                                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                        {formatCurrency(data.fromTransactions)}
                                        {data.transactionCount !== undefined && (
                                          <div style={{ fontSize: '10px', color: '#6b7280' }}>
                                            {data.transactionCount} תנועות
                                          </div>
                                        )}
                                      </td>
                                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                        {formatCurrency(data.fromTrialBalance)}
                                      </td>
                                      <td style={{ 
                                        padding: '0.5rem', 
                                        textAlign: 'center',
                                        color: data.matched ? '#10b981' : '#dc2626',
                                        fontWeight: 'bold'
                                      }}>
                                        {formatCurrency(data.diff)}
                                      </td>
                                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                        {data.matched ? (
                                          <span style={{ color: '#10b981' }}>✓</span>
                                        ) : (
                                          <span style={{ color: '#dc2626' }}>✗</span>
                                        )}
                                      </td>
                                      {debugMode && (
                                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                          <button
                                            onClick={() => {
                                              if (showDebug) {
                                                setSelectedDebugCard(null);
                                                setSelectedDebugMonth(null);
                                              } else {
                                                setSelectedDebugCard(card.accountKey);
                                                setSelectedDebugMonth(month);
                                              }
                                            }}
                                            style={{
                                              padding: '0.25rem 0.5rem',
                                              background: showDebug ? '#f59e0b' : '#e5e7eb',
                                              color: showDebug ? 'white' : '#374151',
                                              border: 'none',
                                              borderRadius: '4px',
                                              cursor: 'pointer',
                                              fontSize: '11px'
                                            }}
                                          >
                                            {showDebug ? 'סגור' : 'בדוק'}
                                          </button>
                                        </td>
                                      )}
                                    </tr>
                                    {showDebug && (
                                      <tr>
                                        <td colSpan={debugMode ? 6 : 5} style={{ padding: '0' }}>
                                          {renderDebugPanel(card, month)}
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                              {/* שורת סה"כ */}
                              <tr style={{ background: '#f3f4f6', fontWeight: 'bold' }}>
                                <td style={{ padding: '0.5rem' }}>סה"כ</td>
                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                  {formatCurrency(card.totalFromTransactions)}
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                  {formatCurrency(card.totalFromTrialBalance)}
                                </td>
                                <td style={{ 
                                  padding: '0.5rem', 
                                  textAlign: 'center',
                                  color: card.matched ? '#10b981' : '#dc2626'
                                }}>
                                  {formatCurrency(card.totalDiff)}
                                </td>
                                <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                                  {card.matched ? (
                                    <CheckCircle size={16} style={{ color: '#10b981' }} />
                                  ) : (
                                    <XCircle size={16} style={{ color: '#dc2626' }} />
                                  )}
                                </td>
                                {debugMode && <td></td>}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* אין תוצאות */}
      {groupedByCode.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          color: '#6b7280'
        }}>
          {showOnlyDifferences ? (
            <>
              <CheckCircle size={64} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                כל הכרטיסים תואמים!
              </div>
              <div style={{ fontSize: '14px', marginTop: '0.5rem' }}>
                אין הפרשים בין התנועות למאזן בוחן
              </div>
            </>
          ) : (
            <div>אין נתונים להצגה</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ComparisonTab;