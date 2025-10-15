import React, { useMemo } from 'react';

// ==========================================
// Types
// ==========================================

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

interface AccountAlert {
  accountKey: number;
  accountName: string;
  sortCode: number;
  sortCodeName: string;
  totalBalance: number;
  months: { [month: number]: number };
}

interface MissingTransactionsAlert {
  count: number;
  severity: 'low' | 'medium' | 'high';
}

interface AlertsSystemProps {
  transactions: Transaction[];
  trialBalance: TrialBalanceRecord[];
  formatCurrency: (amount: number) => string;
  totalRowsInFile?: number;
}

const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

// ==========================================
// Component
// ==========================================

const AlertsSystem: React.FC<AlertsSystemProps> = ({
  transactions,
  trialBalance,
  formatCurrency,
  totalRowsInFile
}) => {
  // ⭐ לוגיקה מתוקנת: חשבונות במאזן אבל ללא תנועות
  const accountsInBalanceNoTransactions = useMemo((): AccountAlert[] => {
    // קבוצת חשבונות שיש להם תנועות
    const accountsWithTransactions = new Set(
      transactions.map(tx => tx.accountKey)
    );
    
    return trialBalance
      .filter(tb => {
        // יש יתרה בלפחות חודש אחד
        const hasBalance = Object.values(tb.months).some(
          amount => Math.abs(amount) > 0.01
        );
        
        // אבל אין תנועות בקובץ התנועות
        const hasTransactions = accountsWithTransactions.has(tb.accountKey);
        
        return hasBalance && !hasTransactions;
      })
      .map(tb => ({
        accountKey: tb.accountKey,
        accountName: tb.accountName,
        sortCode: tb.sortCode,
        sortCodeName: tb.sortCodeName,
        totalBalance: Object.values(tb.months).reduce((sum, val) => sum + val, 0),
        months: tb.months
      }))
      .sort((a, b) => a.sortCode - b.sortCode);
  }, [transactions, trialBalance]);

  // אזהרה על תנועות חסרות
  const missingTransactionsAlert = useMemo((): MissingTransactionsAlert | null => {
    if (!totalRowsInFile) return null;
    
    const actualCount = transactions.length;
    const missing = totalRowsInFile - actualCount;
    
    if (missing > 0) {
      return {
        count: missing,
        severity: missing > 500 ? 'high' : missing > 100 ? 'medium' : 'low'
      };
    }
    return null;
  }, [transactions, totalRowsInFile]);

  // קיבוץ לפי קוד מיון
  const accountsByCode = useMemo(() => {
    const grouped = new Map<number, AccountAlert[]>();
    
    accountsInBalanceNoTransactions.forEach(acc => {
      if (!grouped.has(acc.sortCode)) {
        grouped.set(acc.sortCode, []);
      }
      grouped.get(acc.sortCode)!.push(acc);
    });
    
    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([code, accounts]) => ({
        code,
        name: accounts[0].sortCodeName,
        accounts
      }));
  }, [accountsInBalanceNoTransactions]);

  const hasAlerts = accountsInBalanceNoTransactions.length > 0 || missingTransactionsAlert !== null;

  if (!hasAlerts) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{
          backgroundColor: '#d1fae5',
          border: '2px solid #10b981',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <h2 style={{
            margin: '0 0 12px 0',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#065f46'
          }}>
            אין אזהרות!
          </h2>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: '#047857'
          }}>
            כל הנתונים תקינים ומאוזנים
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{
        margin: '0 0 24px 0',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#111827'
      }}>
        ⚠️ אזהרות ובקרות
      </h2>

      {/* אזהרה 1: תנועות חסרות */}
      {missingTransactionsAlert && (
        <div style={{
          backgroundColor: missingTransactionsAlert.severity === 'high' ? '#fee2e2' :
                          missingTransactionsAlert.severity === 'medium' ? '#fef3c7' : '#dbeafe',
          border: `2px solid ${
            missingTransactionsAlert.severity === 'high' ? '#dc2626' :
            missingTransactionsAlert.severity === 'medium' ? '#f59e0b' : '#3b82f6'
          }`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px'
          }}>
            <div style={{
              fontSize: '48px',
              lineHeight: 1
            }}>
              {missingTransactionsAlert.severity === 'high' ? '🚨' :
               missingTransactionsAlert.severity === 'medium' ? '⚠️' : 'ℹ️'}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '20px',
                fontWeight: 'bold',
                color: missingTransactionsAlert.severity === 'high' ? '#991b1b' :
                       missingTransactionsAlert.severity === 'medium' ? '#92400e' : '#1e40af'
              }}>
                חסרות {missingTransactionsAlert.count.toLocaleString()} תנועות בקובץ!
              </h3>
              <p style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                lineHeight: '1.6',
                color: missingTransactionsAlert.severity === 'high' ? '#7f1d1d' :
                       missingTransactionsAlert.severity === 'medium' ? '#78350f' : '#1e3a8a'
              }}>
                היו <strong>{totalRowsInFile?.toLocaleString()}</strong> שורות בקובץ המקורי,
                אבל נטענו רק <strong>{transactions.length.toLocaleString()}</strong> תנועות.
                <br />
                התנועות החסרות עלולות להשפיע על דיוק הדוחות.
              </p>
              <div style={{
                backgroundColor: 'white',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '13px'
              }}>
                <strong>סיבות אפשריות:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingRight: '20px' }}>
                  <li>תנועות ללא חודש (month = 0)</li>
                  <li>תנועות ללא חשבון (accountKey = 0)</li>
                  <li>תנועות עם קוד מיון לא רלוונטי</li>
                  <li>תנועות מבטלות (כרטיס 40000)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* אזהרה 2: חשבונות במאזן ללא תנועות */}
      {accountsInBalanceNoTransactions.length > 0 && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '2px solid #dc2626',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              fontSize: '48px',
              lineHeight: 1
            }}>
              ⚠️
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#991b1b'
              }}>
                {accountsInBalanceNoTransactions.length} חשבונות עם יתרה במאזן בוחן אבל ללא תנועות!
              </h3>
              <p style={{
                margin: 0,
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#7f1d1d'
              }}>
                חשבונות אלו דורשים בדיקה בהנהלת חשבונות - יש להם יתרה במאזן בוחן 
                אבל לא נמצאו תנועות עבורם בקובץ התנועות החודשי.
                זה יכול להעיד על בעיה בקובץ התנועות או על חשבונות לא פעילים.
              </p>
            </div>
          </div>

          {/* רשימת חשבונות לפי קוד מיון */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {accountsByCode.map((group, groupIdx) => (
              <div
                key={group.code}
                style={{
                  borderBottom: groupIdx < accountsByCode.length - 1 ? '2px solid #f3f4f6' : 'none'
                }}
              >
                {/* Header קוד מיון */}
                <div style={{
                  backgroundColor: '#fef2f2',
                  padding: '12px 16px',
                  fontWeight: 'bold',
                  color: '#991b1b',
                  borderBottom: '1px solid #fecaca'
                }}>
                  קוד {group.code} - {group.name} ({group.accounts.length} חשבונות)
                </div>

                {/* חשבונות */}
                {group.accounts.map((acc, accIdx) => (
                  <div
                    key={acc.accountKey}
                    style={{
                      padding: '16px',
                      borderBottom: accIdx < group.accounts.length - 1 ? '1px solid #f3f4f6' : 'none',
                      backgroundColor: accIdx % 2 === 0 ? 'white' : '#fafafa'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 'bold',
                          color: '#111827',
                          marginBottom: '4px'
                        }}>
                          חשבון {acc.accountKey} - {acc.accountName}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          קוד מיון: {acc.sortCode} ({acc.sortCodeName})
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: '#fecaca',
                        color: '#7f1d1d',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        fontFamily: 'monospace'
                      }}>
                        {formatCurrency(acc.totalBalance)}
                      </div>
                    </div>

                    {/* פירוט יתרות חודשיות */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                      gap: '8px',
                      backgroundColor: '#fef2f2',
                      padding: '12px',
                      borderRadius: '6px'
                    }}>
                      {Object.entries(acc.months)
                        .filter(([_, amount]) => Math.abs(amount) > 0.01)
                        .sort((a, b) => Number(a[0]) - Number(b[0]))
                        .map(([month, amount]) => (
                          <div
                            key={month}
                            style={{
                              fontSize: '11px',
                              textAlign: 'center'
                            }}
                          >
                            <div style={{
                              color: '#991b1b',
                              fontWeight: '600',
                              marginBottom: '2px'
                            }}>
                              {MONTH_NAMES[Number(month) - 1]}
                            </div>
                            <div style={{
                              color: '#7f1d1d',
                              fontFamily: 'monospace',
                              fontSize: '10px'
                            }}>
                              {formatCurrency(amount)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsSystem;