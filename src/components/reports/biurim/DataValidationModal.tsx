import React from 'react';

interface RejectedSample {
  rowNumber: number;
  reason: string;
  accountKey?: number;
  accountName?: string;
  sortCode?: number;
  amount?: number;
  date?: string;
}

interface ValidationResult {
  totalRowsInFile: number;
  totalLoaded: number;
  totalRejected: number;
  rejectedNoMonth: number;
  rejectedNoAccount: number;
  rejectedWrongCode: number;
  canceledTransactions: number;
  expectedSum: number;
  actualSum: number;
  rejectedSamples: RejectedSample[];
  summaryBlock?: {
    found: boolean;
    startRow: number;
    expectedTransactions: number;
    expectedSum: number;
  };
  summaryValidation?: {
    summaryFound: boolean;
    expectedTransactions: number;
    actualTransactions: number;
    expectedSum: number;
    actualSum: number;
    transactionsMatch: boolean;
    sumMatch: boolean;
  };
}

interface DataValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ValidationResult;
}

const DataValidationModal: React.FC<DataValidationModalProps> = ({
  isOpen,
  onClose,
  result
}) => {
  if (!isOpen) return null;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const sumDiff = Math.abs(result.expectedSum - result.actualSum);
  const sumMatches = sumDiff <= 5;
  const actualRejected = result.totalRejected - 3;
  const summaryRowsSkipped = 3;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        direction: 'rtl'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '12px 12px 0 0',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '20px',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            ×
          </button>
          
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '32px' }}>🎉</span>
            קובץ נטען בהצלחה!
          </h2>
          <p style={{
            margin: '8px 0 0 0',
            opacity: 0.9,
            fontSize: '14px'
          }}>
            סיכום מפורט של תהליך הטעינה
          </p>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '2px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📦</div>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                סה״כ בקובץ
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>
                {result.totalRowsInFile.toLocaleString()}
              </div>
            </div>

            <div style={{
              backgroundColor: '#d1fae5',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '2px solid #10b981'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
              <div style={{ fontSize: '12px', color: '#065f46', marginBottom: '4px' }}>
                נטענו בהצלחה
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#065f46' }}>
                {result.totalLoaded.toLocaleString()}
              </div>
            </div>

            {actualRejected > 0 && (
              <div style={{
                backgroundColor: '#fee2e2',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center',
                border: '2px solid #dc2626'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🗑️</div>
                <div style={{ fontSize: '12px', color: '#991b1b', marginBottom: '4px' }}>
                  נדחו (בעיות)
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#991b1b' }}>
                  {actualRejected.toLocaleString()}
                </div>
              </div>
            )}

            <div style={{
              backgroundColor: '#dbeafe',
              padding: '20px',
              borderRadius: '8px',
              textAlign: 'center',
              border: '2px solid #3b82f6'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📊</div>
              <div style={{ fontSize: '12px', color: '#1e40af', marginBottom: '4px' }}>
                שורות סיכום
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e3a8a' }}>
                {summaryRowsSkipped}
              </div>
            </div>
          </div>

          {/* סיכום בדיקה */}
          <div style={{
            backgroundColor: result.summaryValidation?.transactionsMatch && sumMatches ? '#d1fae5' : '#fee2e2',
            padding: '20px',
            borderRadius: '8px',
            border: result.summaryValidation?.transactionsMatch && sumMatches ? '2px solid #10b981' : '2px solid #dc2626',
            marginBottom: '20px'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '20px',
              fontWeight: 'bold',
              color: result.summaryValidation?.transactionsMatch && sumMatches ? '#065f46' : '#991b1b',
              textAlign: 'center'
            }}>
              {result.summaryValidation?.transactionsMatch && sumMatches ? '✅ בדיקה תקינה!' : '❌ נמצאו בעיות'}
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  מספר תנועות
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: result.summaryValidation?.transactionsMatch ? '#059669' : '#dc2626' }}>
                  {result.summaryValidation?.transactionsMatch ? '✅' : '❌'}
                </div>
                <div style={{ fontSize: '14px', color: '#374151', marginTop: '8px' }}>
                  צפוי: {result.summaryValidation?.expectedTransactions.toLocaleString()}
                  <br />
                  בפועל: {result.summaryValidation?.actualTransactions.toLocaleString()}
                </div>
              </div>

              <div style={{
                backgroundColor: 'white',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  סכום כולל
                </div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: sumMatches ? '#059669' : '#dc2626' }}>
                  {sumMatches ? '✅' : '❌'}
                </div>
                <div style={{ fontSize: '14px', color: '#374151', marginTop: '8px' }}>
                  צפוי: {formatCurrency(result.summaryValidation?.expectedSum || 0)}
                  <br />
                  בפועל: {formatCurrency(result.summaryValidation?.actualSum || 0)}
                  {sumDiff > 0 && (
                    <>
                      <br />
                      <span style={{ fontSize: '12px', color: sumMatches ? '#059669' : '#dc2626' }}>
                        הפרש: {formatCurrency(sumDiff)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* פירוט דחיות */}
          {actualRejected > 0 && (
            <div style={{
              backgroundColor: '#fef3c7',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #f59e0b'
            }}>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#78350f'
              }}>
                📋 פירוט סיבות דחייה
              </h3>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                {result.rejectedNoMonth > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px'
                  }}>
                    <span>❌ חסר חודש תקין</span>
                    <strong>{result.rejectedNoMonth.toLocaleString()}</strong>
                  </div>
                )}

                {result.rejectedNoAccount > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px'
                  }}>
                    <span>❌ חסר מפתח חשבון</span>
                    <strong>{result.rejectedNoAccount.toLocaleString()}</strong>
                  </div>
                )}

                {result.rejectedWrongCode > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px'
                  }}>
                    <span>ℹ️ קוד מיון לא רלוונטי</span>
                    <strong>{result.rejectedWrongCode.toLocaleString()}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* רשימת כל הנדחות */}
          {result.rejectedSamples.length > 0 && (
            <div style={{
              marginTop: '24px',
              padding: '20px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#374151'
              }}>
                🔍 רשימת תנועות שנדחו ({result.rejectedSamples.length})
              </h3>
              
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                maxHeight: '300px',
                overflow: 'auto',
                backgroundColor: 'white',
                padding: '12px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                border: '1px solid #e5e7eb'
              }}>
                {result.rejectedSamples.map((sample, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px',
                      borderBottom: idx < result.rejectedSamples.length - 1 ? '1px solid #f3f4f6' : 'none'
                    }}
                  >
                    <div style={{ color: '#dc2626', fontWeight: 'bold', marginBottom: '4px' }}>
                      שורה {sample.rowNumber}: {sample.reason}
                    </div>
                    {sample.accountKey !== undefined && sample.accountKey > 0 && (
                      <div style={{ color: '#6b7280' }}>
                        חשבון: {sample.accountKey} | {sample.accountName}
                      </div>
                    )}
                    {sample.sortCode !== undefined && (
                      <div style={{ color: '#6b7280' }}>
                        קוד מיון: {sample.sortCode}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#059669'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#10b981'}
            >
              הבנתי, תודה!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataValidationModal;