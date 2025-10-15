import React, { useState, useMemo } from 'react';

const MONTH_NAMES_SHORT = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];

interface TrialBalanceRecord {
  accountKey: number;
  accountName: string;
  sortCode: number;
  sortCodeName: string;
  months: { [month: number]: number };
}

interface BalancesTabProps {
  trialBalance: TrialBalanceRecord[];
  activeMonths: number[];
  formatCurrency: (amount: number) => string;
}

const BalancesTab: React.FC<BalancesTabProps> = ({ 
  trialBalance,
  activeMonths, 
  formatCurrency 
}) => {
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  if (!trialBalance || trialBalance.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '16px' }}>
        טוען נתוני מאזן בוחן...
      </div>
    );
  }

  const dataByCode = useMemo(() => {
    const codeMap = new Map<string, {
      code: string;
      name: string;
      accounts: TrialBalanceRecord[];
      total: number;
    }>();

    trialBalance.forEach((tb) => {
      const sortCodeStr = tb.sortCode.toString();
      
      if (!codeMap.has(sortCodeStr)) {
        codeMap.set(sortCodeStr, {
          code: sortCodeStr,
          name: tb.sortCodeName || `קוד ${sortCodeStr}`,
          accounts: [],
          total: 0
        });
      }

      const codeGroup = codeMap.get(sortCodeStr)!;
      const accountTotal = activeMonths.reduce((sum, month) => sum + (tb.months[month] || 0), 0);
      
      codeGroup.accounts.push(tb);
      codeGroup.total += accountTotal;
    });

    return Array.from(codeMap.values()).sort((a, b) => parseInt(a.code) - parseInt(b.code));
  }, [trialBalance, activeMonths]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return dataByCode;
    
    const lowerSearch = searchTerm.toLowerCase();
    return dataByCode
      .map(code => ({
        ...code,
        accounts: code.accounts.filter(acc =>
          acc.accountName.toLowerCase().includes(lowerSearch) ||
          acc.accountKey.toString().includes(lowerSearch)
        )
      }))
      .filter(code => code.accounts.length > 0);
  }, [dataByCode, searchTerm]);

  const grandTotal = useMemo(() => {
    return filteredData.reduce((sum, code) => sum + code.total, 0);
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

  const expandAll = () => {
    setExpandedCodes(new Set(filteredData.map(c => c.code)));
  };

  const collapseAll = () => {
    setExpandedCodes(new Set());
  };

  return (
    <div style={{ direction: 'rtl' }}>
      <div style={{ 
        marginBottom: '1.5rem',
        padding: '1rem',
        backgroundColor: '#f0fdf4',
        borderRadius: '8px',
        border: '1px solid #86efac'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '0.25rem' }}>
          💰 יתרות מאזניות
        </h2>
        <p style={{ fontSize: '14px', color: '#166534', fontWeight: '500' }}>
          📁 מקור הנתונים: מאזן בוחן (BalanceMonthlyModi.csv)
        </p>
      </div>

      <div style={{
        backgroundColor: '#f9fafb',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1rem',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="חיפוש לפי שם חשבון או מספר..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '300px',
              padding: '0.5rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <button onClick={expandAll} style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px'
          }}>
            פתח הכל
          </button>
          <button onClick={collapseAll} style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px'
          }}>
            סגור הכל
          </button>
        </div>

        <div style={{
          padding: '0.75rem',
          backgroundColor: 'white',
          borderRadius: '6px',
          display: 'flex',
          gap: '2rem',
          fontSize: '13px',
          color: '#6b7280'
        }}>
          <span><strong>{filteredData.length}</strong> קודי מיון</span>
          <span><strong>{filteredData.reduce((sum, c) => sum + c.accounts.length, 0)}</strong> חשבונות</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredData.map((code) => {
          const isExpanded = expandedCodes.has(code.code);

          return (
            <div key={code.code} style={{
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'white'
            }}>
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
                    {isExpanded ? '▼' : '◀'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                      {code.code} - {code.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                      {code.accounts.length} חשבונות
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#000000' }}>
                  {formatCurrency(code.total)}
                </div>
              </div>

              {isExpanded && (
                <div style={{ overflowX: 'auto', padding: '1rem' }}>
                  <table style={{
                    width: '100%',
                    fontSize: '13px',
                    borderCollapse: 'collapse',
                    minWidth: '1200px'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ 
                          padding: '10px 12px', 
                          textAlign: 'right', 
                          fontWeight: '600',
                          position: 'sticky',
                          right: 0,
                          backgroundColor: '#f9fafb',
                          minWidth: '100px'
                        }}>
                          מפתח
                        </th>
                        <th style={{ 
                          padding: '10px 12px', 
                          textAlign: 'right', 
                          fontWeight: '600',
                          position: 'sticky',
                          right: '100px',
                          backgroundColor: '#f9fafb',
                          minWidth: '200px'
                        }}>
                          שם חשבון
                        </th>
                        {(activeMonths || []).map(month => (
                          <th key={month} style={{ 
                            padding: '10px 12px', 
                            textAlign: 'center', 
                            fontWeight: '600',
                            minWidth: '90px'
                          }}>
                            {MONTH_NAMES_SHORT[month - 1]}
                          </th>
                        ))}
                        <th style={{ 
                          padding: '10px 12px', 
                          textAlign: 'center', 
                          fontWeight: '600',
                          backgroundColor: '#fef3c7',
                          minWidth: '100px'
                        }}>
                          סה"כ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {code.accounts.map((account, index) => {
                        const accountTotal = activeMonths.reduce((sum, month) => sum + (account.months[month] || 0), 0);
                        
                        return (
                          <tr key={account.accountKey} style={{
                            backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
                            borderBottom: '1px solid #f3f4f6'
                          }}>
                            <td style={{ 
                              padding: '8px 12px', 
                              fontWeight: '500',
                              position: 'sticky',
                              right: 0,
                              backgroundColor: index % 2 === 0 ? 'white' : '#fafafa'
                            }}>
                              {account.accountKey}
                            </td>
                            <td style={{ 
                              padding: '8px 12px',
                              position: 'sticky',
                              right: '100px',
                              backgroundColor: index % 2 === 0 ? 'white' : '#fafafa'
                            }}>
                              {account.accountName}
                            </td>
                            {(activeMonths || []).map(month => {
                              const amount = account.months[month] || 0;
                              return (
                                <td key={month} style={{ 
                                  padding: '8px 12px', 
                                  textAlign: 'center',
                                  color: Math.abs(amount) < 0.01 ? '#9ca3af' : '#000000',
                                  fontWeight: Math.abs(amount) < 0.01 ? 'normal' : '500'
                                }}>
                                  {Math.abs(amount) < 0.01 ? '-' : formatCurrency(amount)}
                                </td>
                              );
                            })}
                            <td style={{ 
                              padding: '8px 12px', 
                              textAlign: 'center',
                              fontWeight: 'bold',
                              backgroundColor: '#fffbeb',
                              color: '#000000'
                            }}>
                              {formatCurrency(accountTotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        backgroundColor: '#f0fdf4',
        borderRadius: '8px',
        border: '2px solid #10b981'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#064e3b' }}>
            סה"כ כללי - יתרות מאזניות
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#064e3b' }}>
            {formatCurrency(grandTotal)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalancesTab;