import React, { useMemo } from 'react';

const MONTH_NAMES_SHORT = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];

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

interface AnalyticsTabProps {
  dataByCode: CodeGroup[];
  transactions: Transaction[];
  formatCurrency: (amount: number) => string;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ dataByCode, transactions, formatCurrency }) => {
  const codeAnalysis = useMemo(() => {
    return dataByCode.map(code => {
      const total = code.accounts.reduce((sum, acc) => sum + acc.total, 0);
      const accountCount = code.accounts.length;
      const transactionCount = code.accounts.reduce((sum, acc) => sum + acc.transactions.length, 0);
      
      return {
        code: code.code,
        name: code.name,
        total,
        accountCount,
        transactionCount,
        avgPerAccount: accountCount > 0 ? total / accountCount : 0
      };
    }).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  }, [dataByCode]);

  const monthlyAnalysis = useMemo(() => {
    const months: { [month: number]: { total: number; count: number } } = {};
    
    transactions.forEach(tx => {
      if (!months[tx.month]) {
        months[tx.month] = { total: 0, count: 0 };
      }
      months[tx.month].total += tx.amount;
      months[tx.month].count++;
    });

    return Object.entries(months)
      .map(([month, data]) => ({
        month: parseInt(month),
        monthName: MONTH_NAMES_SHORT[parseInt(month) - 1],
        total: data.total,
        count: data.count,
        avg: data.count > 0 ? data.total / data.count : 0
      }))
      .sort((a, b) => a.month - b.month);
  }, [transactions]);

  const topAccounts = useMemo(() => {
    const accountMap = new Map<number, {
      accountKey: number;
      accountName: string;
      total: number;
      count: number;
    }>();

    transactions.forEach(tx => {
      if (!accountMap.has(tx.accountKey)) {
        accountMap.set(tx.accountKey, {
          accountKey: tx.accountKey,
          accountName: tx.accountName,
          total: 0,
          count: 0
        });
      }
      const acc = accountMap.get(tx.accountKey)!;
      acc.total += Math.abs(tx.amount);
      acc.count++;
    });

    return Array.from(accountMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [transactions]);

  const generalStats = useMemo(() => {
    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const totalAbsAmount = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const avgTransaction = transactions.length > 0 ? totalAbsAmount / transactions.length : 0;
    const uniqueAccounts = new Set(transactions.map(tx => tx.accountKey)).size;

    return {
      totalTransactions: transactions.length,
      totalAmount,
      totalAbsAmount,
      avgTransaction,
      uniqueAccounts
    };
  }, [transactions]);

  return (
    <div style={{ direction: 'rtl' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{
          backgroundColor: '#dbeafe',
          padding: '1rem',
          borderRadius: '8px',
          border: '2px solid #3b82f6'
        }}>
          <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '4px' }}>סה"כ תנועות</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a' }}>
            {generalStats.totalTransactions.toLocaleString()}
          </div>
        </div>
        <div style={{
          backgroundColor: '#d1fae5',
          padding: '1rem',
          borderRadius: '8px',
          border: '2px solid #10b981'
        }}>
          <div style={{ fontSize: '12px', color: '#065f46', marginBottom: '4px' }}>יתרה נטו</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#064e3b' }}>
            {formatCurrency(generalStats.totalAmount)}
          </div>
        </div>
        <div style={{
          backgroundColor: '#fef3c7',
          padding: '1rem',
          borderRadius: '8px',
          border: '2px solid #f59e0b'
        }}>
          <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '4px' }}>ממוצע תנועה</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#78350f' }}>
            {formatCurrency(generalStats.avgTransaction)}
          </div>
        </div>
        <div style={{
          backgroundColor: '#e9d5ff',
          padding: '1rem',
          borderRadius: '8px',
          border: '2px solid #a855f7'
        }}>
          <div style={{ fontSize: '12px', color: '#6b21a8', marginBottom: '4px' }}>חשבונות ייחודיים</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#581c87' }}>
            {generalStats.uniqueAccounts}
          </div>
        </div>
      </div>

      <div style={{
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '1rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>ניתוח לפי קודי מיון</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            fontSize: '13px',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#fafafa', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'right' }}>קוד</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>שם</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>חשבונות</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>תנועות</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>סה"כ</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>ממוצע לחשבון</th>
              </tr>
            </thead>
            <tbody>
              {codeAnalysis.map((code, idx) => (
                <tr key={code.code} style={{
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa'
                }}>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{code.code}</td>
                  <td style={{ padding: '10px' }}>{code.name}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{code.accountCount}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{code.transactionCount.toLocaleString()}</td>
                  <td style={{
                    padding: '10px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: code.total >= 0 ? '#059669' : '#dc2626'
                  }}>
                    {formatCurrency(code.total)}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {formatCurrency(code.avgPerAccount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '1rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>ניתוח חודשי</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            fontSize: '13px',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#fafafa', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'right' }}>חודש</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>תנועות</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>סה"כ</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>ממוצע</th>
              </tr>
            </thead>
            <tbody>
              {monthlyAnalysis.map((month, idx) => (
                <tr key={month.month} style={{
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: idx % 2 === 0 ? 'white' : '#fafafa'
                }}>
                  <td style={{ padding: '10px', fontWeight: '600' }}>
                    {month.monthName} (חודש {month.month})
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{month.count.toLocaleString()}</td>
                  <td style={{
                    padding: '10px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    color: month.total >= 0 ? '#059669' : '#dc2626'
                  }}>
                    {formatCurrency(month.total)}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {formatCurrency(month.avg)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '1rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>10 חשבונות מובילים (לפי מחזור)</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            fontSize: '13px',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#fafafa', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '12px', textAlign: 'right' }}>דירוג</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>מס' חשבון</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>שם חשבון</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>תנועות</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>סה"כ מחזור</th>
              </tr>
            </thead>
            <tbody>
              {topAccounts.map((acc, idx) => (
                <tr key={acc.accountKey} style={{
                  borderBottom: '1px solid #f3f4f6',
                  backgroundColor: idx < 3 ? '#fef3c7' : (idx % 2 === 0 ? 'white' : '#fafafa')
                }}>
                  <td style={{
                    padding: '10px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: idx < 3 ? '#92400e' : '#374151'
                  }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '10px', fontWeight: '600' }}>{acc.accountKey}</td>
                  <td style={{ padding: '10px' }}>{acc.accountName}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{acc.count.toLocaleString()}</td>
                  <td style={{
                    padding: '10px',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    {formatCurrency(acc.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;