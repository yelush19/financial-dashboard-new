// ==========================================
// 📄 BiurimTab.tsx - טאב ביאורים
// תיקון: כרטיס 40000 מציג סיכום חודשי בלבד
// עדכון: הוסרה שורת הסטטיסטיקות הכללית
// ==========================================

import React, { useState, useMemo } from 'react';

interface Transaction {
  title: string;
  movement: number;
  valueDate: string;
  details: string;
  accountKey: number;
  accountName: string;
  sortCode: number;
  sortCodeName: string;
  counterAccountName: string;
  amount: number;
  month: number;
}

interface Account {
  accountKey: number;
  accountName: string;
  transactions: Transaction[];
  total: number;
}

interface CodeGroup {
  code: string;
  name: string;
  accounts: Account[];
}

interface BiurimTabProps {
  dataByCode: CodeGroup[];
  formatCurrency: (amount: number) => string;
}

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 
                     'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

const BiurimTab: React.FC<BiurimTabProps> = ({ dataByCode, formatCurrency }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());
  const [expandedAccounts, setExpandedAccounts] = useState<Set<number>>(new Set());

  // פונקציה לסיכום חודשי
  const getMonthlySummary = (transactions: Transaction[]) => {
    const monthlyMap = new Map<number, { month: number; count: number; total: number }>();
    
    transactions.forEach(tx => {
      if (!monthlyMap.has(tx.month)) {
        monthlyMap.set(tx.month, { month: tx.month, count: 0, total: 0 });
      }
      const summary = monthlyMap.get(tx.month)!;
      summary.count++;
      summary.total += tx.amount;
    });

    return Array.from(monthlyMap.values()).sort((a, b) => a.month - b.month);
  };

  // סינון נתונים
  const filteredData = useMemo(() => {
    if (!searchTerm) {
      // 🔥 הוסף סינון: הסתר חשבונות עם סכום 0
      return dataByCode.map(code => ({
        ...code,
        accounts: code.accounts.filter(acc => Math.abs(acc.total) > 0.01)
      })).filter(code => code.accounts.length > 0);
    }
    
    const lowerSearch = searchTerm.toLowerCase();
    return dataByCode
      .map(code => ({
        ...code,
        accounts: code.accounts
          .filter(acc => Math.abs(acc.total) > 0.01) // 🔥 הסתר חשבונות עם סכום 0
          .filter(acc =>
            acc.accountName.toLowerCase().includes(lowerSearch) ||
            acc.accountKey.toString().includes(lowerSearch) ||
            acc.transactions.some(tx => 
              tx.details.toLowerCase().includes(lowerSearch) ||
              tx.counterAccountName.toLowerCase().includes(lowerSearch)
            )
          )
      }))
      .filter(code => code.accounts.length > 0);
  }, [dataByCode, searchTerm]);

  // חישוב סכום כללי של כל הקודים
  const grandTotal = useMemo(() => {
    return filteredData.reduce((sum, codeGroup) => {
      const codeTotal = codeGroup.accounts.reduce((codeSum, account) => {
        return codeSum + account.total;
      }, 0);
      return sum + codeTotal;
    }, 0);
  }, [filteredData]);

  const toggleCode = (code: string) => {
    const newSet = new Set(expandedCodes);
    if (newSet.has(code)) {
      newSet.delete(code);
    } else {
      newSet.add(code);
    }
    setExpandedCodes(newSet);
  };

  const toggleAccount = (accountKey: number) => {
    const newSet = new Set(expandedAccounts);
    if (newSet.has(accountKey)) {
      newSet.delete(accountKey);
    } else {
      newSet.add(accountKey);
    }
    setExpandedAccounts(newSet);
  };

  const expandAll = () => {
    setExpandedCodes(new Set(filteredData.map(c => c.code)));
    setExpandedAccounts(new Set(filteredData.flatMap(c => c.accounts.map(a => a.accountKey))));
  };

  const collapseAll = () => {
    setExpandedCodes(new Set());
    setExpandedAccounts(new Set());
  };

  return (
    <div style={{ direction: 'rtl' }}>
      {/* כותרת ראשית */}
      <div style={{ 
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: '#f0fdf4',
        borderRadius: '8px',
        border: '1px solid #86efac'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '0.25rem' }}>
          📊 ביאורים לפי קוד מיון
        </h2>
        <p style={{ fontSize: '14px', color: '#166534', fontWeight: '500' }}>
          📁 מקור הנתונים: קובץ טרנזקציות (TransactionMonthlyModi.csv)
        </p>
      </div>

      {/* סינונים */}
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 חיפוש לפי שם חשבון, מספר חשבון או פרטים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px'
            }}
          />
          <button 
            onClick={expandAll}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            פתח הכל
          </button>
          <button 
            onClick={collapseAll}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            סגור הכל
          </button>
        </div>
      </div>

      {/* רשימת קודי מיון */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredData.map((code) => {
          const isCodeExpanded = expandedCodes.has(code.code);
          const codeTotal = code.accounts.reduce((sum, acc) => sum + acc.total, 0);

          return (
            <div key={code.code} style={{
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'white'
            }}>
              {/* כותרת קוד מיון */}
              <div
                onClick={() => toggleCode(code.code)}
                style={{
                  padding: '1rem',
                  backgroundColor: '#f3f4f6',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e5e7eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '18px' }}>
                    {isCodeExpanded ? '▼' : '◀'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '0.25rem' }}>
                      {code.code} - {code.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {code.accounts.length} חשבונות
                    </div>
                  </div>
                </div>
                <div style={{
                  fontWeight: 'bold',
                  fontSize: '18px',
                  color: '#000000'
                }}>
                  {formatCurrency(codeTotal)}
                </div>
              </div>

              {/* רשימת חשבונות */}
              {isCodeExpanded && (
                <div style={{ padding: '0.5rem' }}>
                  {code.accounts.map((account) => {
                    const isAccountExpanded = expandedAccounts.has(account.accountKey);

                    return (
                      <div key={account.accountKey} style={{
                        marginBottom: '0.5rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        overflow: 'hidden'
                      }}>
                        {/* כותרת חשבון */}
                        <div
                          onClick={() => toggleAccount(account.accountKey)}
                          style={{
                            padding: '0.75rem',
                            backgroundColor: '#fafafa',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '14px' }}>
                              {isAccountExpanded ? '▼' : '◀'}
                            </span>
                            <span style={{ fontWeight: '600' }}>
                              {account.accountKey} - {account.accountName}
                            </span>
                            <span style={{
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              fontSize: '11px'
                            }}>
                              {account.transactions.length} תנועות
                            </span>
                          </div>
                          <div style={{ fontWeight: 'bold', color: '#000000' }}>
                            {formatCurrency(account.total)}
                          </div>
                        </div>

                        {/* תנועות או סיכום חודשי */}
                        {isAccountExpanded && (
                          <div style={{ padding: '0.5rem 2rem' }}>
                            {account.accountKey === 40000 ? (
                              // כרטיס 40000 - סיכום חודשי
                              (() => {
                                const monthlySummary = getMonthlySummary(account.transactions);
                                return (
                                  <>
                                    <div style={{
                                      backgroundColor: '#fffbeb',
                                      padding: '10px',
                                      borderRadius: '6px',
                                      marginBottom: '10px',
                                      fontSize: '14px',
                                      color: '#92400e',
                                      fontWeight: '500',
                                      textAlign: 'center'
                                    }}>
                                      📊 סיכום חודשי - {account.transactions.length} תנועות כוללות
                                    </div>
                                    <table style={{
                                      width: '100%',
                                      fontSize: '14px',
                                      borderCollapse: 'collapse'
                                    }}>
                                      <thead>
                                        <tr style={{
                                          backgroundColor: '#f3f4f6',
                                          borderBottom: '2px solid #e5e7eb'
                                        }}>
                                          <th style={{ padding: '10px', textAlign: 'right' }}>חודש</th>
                                          <th style={{ padding: '10px', textAlign: 'center' }}>מס' תנועות</th>
                                          <th style={{ padding: '10px', textAlign: 'right' }}>סכום</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {monthlySummary.map((summary, idx) => (
                                          <tr key={summary.month} style={{
                                            borderBottom: '1px solid #e5e7eb',
                                            backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white'
                                          }}>
                                            <td style={{ padding: '8px', fontWeight: '600' }}>
                                              {MONTH_NAMES[summary.month - 1]}
                                            </td>
                                            <td style={{ 
                                              padding: '8px', 
                                              textAlign: 'center',
                                              color: '#6b7280'
                                            }}>
                                              {summary.count}
                                            </td>
                                            <td style={{
                                              padding: '8px',
                                              fontWeight: '600',
                                              color: '#000000',
                                              textAlign: 'right'
                                            }}>
                                              {formatCurrency(summary.total)}
                                            </td>
                                          </tr>
                                        ))}
                                        <tr style={{
                                          backgroundColor: '#fef3c7',
                                          fontWeight: 'bold',
                                          borderTop: '2px solid #f59e0b'
                                        }}>
                                          <td style={{ padding: '10px' }}>סה"כ</td>
                                          <td style={{ padding: '10px', textAlign: 'center' }}>
                                            {account.transactions.length}
                                          </td>
                                          <td style={{ 
                                            padding: '10px',
                                            color: '#000000',
                                            textAlign: 'right'
                                          }}>
                                            {formatCurrency(account.total)}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </>
                                );
                              })()
                            ) : (
                              // שאר הכרטיסים - כל התנועות
                              <table style={{
                                width: '100%',
                                fontSize: '13px',
                                borderCollapse: 'collapse',
                                tableLayout: 'fixed' // 🔥 יישור קבוע
                              }}>
                                <thead>
                                  <tr style={{ backgroundColor: '#f3f4f6' }}>
                                    <th style={{ 
                                      padding: '8px', 
                                      textAlign: 'right',
                                      width: '80px' 
                                    }}>תאריך</th>
                                    <th style={{ 
                                      padding: '8px', 
                                      textAlign: 'right',
                                      width: 'auto' 
                                    }}>תיאור</th>
                                    <th style={{ 
                                      padding: '8px', 
                                      textAlign: 'right',
                                      width: '120px'
                                    }}>סכום</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {account.transactions.map((tx, idx) => (
                                    <tr key={idx} style={{
                                      borderBottom: '1px solid #e5e7eb',
                                      backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white'
                                    }}>
                                      <td style={{ 
                                        padding: '6px',
                                        fontSize: '12px'
                                      }}>
                                        {tx.valueDate}
                                      </td>
                                      <td style={{ 
                                        padding: '6px',
                                        fontSize: '12px'
                                      }}>
                                        <div>{tx.details || tx.title}</div>
                                        {tx.counterAccountName && (
                                          <div style={{ fontSize: '11px', color: '#6b7280' }}>
                                            {tx.counterAccountName}
                                          </div>
                                        )}
                                      </td>
                                      <td style={{ 
                                        padding: '6px',
                                        fontWeight: 'bold',
                                        color: '#000000',
                                        fontSize: '12px'
                                      }}>
                                        {formatCurrency(tx.amount)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
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
      </div>

      {/* שורת סיכום כללית */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: '#f0fdf4',
        borderRadius: '8px',
        border: '2px solid #86efac',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontWeight: 'bold',
        fontSize: '18px'
      }}>
        <span style={{ color: '#166534' }}>סה"כ כללי:</span>
        <span style={{
          color: '#166534'
        }}>
          {formatCurrency(grandTotal)}
        </span>
      </div>
    </div>
  );
};

export default BiurimTab;